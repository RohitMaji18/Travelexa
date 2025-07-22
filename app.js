const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');

const aiRouter = require('./routes/aiRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const reviewRouter = require('./routes/reveiwRoutes');
const cspDirectives = require('./config/helmet-csp');
const viewRouter = require('./routes/viewRoutes');

// ✅ Load static optimization (WebP + Brotli + Caching logic)
const setupStaticOptimization = require('./utils/optimizeStatic');

const app = express();
app.enable('trust proxy', 1);

// 🖼️ View Engine Setup (Pug)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 🔧 Apply static image & asset optimization middleware
setupStaticOptimization(app);

// 🔐 Set Security Headers with Helmet (including CSP)
app.use(helmet.contentSecurityPolicy(cspDirectives));

// 🌐 Enable CORS for all routes
app.use(cors());
app.options('*', cors());

// 📝 Dev request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 🚫 Limit repeated requests to public APIs
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per hour
  message: 'Too many requests from this IP, please try again in an hour.'
});
app.use('/api', limiter);

// ⚡ Handle Stripe webhook before body-parser (raw required)
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// 📦 Body & Cookie parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 🧼 Data sanitization
app.use(mongoSanitize()); // Remove $ and . from queries
app.use(xss()); // Clean user input from malicious HTML

// 🛡️ Prevent HTTP param pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'maxGroupSize',
      'difficulty'
    ]
  })
);

// 📉 Enable GZIP compression
app.use(compression());

// 🕐 Attach request timestamp (for logging/debugging)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 🚏 Main App Routes
app.use('/', viewRouter); // frontend views
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/ai', aiRouter);

// ❌ Catch undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 🛠️ Global error handler middleware
app.use(globalErrorHandler);

// ✅ Export the Express app
module.exports = app;
