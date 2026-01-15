# Fresh End

> **Fighting Food Waste, One Product at a Time**

## Project Overview

**Fresh End** is an innovative platform that connects food businesses with consumers to combat food waste and promote sustainability. The platform enables stores to sell products approaching their expiration date at discounted prices, preventing them from being thrown away while allowing consumers to save money and contribute to environmental conservation.

This project offers a **Win-Win-Win** solution:

- **Stores** - Reduce losses and increase profits
- **Consumers** - Save money while helping the environment
- **Planet Earth** - Less food waste and reduced environmental impact

---

## Key Features

### Consumer Features

- **Smart Product Search** - Search by name, category, location, and price
- **Interactive Map View** - View available products nearby using Leaflet maps
- **Cart Management** - Add, remove, and update product quantities
- **Order Tracking** - View order history and delivery status
- **Secure Payment** - Integrated PayPal payment processing
- **Real-time Notifications** - Updates on orders, deals, and new products
- **Personalized Recommendations** - Product suggestions based on purchase history

### Store Manager Features

- **Advanced Dashboard** - Comprehensive view of store performance
- **Smart Inventory Management** - Add, edit, and delete products (CRUD operations)
- **Automatic Expiry Monitoring** - Alerts for products approaching expiration
- **Detailed Sales Reports** - Analysis of revenue, orders, and trends
- **Performance Analytics** - Charts and graphs of sales over time
- **Payment Management** - Track earnings and withdrawal requests
- **Excel Import** - Quick inventory upload via Excel files

### Courier Features

- **Delivery Management** - View and accept available deliveries
- **Navigation** - Integrated maps for pickup and delivery locations
- **Digital Wallet** - Track earnings and delivery history
- **Courier Reports** - Personal performance statistics
- **New Delivery Alerts** - Real-time updates on available jobs

### Admin Features

- **User Management** - Add, edit, and delete users
- **Store Management** - Approve new store registrations
- **System-wide Reports** - Data analytics for the entire platform
- **Commission Management** - Track platform revenue
- **Permissions & Roles** - Manage user roles and access control
- **Data Analytics** - Insights on platform usage and performance

---

## Tech Stack

### Frontend

- **Vue.js 3** - Modern framework with Composition API
- **TypeScript** - Enhanced type safety and IntelliSense
- **Vite** - Fast build tool with excellent developer experience
- **Pinia** - Modern state management for Vue
- **Vue Router** - Client-side routing
- **Leaflet** - Interactive maps
- **Chart.js** - Dynamic charts and graphs
- **Axios** - HTTP client for API requests
- **Socket.io Client** - Real-time communication
- **Vee-Validate** - Form validation
- **Lucide Icons** - Modern icon library
- **EmailJS** - Email sending from the browser
- **XLSX** - Excel file reading and creation

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Firebase Admin SDK** - Authentication and Firestore
- **PayPal SDK** - Payment processing
- **Socket.io** - Real-time bidirectional communication
- **Nodemailer** - Email sending from server
- **Sharp** - Image processing
- **OpenAI API** - AI capabilities
- **Multer** - File upload handling
- **dotenv** - Environment variable management
- **Winston** - Advanced logging

### Development & Testing Tools

- **Vitest** - Unit testing for Vue
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Supertest** - HTTP assertion testing

---

## Installation & Setup

### Prerequisites

- Node.js (version 18 or higher)
- MongoDB (installed locally or MongoDB Atlas connection)
- Firebase account
- PayPal Developer account (optional for development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hodaya-A/Final-project.git
cd Final-project
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure Backend Environment Variables

Create a `.env` file in the `backend` folder and add the following variables:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/fresh-end
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fresh-end

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'live' for production

# EmailJS (Optional)
EMAILJS_SERVICE_ID=your-service-id
EMAILJS_TEMPLATE_ID=your-template-id
EMAILJS_USER_ID=your-user-id

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key

# Server
PORT=3000
```

### Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 5: Configure Firebase in Frontend

Create a `src/services/firebase.ts` file (if it doesn't exist) and configure Firebase:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Step 6: Start the Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm start
# Or for development with nodemon:
# npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The project will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

---

## Project Structure

```
fresh-end/
│
├── 📂 frontend/                    # Vue.js Application
│   ├── 📂 public/                 # Static files
│   ├── 📂 src/
│   │   ├── 📂 assets/            # Images, CSS
│   │   ├── 📂 components/        # Reusable Vue components
│   │   ├── 📂 views/             # Main page components
│   │   ├── 📂 router/            # Vue Router configuration
│   │   ├── 📂 stores/            # Pinia stores (state management)
│   │   ├── 📂 services/          # API services & Firebase
│   │   ├── 📂 utils/             # Helper functions
│   │   ├── 📄 App.vue            # Root component
│   │   └── 📄 main.ts            # Entry point
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 tsconfig.json
│
├── 📂 backend/                     # Node.js/Express Server
│   ├── 📂 config/                 # Configuration (Firebase, DB)
│   ├── 📂 models/                 # Mongoose schemas
│   │   ├── 📄 Product.js
│   │   ├── 📄 Order.js
│   │   ├── 📄 Store.js
│   │   ├── 📄 Inventory.js
│   │   └── 📄 Notification.js
│   ├── 📂 routes/                 # API endpoints
│   │   ├── 📄 products.js
│   │   ├── 📄 orders.js
│   │   ├── 📄 stores.js
│   │   ├── 📄 users.js
│   │   ├── 📄 payments.js
│   │   ├── 📄 inventory.js
│   │   ├── 📄 reports.js
│   │   ├── 📄 notifications.js
│   │   └── 📄 analytics.js
│   ├── 📂 utils/                  # Helper functions
│   ├── 📂 tests/                  # Jest tests
│   ├── 📂 uploads/                # Uploaded files
│   ├── 📄 server.js               # Entry point
│   ├── 📄 package.json
│   └── 📄 .env                    # Environment variables (not in repo!)
│
├── 📂 docs/                        # Additional documentation
│   ├── 📄 SETUP_CHECKLIST.md
│   ├── 📄 ARCHITECTURE.md
│   ├── 📄 DEPLOYMENT_CHECKLIST.md
│   └── 📄 ...
│
├── 📄 README.md                    # This document
└── 📄 package.json                 # Root scripts
```

---

## Advanced Features

### Real-Time Notification System

- Instant notifications using Socket.io
- Alerts for new orders, status changes, and products approaching expiration
- Customizable notifications based on user preferences

### Analytics & Reports

- Daily, weekly, and monthly sales reports
- Trend analysis and forecasting
- Data export to Excel
- Interactive charts and graphs

### Geolocation Features

- Search products by distance from user
- Display stores on interactive map
- Optimal route calculation for couriers

### Payment System

- Secure payment processing via PayPal
- Automatic payment splitting (platform, store, courier)
- Commission and revenue tracking
- Withdrawal request management

### Smart Image Management

- Automatic product image upload
- Image optimization and compression
- AI integration for product recognition
- Automatic backup

---

## Testing

### Run Frontend Tests

```bash
cd frontend
npm run test:unit
```

### Run Backend Tests

```bash
cd backend
npm test

# With coverage:
npm run test:coverage
```

---

## Deployment

### Frontend (Netlify/Vercel)

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```
2. Upload the `dist/` folder to your hosting service

### Backend (Heroku/Railway/Render)

1. Ensure all environment variables are configured
2. Deploy the `backend/` folder
3. Set `PORT` as an environment variable

Follow the complete [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for more details.

---

## Development Team

This project was developed as a final project by:

- **Aviva Brurian**
- **Hodaya Avraham**

---

## License

This project was created for educational purposes as part of a final project.

---

## Contact

For questions, suggestions, or issues, please open an issue in the GitHub repository or contact the developers.

---

## Acknowledgments

Special thanks to:

- The Vue.js community for the amazing tools
- MongoDB for the flexible database solution
- Firebase for authentication solutions
- All the libraries and developers who contributed to this project

---

<div align="center">

### Together We Reduce Food Waste and Save the Planet!

**Made with ❤️ by Aviva & Hodaya**

</div>
