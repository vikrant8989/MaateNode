# Maate - Food Delivery API

A comprehensive Node.js/Express.js API for a food delivery platform with support for users, restaurants, drivers, and admin management.

## 🚀 Features

- **Multi-role Support**: Admin, User, Restaurant, and Driver modules
- **MongoDB Integration**: Robust database connection with error handling
- **RESTful API**: Clean and organized endpoint structure
- **Environment Configuration**: Flexible configuration management
- **Error Handling**: Comprehensive error handling and logging

## 📁 Project Structure

```
maate/
├── admin/           # Admin module
│   ├── controller/  # Admin controllers
│   ├── modal/       # Admin models
│   └── routes/      # Admin routes
├── config/          # Configuration files
│   └── database.js  # Database connection
├── driver/          # Driver module
│   ├── controller/  # Driver controllers
│   ├── modal/       # Driver models
│   └── routes/      # Driver routes
├── middlewres/      # Middleware functions
├── restaurant/      # Restaurant module
│   ├── controller/  # Restaurant controllers
│   ├── modal/       # Restaurant models
│   └── routes/      # Restaurant routes
├── user/            # User module
│   ├── controller/  # User controllers
│   ├── modal/       # User models
│   └── routes/      # User routes
├── utils/           # Utility functions
├── index.js         # Main server file
└── package.json     # Dependencies
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/maate
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=24h
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - API health status

### Admin Routes
- `POST /api/admin/send-otp` - Send OTP to admin phone
- `POST /api/admin/verify-otp` - Verify OTP and login
- `GET /api/admin/profile` - Get admin profile (Protected)
- `PUT /api/admin/profile` - Update admin profile (Protected)
- `GET /api/admin/dashboard` - Get dashboard data (Protected)
- `POST /api/admin/logout` - Logout admin (Protected)

### User Routes
- `GET /api/user` - User endpoint
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login

### Restaurant Routes
- `GET /api/restaurant` - Restaurant endpoint
- `POST /api/restaurant/register` - Restaurant registration
- `GET /api/restaurant/menu` - Restaurant menu

### Driver Routes
- `GET /api/driver` - Driver endpoint
- `POST /api/driver/register` - Driver registration
- `GET /api/driver/orders` - Driver orders

## 🗄️ Database

The application uses MongoDB as the primary database. The connection is configured in `config/database.js` with the following features:

- Automatic reconnection
- Error handling
- Graceful shutdown
- Connection event logging

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon

### Testing

Run the admin API tests:
```bash
node test_admin_api.js
```

This will test all admin endpoints including:
- OTP authentication
- Profile management
- Dashboard access
- Logout functionality

### Adding New Features

1. **Create Models**: Add Mongoose schemas in the respective `modal/` directories
2. **Create Controllers**: Add business logic in the respective `controller/` directories
3. **Create Routes**: Add API endpoints in the respective `routes/` directories
4. **Add Middleware**: Create custom middleware in the `middlewres/` directory

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/maate |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration time | 24h |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository. 