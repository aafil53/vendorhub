require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/database');
const models = require('./models'); // initialize models and associations

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: ['http://localhost:5173'] } });

const { authMiddleware } = require('./middleware/auth');
const auditMiddleware = require('./middleware/audit');

app.use(
  cors({
    origin: ['http://localhost:5173'],
  })
);
app.use(express.json());
app.use(auditMiddleware); // Global Audit Logging

// ✅ PUBLIC ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipments', require('./routes/equipments'));
app.use('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ✅ GLOBAL AUTH PROTECTION FOR ALL OTHER API ROUTES
app.use('/api', authMiddleware);

// SECURED ROUTES
app.use('/api/rfq', require('./routes/rfq'));
app.use('/api/rfqs', require('./routes/rfqs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync();
    console.log('Models synchronized.');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();