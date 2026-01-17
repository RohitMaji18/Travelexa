const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError'); // Make sure AppError is required
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Validate tourId
  if (!req.params.tourId) {
    return next(
      new AppError('Tour ID is required to create a checkout session.', 400)
    );
  }

  // 1) Get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) ADD THIS CHECK to prevent crashes
  if (!tour) {
    return next(new AppError('There is no tour with that ID.', 404));
  }

  // 3) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, // price in cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`
            ]
          }
        },
        quantity: 1
      }
    ]
  });

  // 4) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

const createBookingCheckout = async session => {
  console.log('Creating booking for session:', session);
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  console.log('Booking creation process started:', { tour, user, price });
  try {
    const booking = await Booking.create({ tour, user, price });
    console.log('Booking created successfully:', booking);
  } catch (err) {
    console.error('Error creating booking:', err);
  }
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log('Stripe webhook received event:', event.type);
  console.log('Stripe webhook signature:', signature);
  console.log('Stripe event payload:', req.body);

  if (event.type === 'checkout.session.completed') {
    try {
      console.log('Processing checkout session:', event.data.object);
      createBookingCheckout(event.data.object);
    } catch (err) {
      console.error('Error processing Stripe webhook:', err);
    }
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
