import type { Transaction, Account, Goal, Loan, RecurringTransaction, DashboardStats } from '../types';

const API_BASE_URL = '/api';

// Helper to get XSRF token from cookies
const getXsrfToken = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return undefined;
};

// Create headers with XSRF token
const createHeaders = (contentType = 'application/json'): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': contentType
  };
  
  const token = getXsrfToken();
  if (token) {
    headers['X-XSRF-TOKEN'] = token;
  }
  
  return headers;
};

// Real API functions connected to backend
export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    // Calculate stats from real data
    const [transactions, goals, loans] = await Promise.all([
      this.getTransactions(),
      this.getGoals(),
      this.getLoans(),
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const goalsProgress = goals.length > 0 
      ? goals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount * 100), 0) / goals.length
      : 0;

    const debtTotal = loans.reduce((sum, loan) => sum + loan.remaining_amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      accountsTotal: totalIncome - totalExpenses, // Simplified calculation
      goalsProgress: Math.min(goalsProgress, 100),
      debtTotal,
    };
  },

  // Transactions
  async getTransactions(type?: 'income' | 'expense'): Promise<Transaction[]> {
    const url = new URL(`${API_BASE_URL}/transactions`, window.location.origin);
    if (type) {
      url.searchParams.append('type', type);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }

    return response.json();
  },

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Failed to update transaction');
    }

    return response.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete transaction');
    }
  },

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    return response.json();
  },

  async createAccount(account: Omit<Account, 'id'>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      throw new Error('Failed to create account');
    }

    return response.json();
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }

    return response.json();
  },

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(goal),
    });

    if (!response.ok) {
      throw new Error('Failed to create goal');
    }

    return response.json();
  },

  async updateGoal(id: string, goal: Partial<Goal>): Promise<Goal> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(goal),
    });

    if (!response.ok) {
      throw new Error('Failed to update goal');
    }

    return response.json();
  },

  // Loans
  async getLoans(): Promise<Loan[]> {
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch loans');
    }

    return response.json();
  },

  async createLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(loan),
    });

    if (!response.ok) {
      throw new Error('Failed to create loan');
    }

    return response.json();
  },

  async updateLoan(id: string, loan: Partial<Loan>): Promise<Loan> {
    const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(loan),
    });

    if (!response.ok) {
      throw new Error('Failed to update loan');
    }

    return response.json();
  },

  async deleteLoan(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete loan');
    }
  },

  // Recurring Transactions
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const response = await fetch(`${API_BASE_URL}/recurring-transactions`, {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recurring transactions');
    }

    return response.json();
  },

  async createRecurringTransaction(transaction: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> {
    const response = await fetch(`${API_BASE_URL}/recurring-transactions`, {
      method: 'POST',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Failed to create recurring transaction');
    }

    return response.json();
  },

  async updateRecurringTransaction(id: string, transaction: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    const response = await fetch(`${API_BASE_URL}/recurring-transactions/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: createHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Failed to update recurring transaction');
    }

    return response.json();
  },

  async deleteRecurringTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/recurring-transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete recurring transaction');
    }
  },

  // Receipt OCR
  async parseReceipt(file: File): Promise<{
    success: boolean;
    data?: {
      merchant: string | null;
      total: number | null;
      date: string | null;
      raw_text: string;
      suggestions: {
        all_amounts: number[];
      };
    };
    error?: string;
    details?: string;
  }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const xsrfToken = getXsrfToken();
    const headers: Record<string,string> = {};
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
    const response = await fetch(`${API_BASE_URL}/receipts/parse`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData, // Don't set Content-Type header, let browser set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse receipt' }));
      throw new Error(errorData.error || 'Failed to parse receipt');
    }

    return response.json();
  },

  async checkOcrHealth(): Promise<{
    ocr_ready: boolean;
    script_exists: boolean;
    python_available: boolean;
    packages_available: boolean;
    requirements: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/receipts/health`, {
      method: 'GET',
      credentials: 'include',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check OCR health');
    }

    return response.json();
  },
};

export default api;
