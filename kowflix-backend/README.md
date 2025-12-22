# KowFlix Backend

Backend API for the KowFlix streaming platform, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- FFmpeg (for video encoding features)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/kowflix

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000

# Media Paths (Local)
MEDIA_ROOT=C:/media/DATA/kowflix
UPLOAD_DIR=C:/media/DATA/kowflix/uploads
POSTER_DIR=C:/media/DATA/kowflix/posters
HLS_DIR=C:/media/DATA/kowflix/hls
THUMB_DIR=C:/media/DATA/kowflix/thumbnails

# Remote Server (Optional - for production sync)
REMOTE_HOST=192.168.100.52
REMOTE_USER=kowflix
REMOTE_SSH_KEY_PATH=C:/Users/Admin/.ssh/kowflix_backend_key
REMOTE_MEDIA_ROOT=/media/DATA/kowflix

# Public Media URL
PUBLIC_MEDIA_URL=https://nk203.id.vn/media

# External APIs
TMDB_API_KEY=your-tmdb-api-key-here
```

## Running the Server

Development mode (with nodemon):
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in .env).

## API Documentation

The API is organized into the following resources:

- **Auth**: `/api/auth` - User registration and login
- **Movies**: `/api/movies` - Movie management, streaming, and TMDb integration
- **Users**: `/api/users` - User management (Admin)
- **Profiles**: `/api/profile` - User profile management
- **Categories**: `/api/categories` - Movie categories
- **Progress**: `/api/progress` - Watch progress tracking
- **Analytics**: `/api/analytics` - Dashboard statistics (Admin)
- **Hero Banners**: `/api/hero` - Homepage hero slider management
- **Reviews**: `/api/reviews` - Movie reviews
- **Notifications**: `/api/notifications` - User notifications
- **Jobs**: `/api/jobs` - Background job management (Admin)
- **Encoding**: `/api/encode` - Video encoding triggers

## Postman Collection

A Postman collection is included in this repository: `KowFlix_API.postman_collection.json`.
Import this file into Postman to test the API endpoints.
