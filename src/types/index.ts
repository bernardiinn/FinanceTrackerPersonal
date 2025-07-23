export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  pinEnabled?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'other';
}

export interface Loan {
  id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  payment_frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly';
  next_payment_date: string;
  type: 'credit_card' | 'personal' | 'mortgage' | 'auto' | 'student';
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  type: 'income' | 'expense';
  is_active: boolean;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  accountsTotal: number;
  goalsProgress: number;
  debtTotal: number;
}

export interface ExpenseCategory {
  name: string;
  color: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { name: 'Food & Dining', color: '#ef4444', icon: '🍽️' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#8b5cf6', icon: '🛍️' },
  { name: 'Entertainment', color: '#f59e0b', icon: '🎬' },
  { name: 'Bills & Utilities', color: '#10b981', icon: '💡' },
  { name: 'Healthcare', color: '#ef4444', icon: '🏥' },
  { name: 'Education', color: '#6366f1', icon: '📚' },
  { name: 'Travel', color: '#14b8a6', icon: '✈️' },
  { name: 'Other', color: '#6b7280', icon: '📦' },
];

export interface TrustedDevice {
  id: number;
  device_name?: string;
  last_used: string;
  created_at: string;
  expires_at: string;
}

export const INCOME_CATEGORIES: ExpenseCategory[] = [
  { name: 'Salary', color: '#10b981', icon: '💼' },
  { name: 'Freelance', color: '#3b82f6', icon: '💻' },
  { name: 'Investment', color: '#8b5cf6', icon: '📈' },
  { name: 'Gift', color: '#f59e0b', icon: '🎁' },
  { name: 'Other', color: '#6b7280', icon: '💰' },
];
