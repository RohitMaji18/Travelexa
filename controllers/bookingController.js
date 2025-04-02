const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel'); // Import the Tour model
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// const User = require('./../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1>get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2>create the checkout session

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tour.name,
            description: tour.description,
            images: [tour.imageCover]
          },
          unit_amount: tour.price * 100 // Convert to cents
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId
  });

  //3>create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
