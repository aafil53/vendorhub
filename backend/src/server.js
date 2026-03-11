require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');                    // ← NEW: for socket auth
const sequelize = require('./config/database');
const models = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: ['http://localhost:5173'] } });

// ── NEW: register io singleton so routes can emit ─────────────────────────────
const { setIo } = require('./socket');
setIo(io);

const { authMiddleware } = require('./middleware/auth');
const auditMiddleware = require('./middleware/audit');

app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());
app.use(auditMiddleware);

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/equipments', require('./routes/equipments'));
app.use('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── GLOBAL JWT PROTECTION ─────────────────────────────────────────────────────
app.use('/api', authMiddleware);

// ── SECURED ROUTES (unchanged) ────────────────────────────────────────────────
app.use('/api/rfq',           require('./routes/rfq'));
app.use('/api/rfqs',          require('./routes/rfqs'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/bids',          require('./routes/bids'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/equipment',     require('./routes/equipment'));
app.use('/api/vendors',       require('./routes/vendors'));
app.use('/api/notifications', require('./routes/notifications'));

// ── SOCKET.IO AUTH + ROOM SETUP ───────────────────────────────────────────────
// Verify JWT on every socket connection — reject unauthenticated sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const secret = process.env.JWT_SECRET || 'vendorhub_secret';
    const decoded = jwt.verify(token, secret);
    socket.user = decoded; // { id, email, role, name }
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Each user joins their own private room: "user:5", "user:13", etc.
  const room = `user:${socket.user.id}`;
  socket.join(room);
  console.log(`[WS] ${socket.user.name} (id:${socket.user.id}) joined room ${room}`);

  socket.on('disconnect', () => {
    console.log(`[WS] ${socket.user.name} disconnected`);
  });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync();
    console.log('Models synchronized.');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();