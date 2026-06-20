import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/mongodb.js';

import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import upcomingProjectRoutes from './routes/upcomingProjectRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import memorableEventRoutes from './routes/memorableEventRoutes.js';
import apiKeysRoutes from './routes/apiKeysRoutes.js';
import auditionRoutes from './routes/auditionRoutes.js';
import auditionApplicationRoutes from './routes/auditionApplicationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(morgan('dev'));
const allowedOrigins = [
  'https://sjcufrontend.vercel.app',
  'https://stjohnscarolunion.netlify.app',
  'https://sjcunew.netlify.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // allow any localhost port for local development
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    // allow listed production origins (strip trailing slash)
    if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SJCU API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upcoming', upcomingProjectRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/memorable-events', memorableEventRoutes);
app.use('/api/keys', apiKeysRoutes);
app.use('/api/auditions', auditionRoutes);
app.use('/api/audition-applications', auditionApplicationRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`✅ SJCU Server running on http://localhost:${PORT}`);
});
// Give gallery batch uploads enough time (2 minutes)
server.timeout = 120000;

export default app;
