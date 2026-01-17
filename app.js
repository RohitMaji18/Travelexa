// const path = require('path');
// const express = require('express');

// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const hpp = require('hpp');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
// const helmet = require('helmet');
// const compression = require('compression');

// const optimizeStatic = require('./utils/optimizeStatic');

// const aiRouter = require('./routes/aiRoutes');
// const AppError = require('./utils/appError');
// const globalErrorHandler = require('./controllers/errorController');
// //const viewsController = require('./controllers/viewsController');
// const tourRouter = require('./routes/tourRoutes');
// const userRouter = require('./routes/userRoutes');
// const bookingRouter = require('./routes/bookingRoutes');
// const bookingController = require('./controllers/bookingController'); //new
// const reviewRouter = require('./routes/reveiwRoutes');
// const cspDirectives = require('./config/helmet-csp');
// const viewRoutes = require('./routes/viewRoutes');

// const app = express();

// app.enable('trust proxy', 1); //✅ Secure for Render

// // Set template engine
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));

// // 1) MIDDLEWARES
// //implement CORS
// app.use(cors());
// app.options('*', cors());

// // ✅ Enable compression for all responses
// app.use(compression());

// app.use(
//   express.static(path.join(__dirname, 'public'), {
//     maxAge: '1d',
//     etag: false
//   })
// );

// // ✅ Apply static optimization (WebP, Brotli, Gzip, caching)
// optimizeStatic(app);

// // ✅ Fix: Set correct CSP policy
// //app.use(helmet());
// app.use(helmet.contentSecurityPolicy(cspDirectives));

// // Logging requests in development mode
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// // Rate limiter
// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100,
//   message: 'Too many requests from this IP, please try again in an hour.'
// });
// app.use('/api', limiter);
// //new webhook stripe
// // Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );
// // Body parser
// app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// app.use(cookieParser());
// // Security middleware
// app.use(mongoSanitize());
// app.use(xss());
// app.use(
//   hpp({
//     whitelist: [
//       'duration',
//       'ratingsAverage',
//       'ratingsQuantity',
//       'price',
//       'maxGroupSize',
//       'difficulty'
//     ]
//   })
// );

// app.use(compression());
// //optimizeStatic(app);

// // Custom middleware
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();

//   next();
// });

// // Ignore .map file requests
// app.get('*.map', (req, res) => res.status(204).send());

// // Handle .well-known requests
// app.use(
//   '/.well-known',
//   express.static(path.join(__dirname, 'public/.well-known'))
// );

// // 3) ROUTES
// // Health / root route (IMPORTANT for Render)
// // app.get('/', (req, res) => {
// //   res.status(200).send('TravelXa API is running');
// // });

// app.use('/', viewRoutes);
// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/reviews', reviewRouter);
// app.use('/api/v1/bookings', bookingRouter);
// app.use('/api/v1/ai', aiRouter);

// // Handle undefined routes
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// // Global error handling
// app.use(globalErrorHandler);

// module.exports = app;

const path = require('path');
const express = require('express');
const morgan = require('morgan');
//const rateLimit = require('express-rate-limit');
//const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
//const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// ✅ IMPORTS
const viewsController = require('./controllers/viewsController'); // Direct Import
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reveiwRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy');

// VIEW ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARES
app.use(cors());
app.options('*', cors());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

// ✅ ROUTES (Yahan maine fix kiya hai)
// Hum router file use nahi kar rahe, seedha yahan likh rahe hain
app.get('/', viewsController.getLandingPage);
app.get('/tours', viewsController.getOverview);
app.get('/tour/:slug', viewsController.getTour);
app.get('/login', viewsController.getLoginForm);
app.get('/signup', viewsController.getSignupForm);

// API Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
