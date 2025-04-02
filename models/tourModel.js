// Import mongoose (a tool to work with MongoDB)
const mongoose = require('mongoose');
// Import slugify to create URL-friendly slugs from tour names
const slugify = require('slugify');
//const User = require('./userModel');
// const validator = require('validator'); // Optional: used for additional validations

// Create a blueprint (schema) for a tour
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Name should be a text string
      required: [true, 'A tour must have a name'], // Name is required
      unique: true, // No two tours can have the same name
      trim: true, // Removes extra spaces from the beginning and end
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters']
      // Optionally, you can validate to allow only alphabetic characters:
      // validate: [validator.isAlpha, 'Tour name must only contain alpha characters']
    },
    slug: String, // URL-friendly version of the tour name, generated automatically
    duration: {
      type: Number, // Duration of the tour in days
      required: [true, 'A tour must have a duration'] // Duration is required
    },
    maxGroupSize: {
      type: Number, // Maximum number of people allowed in a group
      required: [true, 'A tour must have a group size'] // Group size is required
    },
    difficulty: {
      type: String, // Difficulty level (e.g., easy, medium, hard)
      required: [true, 'A tour must have a difficulty level'], // Difficulty is required
      enum: {
        values: ['easy', 'medium', 'hard'], // Valid options for difficulty
        message: 'Difficulty must be either easy, medium, or hard'
      }
    },
    ratingsAverage: {
      type: Number, // Average rating of the tour (e.g., 4.5 stars)
      default: 4.5, // Default value if no rating is provided
      min: [1, 'A tour must have a minimum rating of 1'],
      max: [5, 'A tour can have a maximum rating of 5'],
      set: val => Math.round(val * 10) / 10 //
    },
    ratingsQuantity: {
      type: Number, // Total number of ratings received
      default: 0 // Default is 0 when no ratings have been given
    },
    price: {
      type: Number, // Price of the tour
      required: [true, 'A tour must have a price'] // Price is required
    },
    priceDiscount: {
      type: Number, // Discounted price (if any)
      validate: {
        // Custom validator to ensure the discount price is lower than the actual price
        validator: function(value) {
          // 'this' only points to the current doc on NEW document creation
          return value < this.price;
        },
        message: 'Discounted price ({VALUE}) should be less than original price'
      }
    },
    summary: {
      type: String, // Short summary of the tour
      trim: true, // Remove extra spaces
      required: [true, 'A tour must have a description'] // Summary is required
    },
    description: {
      type: String, // Full detailed description of the tour
      trim: true // Remove extra spaces
    },
    imageCover: {
      type: String, // URL for the cover image of the tour
      required: [true, 'A tour must have a cover image'] // Cover image is required
    },
    images: [String], // Array of URLs for additional images
    createdAt: {
      type: Date, // Date when the tour was created
      default: Date.now(), // Set to the current date by default
      select: false // Exclude this field from query outputs
    },
    startDates: [Date], // Array of dates when the tour starts
    secretTour: {
      type: Boolean, // Flag to mark a tour as secret
      default: false // Default is false, meaning it is not a secret tour
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String, // GeoJSON type
        default: 'Point', // String representation of a point  in the map coordinates (optional)
        enum: ['Point'] // Only allow 'Point' type
        //required: true
      },
      coordinates: {
        type: [Number], // Array of coordinates in the map coordinates (optional)
        index: '2dsphere'
      }, // Array of coordinates in the map coordinates (optional)
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point', // String representation of a point in the map coordinates
          enum: ['Point'] // Only allow 'Point' type
        },
        coordinates: [Number], // Array of coordinates in the map coordinates
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
        //  required: [true, 'Tour must have at least one guide']
      }
    ]
  },
  {
    // Options: when outputting JSON or JS objects, include virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property: duration in weeks (not stored in DB)
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // Convert duration from days to weeks
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // The field in the current document (Tour) that refers to the other document (Review)
  foreignField: 'tour' // The field in the Review document that refers to the current document (Tour)
  //justOne: false // Return an array of documents instead of a single document
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// This pre-save hook creates a slug from the tour name before saving it to the database
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true }); // Generate a URL-friendly version of the tour name
  next(); // Proceed to the next middleware
});

// QUERY MIDDLEWARE: applies to all queries starting with "find"
// This pre-find hook filters out secret tours from query results
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); // Exclude tours where secretTour is true

  // Capture the start time of the query for performance logging
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt'
  });
  next();
});
// After executing any find query, log the query duration and the results
// tourSchema.post(/^find/, function(docs, next) {
//   // console.log(`Query took: ${Date.now() - this.start} milliseconds`);
//   // console.log(docs); // Log the documents retrieved
//   next();
// });

// Create a Tour model from the schema (like a factory for tour objects)
const Tour = mongoose.model('Tour', tourSchema);

// Export the Tour model so it can be used in other files
module.exports = Tour;
