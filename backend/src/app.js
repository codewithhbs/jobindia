const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security + parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

// Locally-stored uploads (avatars, docs, resumes, onboarding images)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API
app.use('/', routes);

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
