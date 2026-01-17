const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// ✅ FIXED LANDING PAGE FUNCTION
exports.getLandingPage = catchAsync(async (req, res, next) => {
  // 1. Try to fetch Tours
  let tours = [];
  try {
    tours = await Tour.find({ slug: { $exists: true, $ne: null } })
      .limit(4)
      .lean();
  } catch (err) {
    tours = [];
  }

  // 2. Try to fetch Reviews
  let reviews = [];
  try {
    reviews = await Review.aggregate([
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
        $project: {
          rating: 1,
          text: '$review',
          user: { name: '$user.name', photo: '$user.photo' },
          tour: { name: '$tour.name', slug: '$tour.slug' }
        }
      },
      { $limit: 6 }
    ]);
  } catch (err) {
    reviews = [];
  }

  // 3. Render
  res.status(200).render('landing', {
    title: 'Welcome to Travelexa',
    heroImage: '/img/hero.jpg',
    heroTitle: 'Explore the World with Us!',
    heroSubtitle: 'Find the best tours and travel packages.',
    tours,
    reviewsList: reviews,
    reasonsList: [
      {
        title: 'Best Deals',
        description: 'Affordable prices.',
        image: '/img/bestdeal.jpg',
        link: '/tours',
        buttonText: 'See More'
      },
      {
        title: 'Luxury Travel',
        description: 'Premium experiences.',
        image: '/img/luxury.jpg',
        link: '/tours',
        buttonText: 'Discover'
      },
      {
        title: 'Adventure',
        description: 'Thrilling tours.',
        image: '/img/adventure.jpg',
        link: '/tours',
        buttonText: 'Explore'
      }
    ],
    aboutTitle: 'Why Choose Us?',
    aboutHeading: 'Your Best Travel Partner',
    aboutDescription: 'We provide the best travel services.',
    aboutFacts: ['Trusted by 10k+', '24/7 Support'],
    contactTitle: 'Send us a Request',
    aboutImage: '/img/about.jpg'
  });
});

// ... Baki functions same rakhna (getOverview, getTour etc) ...
exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', { title: 'All Tours', tours });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) return next(new AppError('There is no tour with that name.', 404));
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});
exports.getLoginForm = (req, res) =>
  res.status(200).render('login', { title: 'Log into your account' });
exports.getSignupForm = (req, res) =>
  res.status(200).render('signup', { title: 'Sign up for an account' });
exports.getAccount = (req, res) =>
  res.status(200).render('account', { title: 'Your Account' });
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name, email: req.body.email },
    { new: true, runValidators: true }
  );
  res
    .status(200)
    .render('account', { title: 'Your Account', user: updatedUser });
});
exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', { title: 'My Tours', tours });
});
exports.handleContactRequest = catchAsync(async (req, res) =>
  res.redirect('/')
);
