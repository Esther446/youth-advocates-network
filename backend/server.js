require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const applicationRoutes = require('./src/routes/applications');
const resourceRoutes = require('./src/routes/resources');
const analyticsRoutes = require('./src/routes/analytics');
const uploadRoutes = require('./src/routes/upload');
const organizationRoutes = require('./src/routes/organizations');
const opportunityRoutes = require('./src/routes/opportunities');
const eventRoutes = require('./src/routes/events');
const adminRoutes = require('./src/routes/admin');
const courseRoutes = require('./src/routes/courses');
const enrollmentRoutes = require('./src/routes/enrollments');
const lessonRoutes = require('./src/routes/lessons');
const progressRoutes = require('./src/routes/progress');
const certificateRoutes = require('./src/routes/certificates');
const contentRoutes = require('./src/routes/content');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('./src/middleware/sanitize');
const errorHandler = require('./src/middleware/error');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://192.168.1.') ||
            origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Required for httpOnly cookie transport
}));
// Security Middleware
app.use(helmet());
app.use(mongoSanitize);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for local dev)
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply rate limiting to all requests under /api
app.use('/api', limiter);

// Specific limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // limit each IP to 100 requests per hour (increased for local dev)
    message: { success: false, message: 'Too many login attempts, please try again after an hour' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'YAN Platform API is running 🚀',
        version: '1.0.0'
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1', contentRoutes);

console.log('✅ All routes mounted under /api/v1/');

// Error handling
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
