// Define a custom error class that extends the built-in Error class
class AppError extends Error {
  // The constructor takes a message and a statusCode as parameters
  constructor(message, statusCode) {
    super(message); // Call the parent Error class constructor with the error message
    this.statusCode = statusCode; // Store the provided HTTP status code

    // Determine the error status based on the status code:
    // - 'fail' for 4xx errors (client errors)
    // - 'error' for 5xx errors (server errors)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Mark this error as operational, meaning it's expected and handled
    // Operational errors are ones that are foreseen and managed, as opposed to programming errors
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it,
    // making debugging easier by pointing directly to the source of the error
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export the AppError class so it can be used in other modules
module.exports = AppError;
