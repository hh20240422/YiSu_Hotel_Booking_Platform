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

// Seed admin account
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin', hash, 'admin', '超级管理员');
  const merchantHash = bcrypt.hashSync('merchant123', 10);
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
app.post('/api/register', (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: '参数不完整' });
  if (!['merchant', 'admin'].includes(role)) return res.status(400).json({ error: '无效角色' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
    stmt.run(username, hash, role, name || username);
    res.json({ success: true, message: '注册成功' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: '用户名已存在' });
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
  // Attach room types
  hotels = hotels.map(h => ({
    ...h,
    room_types: db.prepare('SELECT * FROM room_types WHERE hotel_id = ?').all(h.id)
  }));
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

  const stmt = db.prepare(`INSERT INTO hotels (merchant_id, name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`);
  const result = stmt.run(req.user.id, name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions);
  const hotelId = result.lastInsertRowid;

  if (room_types && room_types.length > 0) {
    const roomStmt = db.prepare(`INSERT INTO room_types (hotel_id, name, price, discount_price, discount_desc, capacity, area, bed_type, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    room_types.forEach(r => roomStmt.run(hotelId, r.name, r.price, r.discount_price, r.discount_desc, r.capacity, r.area, r.bed_type, r.facilities));
  }

  res.json({ success: true, id: hotelId });
});

app.put('/api/hotels/:id', auth, requireRole('merchant'), (req, res) => {
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  if (!hotel) return res.status(404).json({ error: '酒店不存在' });
  if (hotel.merchant_id !== req.user.id) return res.status(403).json({ error: '无权修改' });
  if (hotel.status === 'approved') return res.status(400).json({ error: '已发布的酒店不能直接编辑，请先下线' });

  const { name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, room_types } = req.body;
  db.prepare(`UPDATE hotels SET name_cn=?, name_en=?, address=?, star_level=?, open_date=?, phone=?, description=?, facilities=?, nearby_attractions=?, status='draft', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(name_cn, name_en, address, star_level, open_date, phone, description, facilities, nearby_attractions, req.params.id);

  db.prepare('DELETE FROM room_types WHERE hotel_id = ?').run(req.params.id);
  if (room_types && room_types.length > 0) {
    const roomStmt = db.prepare(`INSERT INTO room_types (hotel_id, name, price, discount_price, discount_desc, capacity, area, bed_type, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    room_types.forEach(r => roomStmt.run(req.params.id, r.name, r.price, r.discount_price, r.discount_desc, r.capacity, r.area, r.bed_type, r.facilities));
  }

  res.json({ success: true });
});

// Submit for review
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

// ==================== C端公开API ====================

// 获取已发布的酒店列表（公开）
app.get('/api/c/hotels', (req, res) => {
  try {
    const { location, keyword, star, minPrice, maxPrice } = req.query;
    
    let sql = `SELECT h.*, u.name as merchant_name FROM hotels h JOIN users u ON h.merchant_id = u.id WHERE h.status = 'approved'`;
    const params = [];

    if (location) {
      sql += ` AND h.address LIKE ?`;
      params.push(`%${location}%`);
    }

    if (keyword) {
      sql += ` AND (h.name_cn LIKE ? OR h.name_en LIKE ? OR h.description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (star) {
      sql += ` AND h.star_level = ?`;
      params.push(star);
    }

    sql += ` ORDER BY h.updated_at DESC`;

    let hotels = db.prepare(sql).all(...params);

    // 为每个酒店添加房型
    hotels = hotels.map(h => ({
      ...h,
      room_types: db.prepare('SELECT * FROM room_types WHERE hotel_id = ? ORDER BY COALESCE(discount_price, price) ASC').all(h.id)
    }));

    // 价格筛选（需要在获取房型后进行）
    if (minPrice || maxPrice) {
      hotels = hotels.filter(h => {
        const minRoomPrice = Math.min(...h.room_types.map(r => r.discount_price || r.price));
        if (minPrice && minRoomPrice < Number(minPrice)) return false;
        if (maxPrice && minRoomPrice > Number(maxPrice)) return false;
        return true;
      });
    }

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取酒店详情（公开）
app.get('/api/c/hotels/:id', (req, res) => {
  try {
    const hotel = db.prepare(`
      SELECT h.*, u.name as merchant_name 
      FROM hotels h 
      JOIN users u ON h.merchant_id = u.id 
      WHERE h.id = ? AND h.status = 'approved'
    `).get(req.params.id);

    if (!hotel) {
      return res.status(404).json({ error: '酒店不存在' });
    }

    const roomTypes = db.prepare(`
      SELECT * FROM room_types 
      WHERE hotel_id = ?
      ORDER BY COALESCE(discount_price, price) ASC
    `).all(req.params.id);

    res.json({
      ...hotel,
      room_types: roomTypes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 搜索建议（公开）
app.get('/api/c/search-suggestions', (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.length < 2) return res.json([]);

    const hotels = db.prepare(`
      SELECT id, name_cn, name_en, address 
      FROM hotels 
      WHERE status = 'approved' 
        AND (name_cn LIKE ? OR name_en LIKE ? OR address LIKE ?)
      LIMIT 5
    `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`🏨 Hotel Admin API running on http://localhost:${PORT}`));
