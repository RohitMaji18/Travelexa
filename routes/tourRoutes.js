const express = require('express'); // Import the Express framework
const tourController = require('./../controllers/tourController'); // Import the tour controller which contains handler functions for tour-related routes
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reveiwRouter = require('./../routes/reveiwRoutes'); // Import routes

const router = express.Router(); // Create a new router object to handle routes for tours

// If you want to perform any pre-processing or validation on the tour ID, you could use a param middleware.
// For example, the commented line below would call tourController.checkID every time a route contains an :id parameter.
// router.param('id', tourController.checkID);

//POST/tour/344reid/reviews
//GET/tour/2344id/reviews
//GET/tour/2345id/reviews/34reid
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router.use('/:tourId/reviews', reveiwRouter);

// 📌 Special route: Get top 5 cheap tours using a predefined alias middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Route to get tour statistics (like average ratings, price, etc.)
router.route('/tour-stats').get(tourController.getTourStats);

// Route to get a monthly plan of tours for a specific year
router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),

  tourController.getMonthlyPlan
);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
// 📌 Routes for ALL tours: fetching all tours and creating a new tour
router
  .route('/')
  .get(tourController.getAllTours) // Get all tours
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  ); // Create a new tour

// 📌 Routes for a SINGLE tour: operations by tour ID (get, update, delete)
router
  .route('/:id')
  .get(tourController.getTour) // Get a single tour by its ID
  .patch(
    authController.protect,
    authController.restrictTo('user', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  ) // Update a tour by its ID
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  ); // Delete a tour by its ID

module.exports = router; // Export the router so it can be used in the main app file
