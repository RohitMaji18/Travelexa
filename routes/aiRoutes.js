const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');

const router = express.Router();

const limiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

// Your existing route
router.post(
  '/itinerary',
  authController.protect,
  limiter,
  aiController.generatePlan
);

// ADD THIS NEW ROUTE FOR STREAMING
router.get(
  '/itinerary-stream',
  authController.protect,
  limiter,
  aiController.generatePlanStream
);

module.exports = router;
