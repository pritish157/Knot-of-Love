# Knot of Love 💍

**Live Demo:** [https://knot-of-love.vercel.app](https://knot-of-love.vercel.app)

Knot of Love is a premium, secure, and fully-featured matrimonial platform built on the MERN stack. It empowers users to find meaningful connections with robust matchmaking algorithms, rigorous KYC verification, and an intuitive user interface.

## 🌟 Features

- **Robust Matchmaking Engine**: Smart recommendations based on comprehensive lifestyle, profession, and cultural preferences.
- **Secure Authentication**: JWT-based stateless authentication with OTP email/phone verification and bcrypt password hashing.
- **Strict Identity Verification (KYC)**: Admin-only dashboard for reviewing user government IDs (Aadhar, PAN, Passport) and maintaining platform trust.
- **Dynamic Profiles & Privacy**: Support for blurred photos for unverified accounts and role-based access control.
- **Real-Time Communication**: In-app messaging system unlocked only after mutual interest acceptance.
- **Admin Dashboard**: Centralized management interface for tracking metrics, moderating bios, and approving documents.
- **Production-Ready Security**: Fully hardened backend with Helmet (CSP), Rate Limiting, HTTP Parameter Pollution protection (HPP), and NoSQL Injection prevention.

## 🚀 Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS & Framer Motion
- **Routing**: React Router DOM (Lazy Loaded)
- **State Management**: React Context API
- **Form Handling**: React Hook Form

### Backend
- **Server**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Image Storage**: ImageKit CDN integration
- **Security**: Helmet, express-rate-limit, mongo-sanitize, xss-clean
- **Email Delivery**: Nodemailer

## 🛠 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pritish157/Knot-of-Love.git
   cd Knot-of-Love
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend/` directory:
   ```bash
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Running Locally:**
   Open two terminals.
   - Terminal 1 (Backend): `cd backend && npm run dev`
   - Terminal 2 (Frontend): `cd frontend && npm run dev`

## 📦 Deployment (Vercel & Render)

The repository is pre-configured for seamless cloud deployment:
- **Frontend (Vercel):** A `vercel.json` file is included to handle Single Page Application (SPA) fallback routing. Set your build command to `npm run build`.
- **Backend (Render):** Uses strict port binding (`process.env.PORT`) and standard npm scripts (`npm start`). Set environment variables accordingly.

## 📜 License
This project is proprietary and intended for Knot of Love operations. All rights reserved.
