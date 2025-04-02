const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      success: 'status',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    // Validate that the doc ID provided is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    //   return next(
    //     new AppError('Invalid ID format. Please provide a valid ObjectId.', 400)
    //   );
    // }
    // Find the tour by ID and update it with the new data (req.body)
    // The options: new: true returns the updated document, runValidators: true enforces schema validations
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    // If no tour is found, return a 404 error
    if (!doc) {
      return next(new AppError('No doucument found with that ID', 404));
    }
    // Send the updated doc as a response
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // Create a new document using the provided data (req.body)
    const doc = await Model.create(req.body);
    // Send the created doc as a response
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // Find the tour by ID
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // If no tour is found, create an error and pass it to the error handling middleware
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    // Send the found tour in the response
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
