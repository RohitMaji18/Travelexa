//const mongoose = require('mongoose'); // Import mongoose to interact with MongoDB
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel'); // Import the Tour model
const catchAsync = require('./../utils/catchAsync'); // Import a utility to catch errors in async functions and pass them to error handlers
//const AppError = require('./../utils/appError'); // Import custom error class for handling application-specific errors
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // Check if the request contains any images in the 'imageCover' or 'images' fields
  if (!req.files.imageCover && !req.files.images) {
    return next(); // No images to resize, proceed to the next middleware or route handler
  }
  // Resize the cover image using Sharp
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Resize all images using Sharp
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(1000, 750)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});
// Middleware to alias top tours for a specific query (e.g., top 5 cheap tours)
exports.aliasTopTours = (req, res, next) => {
  // Set query parameters for limit, sort, and selected fields
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next(); // Proceed to the next middleware or route handler
};

// Controller to get all tours, with filtering, sorting, field limiting, and pagination
exports.getAllTours = factory.getAll(Tour);
// Controller to get a single tour by ID
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// Controller to create a new tour
exports.createTour = factory.createOne(Tour);
// Controller to update an existing tour by ID
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Controller to get tour statistics using MongoDB aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // Match tours with an average rating of at least 4.5
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    // Group data by difficulty (converted to uppercase) and calculate various statistics
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    // Sort the groups by average price in ascending order
    { $sort: { avgPrice: 1 } }
  ]);
  // Send the computed statistics in the response
  res.status(200).json({ status: 'success', data: { stats } });
});

// Controller to get a monthly plan of tour starts for a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // Convert the year parameter to a number
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    // Unwind the startDates array so that each date is treated as a separate document
    { $unwind: '$startDates' },
    // Match startDates within the specified year
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    // Group by month and count the number of tour starts; push tour names into an array
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    // Add a 'month' field that duplicates the group _id (the month number)
    { $addFields: { month: '$_id' } },
    // Remove the _id field from the output
    { $project: { _id: 0 } },
    // Sort the results by the number of tour starts in descending order
    { $sort: { numTourStarts: -1 } },
    // Limit the results to 12 documents (one for each month)
    { $limit: 12 }
  ]);
  // Send the monthly plan data in the response
  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});

///tours-within/:distance/center/:lating/unit/:unit',
//tours-within/233/center/34.111745,-118.113491/unit/mi:

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // Radius in kilometers or miles
  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitutr and longitude in  the format lat,lng.',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

//
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitutr and longitude in  the format lat,lng.',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        name: 1,
        distance: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
