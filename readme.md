🚀 Travelexa – AI-Powered Travel Platform
A comprehensive, full-stack travel booking application built with Node.js, Express, MongoDB, and Pug. Travelexa allows users to discover, book, and review tours, featuring secure payments, interactive maps, and a powerful AI Itinerary Planner powered by Google's Generative AI.


https://travelexa.onrender.com" target="_blank">Live Demo ·
https://github.com/RohitMaji18/Travelexa" target="_blank">View Code



https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"> https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"> https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"> https://img.shields.io/badge/Pug-E3C291?style=for-the-badge&logo=pug&logoColor=black" alt="Pug"> https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe"> https://img.shields.io/badge/License-ISC-yellow.svg?style=for-the-badge" alt="License: ISC">
✨ Key Features
AI Itinerary Planner: Generate custom, dynamic travel plans using Google's Generative AI, a standout feature of the platform.

Secure User Authentication: Robust JWT-based authentication with httpOnly cookies, password hashing (bcryptjs), password reset, and role-based access control (user, guide, admin).

RESTful API: A well-structured API following the MVC pattern with versioned routes (/api/v1/...).

Interactive Tour Maps: View tour locations on dynamic maps powered by Leaflet.js, with data passed from the server.

Secure Online Payments: Seamless and secure payment processing integrated via Stripe Checkout, with webhooks for fulfillment.

CRUD Operations: Full create, read, update, and delete functionality for tours, users, and bookings.

Automated Email Notifications: Users receive emails for welcome, password resets, and booking confirmations using Nodemailer.

Advanced Backend Security: Protected against common threats with rate limiting, data sanitization (against XSS and NoSQL injection), parameter pollution prevention (HPP), CORS, and security headers via Helmet.

Image Upload & Processing: Efficient handling of image uploads with Multer and on-the-fly image compression using Sharp.

Server-Side Rendering: A fast and SEO-friendly user interface built with Pug templates.

Robust Error Handling: A centralized global error handling middleware for operational and programmer errors.

🛠️ Tech Stack
Category	Technology / Service
Frontend	Pug (SSR), CSS3, JavaScript (ES6+), Leaflet.js, Axios, Parcel Bundler
Backend	Node.js, Express.js
Database	MongoDB, Mongoose (ODM)
Artificial Intelligence	Google Generative AI (@google/generative-ai)
Authentication	JSON Web Tokens (JWT), bcryptjs, cookie-parser
Payments	Stripe API
Emails	Nodemailer
File Handling	Multer (Uploads), Sharp (Image Processing)
Security	Helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp, CORS
DevOps & Tooling	ESLint, Prettier, Morgan (Logging), Nodemon, cross-env, ndb (Debugging)

Export to Sheets
🗺️ API Endpoints
The application exposes the following RESTful API endpoints under /api/v1/:

Method	Endpoint	Description
POST	/users/signup	Register a new user.
POST	/users/login	Log in a user and receive a JWT.
GET	/tours	Get a list of all tours with filtering.
GET	/tours/:id	Get details for a single tour.
GET	/bookings/checkout-session/:tourId	Get a Stripe session for booking a tour.
POST	/ai/itinerary	Generate a new travel itinerary with AI.
... and many more CRUD endpoints for tours, users, bookings, and reviews.		

Export to Sheets
🚀 Getting Started
To get a local copy up and running, follow these steps.

1. Clone the Repository
Bash

git clone https://github.com/RohitMaji18/Travelexa.git
cd Travelexa
2. Install Dependencies
Bash

npm install
3. Configure Environment Variables
Create a config.env file in the root of the project. This file stores all your secret keys and configuration variables.

Code snippet

NODE_ENV=development
PORT=3000

# Your MongoDB connection string
DATABASE=mongodb+srv://...

# JWT secret for signing tokens
JWT_SECRET=a-long-and-very-secure-secret-for-jwt
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Stripe API keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email configuration (e.g., SendGrid)
SENDGRID_USERNAME=your_email_service_username
SENDGRID_PASSWORD=your_email_service_password

# Google Generative AI API Key
GOOGLE_API_KEY=your_google_ai_api_key
4. Run the Application
This project uses nodemon for backend live-reloading and parcel for frontend asset bundling. For the best development experience, run the backend and frontend scripts in two separate terminals.

Terminal 1: Start the Backend Server

Bash

npm run dev
Terminal 2: Watch for Frontend Changes

Bash

npm run watch:js
The application will be available at http://localhost:3000.

📄 License
Distributed under the ISC License. See LICENSE for more information.

👨‍💻 Author
Rohit Maji - A passionate developer and MCA Student at NIT Agartala.

GitHub: @RohitMaji18
