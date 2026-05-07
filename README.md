# Tender and Bank Guarantee Management System

A full-stack web application for managing tenders and bank guarantees, built with React, Node.js, Express, and MongoDB.

## Features

- **Tender Management** — Create, edit, and track contracts with full lifecycle status
- **Bank Guarantees** — Link guarantees to tenders, track expiry with alerts
- **Document Upload** — Attach PDF and image documents to tenders and guarantees
- **Nepali Date Support** — Dual B.S./A.D. date input and display throughout
- **Dashboard Analytics** — Charts for contract value, tender status, monthly trends
- **Expiry Alerts** — Monitor guarantees expiring within 30 days

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| File Storage | Cloudinary (images), Local disk (PDFs) |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/bibekbhandari02/Tender-and-Bank-Guarantee-Management-System.git
   cd Tender-and-Bank-Guarantee-Management-System
   ```

2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NODE_ENV=development
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000` with the API at `http://localhost:5000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NODE_ENV` | `development` or `production` |
