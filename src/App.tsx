import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './auth/RequireAuth';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Goals from './pages/Goals';
import Loans from './pages/Loans';
import Recurring from './pages/Recurring';
import SecuritySettings from './pages/SecuritySettings';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public auth routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <RequireAuth>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/loans" element={<Loans />} />
                    <Route path="/recurring" element={<Recurring />} />
                    <Route path="/security" element={<SecuritySettings />} />
                  </Routes>
                </Layout>
              </div>
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
