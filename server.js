const mongoose = require('mongoose'); // Importing Mongoose for database connection
const dotenv = require('dotenv'); // Importing dotenv to manage environment variables

// Handling uncaught exceptions (e.g., undefined variables, syntax errors)
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); // Exiting the process due to an unrecoverable error
});

// Loading environment variables from config.env file
dotenv.config({ path: './config.env' });

const app = require('./app'); // Importing the Express application

// Replacing the placeholder <PASSWORD> in the database connection string with the actual password from environment variables
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connecting to MongoDB using Mongoose
mongoose
  .connect(DB, {
    useNewUrlParser: true, // Using the new URL parser (recommended)
    useCreateIndex: true, // Ensuring indexes are created properly
    useFindAndModify: false // Disabling findAndModify to use native methods like findOneAndUpdate()
  })
  .then(() => console.log('DB connection successful!')); // Logging successful DB connection

// Setting the port from environment variables or defaulting to 3000
const port = process.env.PORT || 3000;
// Starting the Express server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handling unhandled promise rejections (e.g., failed database connection)
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); // Gracefully shutting down the server before exiting
  });
});
