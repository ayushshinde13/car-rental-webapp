<<<<<<< HEAD
# Car Rental App

A full-stack car rental platform with multi-role support (Renter, Provider, Admin) built with React and Node.js.

## Features

- **Multi-role Authentication**: Supports renters, providers, and administrators
- **Vehicle Management**: Browse, add, and manage vehicles with image uploads
- **Booking System**: Rent cars with flexible duration options
- **Wallet System**: Integrated wallet with coin-based rewards
- **Responsive UI**: Mobile-friendly interface with modern design
- **Secure Payments**: Stripe integration for secure transactions

## Tech Stack

### Frontend
- React 19.2.3
- React Router for navigation
- Axios for API requests
- Framer Motion for animations
- Lucide React for icons
- Custom CSS (without Tailwind)

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Stripe for payments

## Project Structure

```
car-rental-app/
├── frontend/           # React frontend application
│   ├── public/         # Public assets
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React Context providers
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   └── App.js      # Main application component
│   └── package.json
└── backend/            # Express backend application
    ├── controllers/    # Request handlers
    ├── models/         # Database models
    ├── routes/         # API routes
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (running locally or cloud instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/car-rental-app.git
cd car-rental-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/car-rental
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/me` - Get current user info

### Vehicles
- `GET /api/cars` - Get all vehicles
- `GET /api/cars/:id` - Get vehicle by ID
- `POST /api/cars` - Add new vehicle (providers only)
- `PUT /api/cars/:id` - Update vehicle (providers only)
- `DELETE /api/cars/:id` - Delete vehicle (providers only)

### Users
- `GET /api/users/cart` - Get user's cart
- `POST /api/users/cart` - Add item to cart
- `DELETE /api/users/cart/:id` - Remove item from cart
- `PATCH /api/users/cart/:id` - Update cart item

## Roles

- **Renter**: Can browse vehicles, add to cart, make bookings, and manage their rentals
- **Provider**: Can add, update, and delete their own vehicles
- **Admin**: Has access to admin dashboard and user management (currently limited)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the ISC License.
=======
# car-rental-webapp
Car Rental App •  Created a full-stack car rental platform using the MERN stack with JWT-based authentication, role-based access control (admin/user), RESTful APIs, and CRUD operations. •  Tech Stack: React.js, Node.js, Express.js, MongoDB, JWT 
>>>>>>> 3d75b794e7bc4407b269f9844475601718d28352
