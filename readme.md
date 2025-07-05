# 🚀 Travelexa – Full-Stack Travel Booking Platform

Travelexa is a full-stack travel booking platform built with the MERN stack. It allows users to browse and book travel tours, write reviews, make secure payments, and manage bookings — all via a secure, scalable REST API.

Live Site 👉 [travelexa.onrender.com](https://travelexa.onrender.com)  
GitHub 👉 [View Code](https://github.com/RohitMaji18/Travelexa)

---

## 🛠 Tech Stack

**Frontend**  
- Pug (Server-side rendered UI)  
- Leaflet.js (Interactive tour maps)

**Backend**  
- Node.js + Express.js  
- MongoDB + Mongoose  
- RESTful APIs (MVC pattern)  
- JWT (Authentication & Authorization)  
- Stripe API (Payments)  
- SendGrid (Emails)  
- Multer + Sharp (Image Upload & Compression)

---

## ✅ Features

- 🧾 **User Authentication** (JWT-based with role-based access: admin, guide, user)
- 📍 **Tours Listing** with real-time filtering and geolocation mapping
- 💳 **Secure Payments** using Stripe Checkout Session
- 📦 **Bookings API** with full CRUD operations
- 🧾 **Email Notifications** via SendGrid (welcome, booking, password reset)
- 🖼 **Tour Image Upload** with Multer & Sharp (compression)
- 🛡 **Backend Security**: rate limiting, data sanitization, parameter pollution prevention
- 📦 **.env Configuration** and fully versioned routes

---

## 📁 Folder Structure

```
Travelexa/
├── controllers/
├── models/
├── routes/
├── utils/
├── views/           # Pug templates
├── public/          # Static assets (JS/CSS/Images)
├── config.env
├── app.js
├── server.js
```

---

## 🔐 Roles & Access

| Role    | Permissions                            |
|---------|----------------------------------------|
| User    | Sign up, browse tours, book, write reviews |
| Guide   | Access limited admin routes (Postman only) |
| Admin   | Full access (manage tours/users/bookings) |

---

## 🧪 Setup Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/RohitMaji18/Travelexa.git
   cd Travelexa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Create `.env` file (see `config.env`)
   - Add:
     ```
     NODE_ENV=development
     PORT=3000
     DATABASE=mongodb+srv://...
     JWT_SECRET=your_jwt_secret
     STRIPE_SECRET_KEY=your_stripe_key
     SENDGRID_USERNAME=your_username
     SENDGRID_PASSWORD=your_password
     ```

4. **Start the app**
   ```bash
   npm run dev
   ```

---

## 📦 Deployment

- 🔗 **Render** (Node.js backend + Pug frontend)  
- 💳 Stripe Test Environment  
- 📤 SendGrid (email sending)

---

## 📃 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## 🙋‍♂️ Author

Developed by [Rohit Maji](https://www.linkedin.com/in/rohit-maji/)  
💻 MCA Student @ NIT Agartala  


