import { getConnection } from './db.js';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const rateLimitStore = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 30;
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count += 1;
  return false;
};

const setCorsHeaders = (res, origin) => {
  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    return false;
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return true;
};

const parseJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
};

const buildOrderCode = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PC-${datePart}-${rand}`;
};

const validateOrderPayload = (payload) => {
  if (!payload) return 'Payload tidak valid.';
  const { customer, items } = payload;
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    return 'Data customer wajib diisi: name, phone, address.';
  }
  if (!Array.isArray(items) || items.length === 0) {
    return 'Items minimal 1 produk.';
  }
  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.qty) || item.qty <= 0) {
      return 'Item tidak valid. Pastikan product_id dan qty.';
    }
  }
  return null;
};

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (!setCorsHeaders(res, origin)) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Not allowed by CORS' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }));
    return;
  }

  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch (error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Payload tidak valid.' }));
    return;
  }

  const validationError = validateOrderPayload(payload);
  if (validationError) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: validationError }));
    return;
  }

  const { customer, items, payment_method, delivery_method, notes } = payload;
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const [existingCustomers] = await connection.query(
      'SELECT id FROM customers WHERE phone = ? LIMIT 1',
      [customer.phone]
    );

    let customerId = existingCustomers[0]?.id;
    if (!customerId) {
      const [insertCustomer] = await connection.query(
        'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
        [customer.name, customer.phone, customer.email || null, customer.address]
      );
      customerId = insertCustomer.insertId;
    }

    const productIds = items.map((item) => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    if (products.length !== items.length) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Produk tidak ditemukan atau jumlah item tidak valid.' }));
      await connection.rollback();
      return;
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    let totalAmount = 0;

    const normalizedItems = items.map((item) => {
      const product = productMap.get(item.product_id);
      const subtotal = product.price * item.qty;
      totalAmount += subtotal;
      return {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        qty: item.qty,
        subtotal
      };
    });

    const orderCode = buildOrderCode();
    const [insertOrder] = await connection.query(
      `INSERT INTO orders
        (customer_id, order_code, order_date, total_amount, payment_method, delivery_method, status, notes)
       VALUES (?, ?, NOW(), ?, ?, ?, 'new', ?)` ,
      [customerId, orderCode, totalAmount, payment_method || null, delivery_method || null, notes || null]
    );

    const orderId = insertOrder.insertId;

    for (const item of normalizedItems) {
      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, price, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.price, item.qty, item.subtotal]
      );
    }

    await connection.commit();

    res.statusCode = 201;
    res.end(JSON.stringify({
      order_id: orderId,
      order_code: orderCode,
      total_amount: totalAmount
    }));
  } catch (error) {
    console.error('Order create failed:', error);
    await connection.rollback();
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message || 'Gagal membuat order.' }));
  } finally {
    connection.release();
  }
}
