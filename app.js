const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser'); // Webhook ke liye zaroori hai
const compression = require('compression');
const cors = require('cors');

// Utils & Config
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const cspDirectives = require('./config/helmet-csp'); // Tera CSP config

// Controllers
const viewsController = require('./controllers/viewsController');
const authController = require('./controllers/authController');
const bookingController = require('./controllers/bookingController');

// Routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reveiwRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const aiRouter = require('./routes/aiRoutes');

const app = express();

app.set('trust proxy', 1); // Trust first proxy

// 1) VIEW ENGINE SETUP
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 2) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers (CSP Fix)
app.use(helmet.contentSecurityPolicy(cspDirectives));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Stripe webhook (Ye Body Parser se PEHLE aana chahiye)
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ✅ FIX: Ignore .map files and well-known requests (Console Error Fix)
app.get('*.map', (req, res) => res.status(204).end());
app.get('/.well-known/*', (req, res) => res.status(204).end());

// 3) ROUTES

// ✅ VIEW ROUTES (Direct Wiring + Auth Logic)
// isLoggedIn: Header update karega (Login vs User Photo)
// protect: Sirf logged-in users ko allow karega
app.get('/', authController.isLoggedIn, viewsController.getLandingPage);
app.get('/tours', authController.isLoggedIn, viewsController.getOverview);
app.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
app.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
app.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);
app.get('/me', authController.protect, viewsController.getAccount);
app.get('/my-tours', authController.protect, viewsController.getMyTours);

// Submit User Data Form
app.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

// ✅ API ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/ai', aiRouter);

// ✅ 404 HANDLING (Sabse Last Mein)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
