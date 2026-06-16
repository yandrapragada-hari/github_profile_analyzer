const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const githubRoutes = require('./routes/githubRoutes');

const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', githubRoutes);

app.use((err, _req, res, _next) => {
  const status = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal Server Error';

  console.error(err);

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {}),
  });
});

module.exports = app;

