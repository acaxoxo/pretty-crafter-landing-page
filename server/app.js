import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getConnection } from './db.js';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, '').toLowerCase())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/$/, '').toLowerCase();

      if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.startsWith('http://localhost:') ||
        normalizedOrigin.startsWith('http://127.0.0.1:') ||
        normalizedOrigin === 'http://localhost' ||
        normalizedOrigin === 'http://127.0.0.1'
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(null, false);
    },
    credentials: true
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
const adminSessionTtlMs = 8 * 60 * 60 * 1000;
const sessionSecret = process.env.SESSION_SECRET || 'pretty-crafter-default-secret-key-12345';

const createSignedToken = (data) => {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifySignedToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.expiresAt && data.expiresAt <= Date.now()) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

const getAdminCredentials = () => ({
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD
});

const isValidAdminCredential = (username, password) => {
  const creds = getAdminCredentials();
  return Boolean(
    creds.username &&
      creds.password &&
      username === creds.username &&
      password === creds.password
  );
};

const createAdminSession = () => {
  const expiresAt = Date.now() + adminSessionTtlMs;
  const token = createSignedToken({ expiresAt });
  return { token, expiresAt };
};

const getAdminSession = (token) => {
  return verifySignedToken(token);
};

const revokeAdminSession = (token) => {
  // Stateless token cannot be revoked easily without store.
};

const requireAdminAuth = (req, res, next) => {
  const authHeader = req.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  const session = getAdminSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminToken = token;
  next();
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

const parseContentValue = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return trimmed;
    }
  }
  return trimmed;
};

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/public/products', async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT id, name, price, description, image_url
       FROM products
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Public products fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  } finally {
    connection.release();
  }
});

app.get('/api/public/content', async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT content_key, content_value
       FROM site_content
       WHERE content_key IN ('promo_banner', 'testimonials', 'contact_info')`
    );

    const content = rows.reduce((acc, row) => {
      acc[row.content_key] = parseContentValue(row.content_value);
      return acc;
    }, {});

    res.json({
      promo: content.promo_banner || null,
      testimonials: content.testimonials || [],
      contact: content.contact_info || null
    });
  } catch (error) {
    console.error('Public content fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat konten.' });
  } finally {
    connection.release();
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const creds = getAdminCredentials();

  if (!creds.username || !creds.password) {
    return res.status(500).json({ error: 'Admin credentials not configured.' });
  }

  if (!isValidAdminCredential(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const { token, expiresAt } = createAdminSession();
  return res.json({ token, expiresAt });
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  revokeAdminSession(req.adminToken);
  res.json({ ok: true });
});

app.get('/api/admin/session', requireAdminAuth, (req, res) => {
  res.json({ ok: true });
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, message } = req.body || {};
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Nama, nomor HP, dan pesan wajib diisi.' });
  }

  const connection = await getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO leads (name, phone, message, status)
       VALUES (?, ?, ?, 'new')`,
      [name.trim(), phone.trim(), message.trim()]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Lead create failed:', error);
    return res.status(500).json({ error: 'Gagal menyimpan lead.' });
  } finally {
    connection.release();
  }
});

app.get('/api/site-meta', async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM site_meta LIMIT 1');
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Site meta fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat meta.' });
  } finally {
    connection.release();
  }
});

app.put('/api/admin/site-meta', requireAdminAuth, async (req, res) => {
  const { page_title, meta_description, keywords, og_image_url } = req.body || {};
  const connection = await getConnection();
  try {
    const [rows] = await connection.query('SELECT id FROM site_meta LIMIT 1');
    if (rows[0]?.id) {
      await connection.query(
        `UPDATE site_meta
         SET page_title = ?, meta_description = ?, keywords = ?, og_image_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [page_title || null, meta_description || null, keywords || null, og_image_url || null, rows[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO site_meta (page_title, meta_description, keywords, og_image_url)
         VALUES (?, ?, ?, ?)`,
        [page_title || null, meta_description || null, keywords || null, og_image_url || null]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Site meta update failed:', error);
    res.status(500).json({ error: 'Gagal menyimpan meta.' });
  } finally {
    connection.release();
  }
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

app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT id, name, price, description, image_url, is_active
       FROM products
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Products fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  } finally {
    connection.release();
  }
});

app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
  const { id, name, price, description, image_url, is_active } = req.body || {};
  if (!id || !name || !Number.isFinite(price)) {
    return res.status(400).json({ error: 'ID, nama, dan harga wajib diisi.' });
  }

  const connection = await getConnection();
  try {
    await connection.query(
      `INSERT INTO products (id, name, price, description, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [id.trim(), name.trim(), price, description || null, image_url || null, is_active ? 1 : 0]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Product create failed:', error);
    res.status(500).json({ error: 'Gagal menambah produk.' });
  } finally {
    connection.release();
  }
});

app.patch('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  const productId = req.params.id;
  const { name, price, description, image_url, is_active } = req.body || {};

  if (price !== undefined && !Number.isFinite(price)) {
    return res.status(400).json({ error: 'Harga tidak valid.' });
  }

  const updates = {
    name,
    price,
    description,
    image_url,
    is_active
  };

  const fields = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (fields.length === 0) {
    return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
  }

  const setClause = fields.map(([key]) => `${key} = ?`).join(', ');
  const normalizedValues = fields.map(([key, value]) => {
    if (key === 'is_active') return value ? 1 : 0;
    return value;
  });

  const connection = await getConnection();
  try {
    await connection.query(
      `UPDATE products SET ${setClause} WHERE id = ?`,
      [...normalizedValues, productId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Product update failed:', error);
    res.status(500).json({ error: 'Gagal memperbarui produk.' });
  } finally {
    connection.release();
  }
});

app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Product delete failed:', error);
    res.status(500).json({ error: 'Gagal menghapus produk.' });
  } finally {
    connection.release();
  }
});

app.get('/api/admin/leads', requireAdminAuth, async (req, res) => {
  const { status, q } = req.query || {};
  const connection = await getConnection();
  try {
    const conditions = [];
    const params = [];
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (q) {
      conditions.push('(name LIKE ? OR phone LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT id, name, phone, message, status, notes, created_at
       FROM leads
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Leads fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat leads.' });
  } finally {
    connection.release();
  }
});

app.patch('/api/admin/leads/:id', requireAdminAuth, async (req, res) => {
  const leadId = req.params.id;
  const { status, notes } = req.body || {};

  const updates = [];
  const params = [];
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
  }

  params.push(leadId);

  const connection = await getConnection();
  try {
    await connection.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Lead update failed:', error);
    res.status(500).json({ error: 'Gagal memperbarui lead.' });
  } finally {
    connection.release();
  }
});

app.get('/api/admin/orders', requireAdminAuth, async (req, res) => {
  const { status } = req.query || {};
  const connection = await getConnection();
  try {
    const params = [];
    const whereClause = status ? 'WHERE orders.status = ?' : '';
    if (status) {
      params.push(status);
    }
    const [rows] = await connection.query(
      `SELECT orders.id, orders.order_code, orders.order_date, orders.total_amount,
              orders.payment_method, orders.delivery_method, orders.status,
              customers.name AS customer_name, customers.phone AS customer_phone
       FROM orders
       JOIN customers ON orders.customer_id = customers.id
       ${whereClause}
       ORDER BY orders.order_date DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Orders fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat order.' });
  } finally {
    connection.release();
  }
});

app.get('/api/admin/orders/:id/items', requireAdminAuth, async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT id, product_name, price, qty, subtotal
       FROM order_items
       WHERE order_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Order items fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat detail order.' });
  } finally {
    connection.release();
  }
});

app.patch('/api/admin/orders/:id/status', requireAdminAuth, async (req, res) => {
  const allowedStatuses = new Set(['new', 'confirmed', 'shipped', 'done', 'cancelled']);
  const { status } = req.body || {};
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const connection = await getConnection();
  try {
    const updates = ['status = ?'];
    const params = [status];
    if (status === 'confirmed') {
      updates.push('confirmed_at = NOW()');
    }
    if (status === 'shipped') {
      updates.push('shipped_at = NOW()');
    }

    await connection.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      [...params, req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Order status update failed:', error);
    res.status(500).json({ error: 'Gagal memperbarui status order.' });
  } finally {
    connection.release();
  }
});

app.get('/api/admin/orders/export', requireAdminAuth, async (req, res) => {
  const { status } = req.query || {};
  const connection = await getConnection();
  try {
    const params = [];
    const whereClause = status ? 'WHERE orders.status = ?' : '';
    if (status) {
      params.push(status);
    }
    const [rows] = await connection.query(
      `SELECT orders.order_code, orders.order_date, orders.total_amount,
              orders.payment_method, orders.delivery_method, orders.status,
              customers.name AS customer_name, customers.phone AS customer_phone
       FROM orders
       JOIN customers ON orders.customer_id = customers.id
       ${whereClause}
       ORDER BY orders.order_date DESC`,
      params
    );

    const escapeCsv = (value) => {
      const text = value === null || value === undefined ? '' : String(value);
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const header = [
      'order_code',
      'order_date',
      'total_amount',
      'payment_method',
      'delivery_method',
      'status',
      'customer_name',
      'customer_phone'
    ];

    const lines = [header.join(',')];
    rows.forEach((row) => {
      lines.push(
        [
          row.order_code,
          row.order_date,
          row.total_amount,
          row.payment_method,
          row.delivery_method,
          row.status,
          row.customer_name,
          row.customer_phone
        ]
          .map(escapeCsv)
          .join(',')
      );
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(lines.join('\n'));
  } catch (error) {
    console.error('Order export failed:', error);
    res.status(500).json({ error: 'Gagal export CSV.' });
  } finally {
    connection.release();
  }
});

app.get('/api/admin/summary', requireAdminAuth, async (req, res) => {
  const connection = await getConnection();
  try {
    const [[orderTotals]] = await connection.query(
      `SELECT
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_revenue
       FROM orders`
    );

    const [[monthTotals]] = await connection.query(
      `SELECT
        COUNT(*) AS month_orders,
        SUM(total_amount) AS month_revenue
       FROM orders
       WHERE YEAR(order_date) = YEAR(CURDATE())
         AND MONTH(order_date) = MONTH(CURDATE())`
    );

    const [[leadTotals]] = await connection.query(
      `SELECT COUNT(*) AS total_leads,
              SUM(status = 'new') AS new_leads
       FROM leads`
    );

    res.json({
      total_orders: Number(orderTotals?.total_orders || 0),
      total_revenue: Number(orderTotals?.total_revenue || 0),
      month_orders: Number(monthTotals?.month_orders || 0),
      month_revenue: Number(monthTotals?.month_revenue || 0),
      total_leads: Number(leadTotals?.total_leads || 0),
      new_leads: Number(leadTotals?.new_leads || 0)
    });
  } catch (error) {
    console.error('Summary fetch failed:', error);
    res.status(500).json({ error: 'Gagal memuat ringkasan.' });
  } finally {
    connection.release();
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

export default app;

