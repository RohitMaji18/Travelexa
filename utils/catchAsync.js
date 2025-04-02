// Export a higher-order function that takes an asynchronous function "fn" as input
module.exports = fn => {
  // Return a new function that takes Express's req, res, and next parameters
  return (req, res, next) => {
    // Call the async function "fn" with req, res, next, and if it returns a rejected promise,
    // automatically catch the error and pass it to the next middleware (error handler)
    fn(req, res, next).catch(next);
  };
};
