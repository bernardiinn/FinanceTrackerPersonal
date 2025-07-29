# Personal Finance Manager 💰

A modern, full-stack personal finance management application built with React, TypeScript, and Express.js. Track your income, expenses, financial goals, and debts with a clean, responsive interface and offline support.

## ✨ Features

### 📊 Dashboard
- Monthly income vs expenses overview
- Account balances summary
- Quick stats for goals and debt progress
- Recent transactions display

### 💸 Expense Tracking
- Add and categorize expenses
- Filter by category, date range
- Visual expense breakdown
- Support for multiple expense categories
- **🆕 Receipt OCR**: Upload receipt images and automatically extract merchant, amount, and date using OCR technology

### 💰 Income Management
- Log recurring and one-time income sources
- Track different income types (salary, freelance, etc.)
- Income history and analytics

### 🎯 Financial Goals
- Set and track savings goals
- Progress visualization
- Multiple goal categories (emergency, vacation, etc.)
- Add funds to goals incrementally

### 🏦 Debt & Loan Tracking
- Track multiple types of debt (credit cards, loans, etc.)
- Payment progress visualization
- Interest rate and payment tracking
- Debt payoff planning

### 🔄 Recurring Transactions
- Manage subscriptions and recurring payments
- Automatic transaction scheduling
- Pause/resume recurring items
- Track monthly recurring income and expenses

### 🌙 Additional Features
- Dark/Light mode toggle
- Responsive design for all devices
- Progressive Web App (PWA) support
- Offline functionality
- Modern, accessible UI

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast development and building
- **Tailwind CSS** - Utility-first styling with dark mode
- **React Router** - Client-side routing
- **PWA** - Progressive Web App capabilities

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe backend development
- **SQLite** - Lightweight database with .db file storage
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Python OCR** - Receipt text extraction using pytesseract and OpenCV

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- **Python 3.7+** (for receipt OCR functionality)
- **Python packages**: `pytesseract`, `opencv-python`
- **System package**: `tesseract-ocr` (OCR engine)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financetracker
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Setup Python OCR dependencies**
   ```bash
   # Install system OCR engine (macOS with Homebrew)
   brew install tesseract
   
   # Install Python packages
   pip3 install pytesseract opencv-python
   
   # For other systems:
   # Ubuntu/Debian: sudo apt-get install tesseract-ocr
   # Windows: Download from GitHub releases or use chocolatey
   ```

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on http://localhost:3001

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

### Building for Production

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Build the backend**
   ```bash
   cd backend
   npm run build
   ```

3. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

## 📁 Project Structure

```
financetracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   └── Navbar.tsx       # Navigation component
│   ├── pages/               # Route-specific pages
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Expenses.tsx     # Expense tracking
│   │   ├── Income.tsx       # Income management
│   │   ├── Goals.tsx        # Financial goals
│   │   ├── Loans.tsx        # Debt tracking
│   │   └── Recurring.tsx    # Recurring transactions
│   ├── services/            # API and data services
│   │   └── api.ts           # API client functions
│   ├── utils/               # Utility functions
│   │   └── helpers.ts       # Common helper functions
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types
│   ├── hooks/               # Custom React hooks
│   │   └── useDarkMode.ts   # Dark mode functionality
│   └── App.tsx              # Main app component
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── database/        # Database configuration
│   │   ├── models/          # Data models and types
│   │   ├── middleware/      # Express middleware
│   │   └── index.ts         # Server entry point
│   └── finance.db           # SQLite database file
└── public/                  # Static assets
```

## 🎨 UI Components

The application uses a consistent design system with:
- **Cards** - Clean containers for content sections
- **Forms** - Accessible input fields and validation
- **Navigation** - Responsive navbar with mobile support
- **Dark Mode** - System preference aware theme switching
- **Responsive Grid** - Mobile-first responsive layouts

## 🗄️ Database Schema

The SQLite database includes the following tables:
- `transactions` - Income and expense records
- `accounts` - User account information
- `goals` - Financial goal tracking
- `loans` - Debt and loan management
- `recurring_transactions` - Subscription and recurring payments

## 🔧 API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Receipt OCR
- `POST /api/receipts/parse` - Upload and parse receipt image
- `GET /api/receipts/health` - Check OCR system health

### Additional endpoints for goals, loans, and recurring transactions are available.

## 🚀 Deployment

The application can be deployed to various platforms:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, or any Node.js hosting
- **Database**: SQLite file can be persistent on most platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons and emojis for enhanced visual experience
- Tailwind CSS for the excellent utility-first framework
- React community for the amazing ecosystem
- SQLite for the reliable embedded database

---

Built with ❤️ using React, TypeScript, and modern web technologies.
