require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);


// Add basic security with helmet
app.use(helmet());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false
  })
);

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "https://d1ud2qozzk5hfq.cloudfront.net",
      "https://d2i4w0tbngbtdf.cloudfront.net",
      "http://localhost:5173",
      "http://localhost:3000"
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB and only start the server after a successful connection.
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udaan';

async function startServer() {
  // Avoid buffering commands while the driver is disconnected so we fail
  // fast and get actionable errors instead of silent buffering.
  mongoose.set('bufferCommands', false);

  // Connection lifecycle logs
  mongoose.connection.on('connected', () => console.log('Mongoose event: connected'));
  mongoose.connection.on('reconnected', () => console.log('Mongoose event: reconnected'));
  mongoose.connection.on('disconnected', () => console.warn('Mongoose event: disconnected'));
  mongoose.connection.on('error', (err) => console.error('Mongoose event: error', err && err.message ? err.message : err));

  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Wait up to 30s for a primary to be elected / selected.
        serverSelectionTimeoutMS: 30000,
      });
      console.log('MongoDB connected');

      // Now start the HTTP server
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`);
      // Try to print topology details if available
      try {
        const topology = mongoose.connection && mongoose.connection.client && mongoose.connection.client.topology;
        if (topology && topology.s && topology.s.description) {
          console.error('Topology description on failure:', topology.s.description);
        }
      } catch (e) {
        // ignore
      }
      console.error(err && err.stack ? err.stack : err);
      if (attempt < maxAttempts) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, 5000));
        continue;
      }

      console.error('\nCould not connect to MongoDB after multiple attempts.\nCommon causes:\n- Cluster is paused or unhealthy in Atlas UI\n- Your IP is not added to Atlas Network Access (IP whitelist)\n- Wrong connection string or credentials\n- Local network / VPN / firewall blocking outbound traffic to Atlas\n\nPlease check Atlas cluster status, Network Access, and Database Users.\nYou can also run DNS and TCP checks (nslookup / Test-NetConnection) from your machine.');
      process.exit(1);
    }
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/insights', require('./routes/insights'));
// Career suggestions (OpenAI-powered)
app.use('/api/career', require('./routes/career'));
// Chat route (simple rule-based responder)
app.use('/api/chat', require('./routes/chat'));

// Basic health
app.get('/', (req, res) => res.send({ ok: true, env: process.env.NODE_ENV || 'development' }));

const port = process.env.PORT || 5000;

// When run directly, start the HTTP server. When required as a module (e.g.
// during tests), export the Express app instead so a test harness can mount it
// without creating a long-lived listener in this environment.
if (require.main === module) {
  // When started directly, connect to MongoDB first then start the server.
  startServer();
} else {
  // When required (for tests), export the Express app but do NOT start the
  // HTTP listener so a test harness can control the lifecycle.
  module.exports = app;
}
