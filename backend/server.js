const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'hotel_admin_secret_2024';

app.use(cors());
app.use(express.json());

// ─── Database setup ───────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'hotel.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('merchant', 'admin')) NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    name_cn TEXT NOT NULL,
    name_en TEXT,
    address TEXT NOT NULL,
    star_level INTEGER CHECK(star_level BETWEEN 1 AND 5),
    open_date TEXT,
    phone TEXT,
    description TEXT,
    facilities TEXT,
    nearby_attractions TEXT,
    status TEXT CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'offline')) DEFAULT 'draft',
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(merchant_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS room_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    discount_price REAL,
    discount_desc TEXT,
    capacity INTEGER DEFAULT 2,
    area REAL,
    bed_type TEXT,
    facilities TEXT,
    FOREIGN KEY(hotel_id) REFERENCES hotels(id)
  );
`);

// Seed accounts.
// Passwords are stored as bcrypt(sha256(plaintext)) because the frontend
// sends sha256(plaintext) over the wire — never the raw password.
// sha256("admin123")    = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
// sha256("merchant123") = 0e3183c45e8ef9bc95fc8a2dc83f040149d2c7193312aa0740da9c0d50b1f439
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const adminHash    = bcrypt.hashSync('240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 10);
  const merchantHash = bcrypt.hashSync('0e3183c45e8ef9bc95fc8a2dc83f040149d2c7193312aa0740da9c0d50b1f439', 10);
  db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin',     adminHash,    'admin',    '超级管理员');
  db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('merchant1', merchantHash, 'merchant', '测试商户');
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token无效' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: '权限不足' });
    next();
  };
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// Register: frontend sends sha256(password), we bcrypt it for storage.
app.post('/api/register', (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: '参数不完整' });
  if (!['merchant', 'admin'].includes(role)) return res.status(400).json({ error: '无效角色' });
  // Validate that incoming password looks like a SHA-256 hex string (64 chars)
  if (!/^[a-f0-9]{64}$/.test(password)) return res.status(400).json({ error: '密码格式错误' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run(username, hash, role, name || username);
    res.json({ success: true, message: '注册成功' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: '用户名已存在' });
    res.status(500).json({ error: '服务器错误' });
  }
});

// Login: frontend sends sha256(password), bcrypt.compareSync verifies against stored hash.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

// ─── Hotel Routes (Merchant) ──────────────────────────────────────────────────
app.get('/api/hotels', auth, (req, res) => {
  let hotels;
  if (req.user.role === 'admin') {
    hotels = db.prepare(`SELECT h.*, u.name as merchant_name FROM hotels h JOIN users u ON h.merchant_id = u.id ORDER BY h.updated_at DESC`).all();
  } else {
    hotels = db.prepare(`SELECT h.*, u.name as merchant_name FROM hotels h JOIN users u ON h.merchant_id = u.id WHERE h.merchant_id = ? ORDER BY h.updated_at DESC`).all(req.user.id);
  }
  hotels = hotels.map(h => ({ ...h, room_types: db.prepare('SELECT * FROM room_types WHERE hotel_id = ?').all(h.id) }));
  res.json(hotels);
});

app.get('/api/hotels/:id', auth, (req, res) => {
  const hotel = db.prepare(`SELECT h.*, u.name as merchant_name FROM hotels h JOIN users u ON h.merchant_id = u.id WHERE h.id = ?`).get(req.params.id);
  if (!hotel) return res.status(404).json({ error: '酒店不存在' });
  if (req.user.role === 'merchant' && hotel.merchant_id !== req.user.id) return res.status(403).json({ error: '无权访问' });
  hotel.room_types = db.prepare('SELECT * FROM room_types WHERE hotel_id = ?').all(hotel.id);
  res.json(hotel);
});

app.post('/api/hotels', auth, requireRole('merchant'), (req, res) => {
  const { name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, room_types } = req.body;
  if (!name_cn || !address) return res.status(400).json({ error: '酒店名称和地址为必填项' });
  const result = db.prepare(`INSERT INTO hotels (merchant_id, name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`).run(req.user.id, name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions);
  const hotelId = result.lastInsertRowid;
  if (room_types?.length) {
    const stmt = db.prepare(`INSERT INTO room_types (hotel_id, name, price, discount_price, discount_desc, capacity, area, bed_type, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    room_types.forEach(r => stmt.run(hotelId, r.name, r.price, r.discount_price, r.discount_desc, r.capacity, r.area, r.bed_type, r.facilities));
  }
  res.json({ success: true, id: hotelId });
});

app.put('/api/hotels/:id', auth, requireRole('merchant'), (req, res) => {
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  if (!hotel) return res.status(404).json({ error: '酒店不存在' });
  if (hotel.merchant_id !== req.user.id) return res.status(403).json({ error: '无权修改' });
  if (hotel.status === 'approved') return res.status(400).json({ error: '已发布的酒店不能直接编辑，请先下线' });
  if (hotel.status === 'pending') return res.status(400).json({ error: '审核中的酒店不能编辑，请等待审核结果' });
  const { name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, room_types } = req.body;
  db.prepare(`UPDATE hotels SET name_cn=?, name_en=?, address=?, star_level=?, open_date=?, phone=?, description=?, facilities=?, nearby_attractions=?, status='draft', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, req.params.id);
  db.prepare('DELETE FROM room_types WHERE hotel_id = ?').run(req.params.id);
  if (room_types?.length) {
    const stmt = db.prepare(`INSERT INTO room_types (hotel_id, name, price, discount_price, discount_desc, capacity, area, bed_type, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    room_types.forEach(r => stmt.run(req.params.id, r.name, r.price, r.discount_price, r.discount_desc, r.capacity, r.area, r.bed_type, r.facilities));
  }
  res.json({ success: true });
});

app.post('/api/hotels/:id/submit', auth, requireRole('merchant'), (req, res) => {
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  if (!hotel) return res.status(404).json({ error: '酒店不存在' });
  if (hotel.merchant_id !== req.user.id) return res.status(403).json({ error: '无权操作' });
  db.prepare(`UPDATE hotels SET status='pending', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.post('/api/admin/hotels/:id/approve', auth, requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE hotels SET status='approved', reject_reason=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/hotels/:id/reject', auth, requireRole('admin'), (req, res) => {
  const { reason } = req.body;
  db.prepare(`UPDATE hotels SET status='rejected', reject_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(reason || '不符合要求', req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/hotels/:id/offline', auth, requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE hotels SET status='offline', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/hotels/:id/online', auth, requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE hotels SET status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`🏨 Hotel Admin API running on http://localhost:${PORT}`));
