const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const prisma = require('./db');
const app = express();
const httpServer = http.createServer(app);

// Clean frontend URL (remove trailing slash) to prevent CORS mismatches
const frontendUrl = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.replace(/\/$/, '') 
  : 'http://localhost:3000';

// Allowed origins
const allowedOrigins = [
  frontendUrl,
  `${frontendUrl}/`,
  'https://resto-glam-final.vercel.app',
  'https://resto-glam-final.vercel.app/',
];

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
const queueRoutes = require('./routes/queue');
const tableRoutes = require('./routes/tables');
const orderRoutes = require('./routes/orders');
const menuRoutes = require('./routes/menu');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/queue', queueRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Seed DB and Start Server
const PORT = process.env.PORT || 5000;

prisma.$connect()
  .then(async () => {
    console.log('✅ PostgreSQL connected via Prisma');
    
    // Seed data
    const { seedDatabase } = require('./utils/seed');
    try {
      await seedDatabase();
    } catch(e) {
      console.log('Seed error or db empty', e.message);
    }

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
  });

module.exports = { io };
