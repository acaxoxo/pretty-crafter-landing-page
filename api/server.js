import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getConnection } from './db.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

app.use(limiter);
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

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

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/orders', async (req, res) => {
  const validationError = validateOrderPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { customer, items, payment_method, delivery_method, notes } = req.body;
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
      throw new Error('Produk tidak ditemukan atau jumlah item tidak valid.');
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

    return res.status(201).json({
      order_id: orderId,
      order_code: orderCode,
      total_amount: totalAmount
    });
  } catch (error) {
    console.error('Order create failed:', error);
    await connection.rollback();
    return res.status(500).json({ error: error.message || 'Gagal membuat order.' });
  } finally {
    connection.release();
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`API running on port ${process.env.PORT || 3001}`);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});
