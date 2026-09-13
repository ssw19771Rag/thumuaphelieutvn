const http = require('http');
const fs = require('fs');
const path = require('path');

const root = 'C:\\tvn-phelieu';
const dbPath = path.join(root, 'data', 'db.json');
const port = 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

// Helper: read and write DB
function getDB() {
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading db.json:', e);
    return { settings: {}, prices: [], leads: [], commissionTiers: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing db.json:', e);
    return false;
  }
}

// Helper: parse request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

const requestHandler = async (req, res) => {
  const urlParts = req.url.split('?');
  const reqPath = urlParts[0];

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTES ---
  if (reqPath.startsWith('/api/')) {
    // 1. GET full data
    if (reqPath === '/api/data' && req.method === 'GET') {
      const db = getDB();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(db));
      return;
    }

    // 2. Auth Login
    if (reqPath === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      if (body.username === 'admin' && body.password === 'tvn2026@') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          token: 'tvn-admin-session-' + Date.now(),
          user: { name: 'Ban Quản Trị TVN', role: 'SuperAdmin' }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu quản trị!' }));
      }
      return;
    }

    // 3. Update Prices
    if (reqPath === '/api/prices' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = getDB();
      if (Array.isArray(body.prices)) {
        db.prices = body.prices;
        db.settings.lastUpdated = new Date().toISOString();
        saveDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Đã cập nhật bảng giá thành công!' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ!' }));
      }
      return;
    }

    // 4. Create Lead (booking from website)
    if (reqPath === '/api/leads' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = getDB();
      const newLead = {
        id: 'TVN-LD-' + (db.leads.length + 101),
        fullName: body.fullName || 'Khách hàng',
        phone: body.phone || '',
        location: body.location || '',
        scrapType: body.scrapType || 'Phế liệu tổng hợp',
        estimatedWeight: body.estimatedWeight || 'Chưa xác định',
        note: body.note || '',
        status: 'pending',
        statusText: 'Chờ liên hệ',
        createdAt: new Date().toISOString(),
        assignedTo: 'Đội xe TVN'
      };
      db.leads.unshift(newLead);
      saveDB(db);
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, lead: newLead, message: 'Yêu cầu khảo sát đã được gửi thành công!' }));
      return;
    }

    // 5. Update Lead Status / Note
    if (reqPath === '/api/leads/update' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = getDB();
      const lead = db.leads.find(l => l.id === body.id);
      if (lead) {
        if (body.status) {
          lead.status = body.status;
          const statusMap = {
            'pending': 'Chờ liên hệ',
            'scheduled': 'Đã xếp lịch khảo sát',
            'completed': 'Đã cân & Thanh toán',
            'cancelled': 'Đã hủy'
          };
          lead.statusText = statusMap[body.status] || body.status;
        }
        if (body.note !== undefined) lead.note = body.note;
        if (body.assignedTo !== undefined) lead.assignedTo = body.assignedTo;
        saveDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, lead, message: 'Cập nhật trạng thái đơn thành công!' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Không tìm thấy đơn hàng!' }));
      }
      return;
    }

    // 6. Delete Lead
    if (reqPath === '/api/leads/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = getDB();
      db.leads = db.leads.filter(l => l.id !== body.id);
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Đã xóa đơn khảo sát!' }));
      return;
    }

    // 7. Update Settings
    if (reqPath === '/api/settings' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = getDB();
      db.settings = Object.assign(db.settings, body.settings || {}, { lastUpdated: new Date().toISOString() });
      saveDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, settings: db.settings, message: 'Đã cập nhật cấu hình hệ thống!' }));
      return;
    }
  }

  // --- STATIC FILE SERVING ---
  let targetFile = reqPath;
  if (targetFile === '/' || targetFile === '') targetFile = '/index.html';
  if (targetFile === '/admin') targetFile = '/admin.html';
  if (targetFile === '/review') targetFile = '/review.html';

  const filePath = path.join(root, targetFile);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found - Không tìm thấy trang');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

// Start Port 3000
http.createServer(requestHandler).listen(port, () => {
  console.log('TVN Server running at http://localhost:' + port);
});

// Start Port 80 (standard HTTP for domain)
try {
  http.createServer(requestHandler).listen(80, () => {
    console.log('TVN Server listening on port 80 (http://thumuaphelieutvn.com)');
  }).on('error', (err) => {
    console.log('Port 80 notice:', err.message);
  });
} catch (e) {
  console.log('Port 80 bind error:', e.message);
}
