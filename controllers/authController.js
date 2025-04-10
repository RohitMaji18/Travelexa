const crypto = require('crypto');
const { promisify } = require('util'); // Import promisify to convert callback-based functions into Promise-based ones
const jwt = require('jsonwebtoken'); // Import jsonwebtoken to handle JWT authentication
const User = require('./../models/userModel'); // Import the User model to interact with the users collection in the database
const catchAsync = require('./../utils/catchAsync'); // Import catchAsync to handle errors in asynchronous functions efficiently
const AppError = require('./../utils/appError'); // Import AppError to create custom error messages and responses
const Email = require('./../utils/email');
// Function to sign a JWT token with the user ID as the payload
const signToken = id => {
  return jwt.sign(
    {
      id // Payload containing user ID for identification
    },
    process.env.JWT_SECRET, // Secret key used to sign the token, stored securely in environment variables
    {
      expiresIn: process.env.JWT_EXPIRES_IN // Expiration time for the token (e.g., 90 days as per configuration)
    }
  );
};

const createSendToken = (user, statusCode, req, res) => {
  // Generate JWT and send response with status code
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // Expiration time for the JWT cookie
    httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
  //romove the password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Controller function for user signup, wrapped with catchAsync to catch and forward errors
exports.signup = catchAsync(async (req, res, next) => {
  // Creating a new user in the database using the provided request body data
  const newUser = await User.create({
    name: req.body.name, // User's name
    email: req.body.email, // User's email address
    password: req.body.password, // User's chosen password
    passwordConfirm: req.body.passwordConfirm // Confirmation of the password to ensure correctness
    // role: req.body.role // User role (e.g., admin, user, etc.)
  });
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  // Sending response with status 201 (Created) and user details
  createSendToken(newUser, 201, req, res);
});

// Controller function for user login, wrapped with catchAsync to handle errors
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // Extracting email and password from request body

  // 1) Check if both email and password exist in the request body
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400)); // Return error if any field is missing
  }

  // 2) Find the user in the database using the provided email and explicitly select the password field
  const user = await User.findOne({ email: email }).select('+password');

  // 3) Verify if the entered password matches the stored hashed password
  const correct = await user.correctPassword(password, user.password);

  // 4) If user does not exist or password is incorrect, return authentication error
  if (!user || !correct) {
    return next(new AppError('Invalid email or password!', 401));
  }

  // 5) Generate JWT token and send it to the client for authentication
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  // Clear the JWT cookie and send a response with status 200 (OK)
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Retrieve token from the authorization header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') // Check if the token is provided in Bearer format
  ) {
    token = req.headers.authorization.split(' ')[1]; // Extract the token from 'Bearer <token>'
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // If token is missing, return authentication error
  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }

  // 2) Verify the token to ensure its validity
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user corresponding to the token still exists in the database
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('User belonging to this token no longer exists.', 401)
    );
  }

  // 4) Check if the user has changed their password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User has changed their password! Please log in again.', 401)
    );
  }

  // Granting access to the protected route by attaching user information to request object
  req.user = freshUser;
  res.locals.user = freshUser;
  next(); // Proceed to the next middleware or route handler
});

//only for rendered pages ,no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2) Verify the token to ensure its validity
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if the user corresponding to the token still exists in the database
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next(
          new AppError('User belonging to this token no longer exists.', 401)
        );
      }

      // 4) Check if the user has changed their password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError(
            'User has changed their password! Please log in again.',
            401
          )
        );
      }

      // Granting access to the protected route by attaching user information to request object
      res.locals.user = freshUser;
      return next(); // Proceed to the next middleware or route handler
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the logged-in user's role exists in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to access this route.', 403) // Send a 403 error if the user does not have the required role
      );
    }
    next(); // Proceed to the next middleware if the user has permission
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Find the user based on the email provided in the request body
  const user = await User.findOne({ email: req.body.email });

  // If no user is found with the given email, return an error response
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }

  // 2) Generate a random password reset token for the user
  const resetToken = user.createPasswordResetToken();

  // Save the token and its expiration time to the database (without running validation checks)
  await user.save({ validateBeforeSave: false });

  // 3) Create the password reset URL that will be sent to the user

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    // Respond with a success message if the email is sent successfully
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    // If email sending fails, reset the password reset token and expiration fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save the user data again (without validation checks)
    await user.save({ validateBeforeSave: false });

    // Return an error response
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get the token from the request and hash it
  const hashedToken = crypto
    .createHash('sha256') // Use SHA-256 hashing
    .update(req.params.token) // Hash the token from the URL
    .digest('hex'); // Convert it to a hexadecimal string

  // Find the user with the hashed token and check if the token is still valid
  const user = await User.findOne({
    passwordResetToken: hashedToken, // Match the stored reset token
    passwordResetExpires: { $gt: Date.now() } // Ensure token is not expired
  });

  // If no user is found or token has expired, send an error
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // Set the new password from the request body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // Remove the reset token and expiry time since it's no longer needed
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the updated user data
  await user.save();

  // Log the user in and send a new JWT token
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from the database using their ID
  const user = await User.findById(req.user.id).select('+password'); // Include password field

  // Check if the entered current password matches the stored password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // Set the new password from the request body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // Save the updated user data
  await user.save();

  // Log the user in and send a new JWT token
  createSendToken(user, 200, req, res);
});
