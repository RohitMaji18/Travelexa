const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// ✅ Optimized CSP Policy
const cspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  'block-all-mixed-content',
  "font-src 'self' https: data:",
  "frame-ancestors 'self'",
  "img-src 'self' data: https://*.tile.openstreetmap.org",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com https://js.stripe.com blob:",
  "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com https://js.stripe.com blob:",
  "frame-src 'self' https://js.stripe.com",
  "worker-src 'self' blob:",
  "script-src-attr 'none'",
  "style-src 'self' https: 'unsafe-inline' https://unpkg.com/leaflet/dist/ https://cdnjs.cloudflare.com/ajax/libs/leaflet/",
  "connect-src 'self' ws://127.0.0.1:* https://*.tile.openstreetmap.org",
  'upgrade-insecure-requests'
].join('; ');

exports.getLandingPage = catchAsync(async (req, res) => {
  // ✅ Fetch tours (limit 4)
  const tours = await Tour.find()
    .limit(4)
    .lean();

  // ✅ Fetch unique user reviews (limit 10)
  const reviews = await Review.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'tour'
      }
    },
    { $unwind: '$user' },
    { $unwind: '$tour' },
    {
      $group: {
        _id: '$user._id',
        review: { $first: '$$ROOT' }
      }
    },
    {
      $project: {
        _id: '$review._id',
        rating: '$review.rating',
        text: '$review.review',
        user: {
          _id: '$review.user._id',
          name: '$review.user.name',
          photo: '$review.user.photo'
        },
        tour: {
          _id: '$review.tour._id',
          name: '$review.tour.name',
          slug: '$review.tour.slug' // Make sure slug is included for proper navigation
        }
      }
    },
    { $limit: 6 }
  ]);

  // Make sure user is properly passed to the template
  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('landing', {
      title: 'Welcome to Travelexa',
      heroImage: '/img/hero.jpg',
      heroTitle: 'Explore the World with Us!',
      heroSubtitle: 'Find the best tours and travel packages.',
      reasonsList: [
        {
          title: 'Best Deals',
          description: 'Affordable travel plans at unbeatable prices.',
          image: '/img/bestdeal.jpg',
          link: '/tours',
          buttonText: 'See More'
        },
        {
          title: 'Luxury Travel',
          description: 'Premium experiences at the most beautiful locations.',
          image: '/img/luxury.jpg',
          link: '/tours',
          buttonText: 'Discover More'
        },
        {
          title: 'Adventure Awaits',
          description: 'Exciting adventure tours for thrill-seekers.',
          image: '/img/adventure.jpg',
          link: '/tours',
          buttonText: 'Explore'
        }
      ],
      aboutTitle: 'Why Choose Us?',
      aboutImage: '/img/about.jpg',
      aboutHeading: 'Your Best Travel Partner',
      aboutDescription: 'We provide the best travel services and experiences.',
      aboutFacts: [
        'Trusted by 10,000+ travelers',
        '24/7 Customer Support',
        'Exclusive Discounts & Offers',
        'Handpicked Destinations'
      ],
      tours,
      reviewsList: reviews || [],
      contactTitle: 'Send us a Request'
    });
});

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('overview', {
      title: 'All Tours',
      tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('tour', {
      title: `${tour.name} Tour`,
      tour
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('login', { title: 'Log into your account' });
};

exports.getSignupForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('signup', { title: 'Sign up for an account' });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('account', {
      title: 'Your Account'
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('account', {
      title: 'Your Account',
      user: updatedUser
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res
    .status(200)
    .set('Content-Security-Policy', cspHeader)
    .render('overview', {
      title: 'My Tours',
      tours
    });
});

// Add handler for contact form submission
exports.handleContactRequest = catchAsync(async (req, res) => {
  // Here you would typically process the form data
  // For example, save to database or send an email

  // Then redirect to the homepage
  res.redirect('/');
});
