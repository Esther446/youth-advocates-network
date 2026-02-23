# Youth Action Network (YAN) Platform

This repository contains the full stack implementation of the YAN Platform.

## Project Structure
- `/backend`: Node.js/Express API with MongoDB and Cloudinary integration.
- `/frontend`: Vanilla JS frontend with a production-grade API client.

## Quick Start
1. **Backend**:
   - `cd backend`
   - `npm install`
   - Configure `.env` (see `.env.example`)
   - `npm start`
2. **Frontend**:
   - `cd frontend`
   - Open `index.html` in a web server (e.g., Live Server)

## Key Features
- **JWT Authentication**: Secure login/registration with httpOnly refresh cookies.
- **Membership Applications**: Full vetting workflow with file uploads.
- **Resource Hub**: Access to documents and progress tracking.
- **Analytics**: Admin dashboard with KPI tracking.
