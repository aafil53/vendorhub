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

app.use(
  cors({
    origin: ['http://localhost:5173'],
  })
);
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rfq', require('./routes/rfq'));
app.use('/api/rfqs', require('./routes/rfqs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/users', require('./routes/users'));
app.use('/api/equipments', require('./routes/equipments'));

app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync({ alter: false });
    console.log('Models synchronized.');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();