const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('../utils/database');
const { seedDatabase } = require('../utils/seedData');

// Import routes
const authRoutes = require('../routes/auth');
const notesRoutes = require('../routes/notes');
const tenantsRoutes = require('../routes/tenants');
const upgradeRequestsRoutes = require('../routes/upgradeRequests');
const healthRoutes = require('../routes/health');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
// CORS: allow configured frontend URLs and Vercel preview domains when in production
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server/no-origin requests
    if (!origin) return callback(null, true);

    // Allow if explicitly configured
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow Vercel preview deployments (*.vercel.app)
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (_) {
      // Ignore invalid origin format and fall through
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Seed database on startup (only in development)
if (process.env.NODE_ENV !== 'production') {
  seedDatabase().catch(console.error);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/upgrade-requests', upgradeRequestsRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-Tenant SaaS Notes API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = parseInt(process.env.PORT, 10) || 3000;

// For Vercel deployment
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  // For local development: try next ports if 3000 is busy
  
  const startServer = (port, attempt = 1, maxAttempts = 5) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        const nextPort = port + 1;
        console.warn(`Port ${port} in use. Retrying on port ${nextPort} (attempt ${attempt + 1}/${maxAttempts})...`);
        startServer(nextPort, attempt + 1, maxAttempts);
      } else {
        console.error('Failed to start server:', err);
        console.error('Tip: run ./stop.sh to free ports 3000/5173.');
        process.exit(1);
      }
    });
  };

  startServer(PORT);
}
