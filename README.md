# Safehood Backend

A comprehensive society management system backend built with Node.js, TypeScript, and PostgreSQL. This line is not added
by the owner of the repository.

## Features

- 🔐 Authentication with JWT and OTP
- 👥 User Management (Residents, Guards, Admins)
- 🏢 Society & Flat Management
- 🚪 Visitor Pass System
- 📢 Notice Board
- 🚨 Emergency Alerts
- 💰 Maintenance Billing
- 📱 Push Notifications
- 🔄 Rate Limiting
- 📁 File Upload System
- 🗄️ Redis Caching

## Tech Stack

- Node.js & TypeScript
- Express.js
- PostgreSQL with Sequelize ORM
- Redis for Caching & Rate Limiting
- Firebase Cloud Messaging
- Google Cloud Storage
- Twilio for SMS

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Safegoodapp/test.git
   cd test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   # Create database
   createdb safehood_dev
   
   # Run migrations
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication
- `POST /api/auth/send-otp` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get user dashboard
- `GET /api/users/residents` - Get society residents (Guard/Admin)

### Visitors
- `POST /api/visitors/passes` - Create visitor pass
- `GET /api/visitors/passes` - Get visitor passes
- `PUT /api/visitors/passes/:id/entry` - Update visitor entry/exit
- `GET /api/visitors/expected` - Get expected visitors

### Notices
- `POST /api/notices` - Create notice (Admin)
- `GET /api/notices` - Get notices
- `GET /api/notices/:id` - Get notice details
- `PUT /api/notices/:id` - Update notice (Admin)

### Emergency
- `POST /api/emergency` - Create emergency alert
- `GET /api/emergency/active` - Get active emergencies
- `PUT /api/emergency/:id/resolve` - Resolve emergency

### Billing
- `POST /api/billing` - Create maintenance bill (Admin)
- `GET /api/billing/bills` - Get bills
- `POST /api/billing/pay` - Record payment
- `GET /api/billing/history` - Get payment history

## Development

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Logging
- Use the logger utility for consistent logging
- Different log levels: error, warn, info, debug

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is private and confidential. All rights reserved.

## Support

For support, email support@safehood.com
