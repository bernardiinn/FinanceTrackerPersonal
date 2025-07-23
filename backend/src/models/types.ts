export interface User {
  id: number;
  email: string;
  password?: string; // Optional for responses (don't send password to frontend)
  first_name?: string;
  last_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'other';
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  next_payment_date: string;
  type: 'credit_card' | 'personal' | 'mortgage' | 'auto' | 'student';
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  accountsTotal: number;
  goalsProgress: number;
  debtTotal: number;
}
