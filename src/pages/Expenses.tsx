import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdTrendingDown } from 'react-icons/md';
import type { Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import api from '../services/api';
import { useLocalization } from '../hooks/useLocalization';

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
}

interface ExpenseFilter {
  category: string;
  startDate: string;
  endDate: string;
}

const Expenses: React.FC = () => {
  const { t, formatCurrency } = useLocalization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<ExpenseFormData>({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState<ExpenseFilter>({
    category: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const data = await api.getTransactions('expense');
        setTransactions(data);
      } catch (err: any) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExpense.amount || !newExpense.category || !newExpense.description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const expense: Omit<Transaction, 'id'> = {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        type: 'expense'
      };

      const created = await api.createTransaction(expense);
      setTransactions(prev => [created, ...prev]);
      setNewExpense({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to create expense:', err);
      setError('Failed to create expense');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setError('Failed to delete expense');
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (filter.category && transaction.category !== filter.category) return false;
    if (filter.startDate && transaction.date < filter.startDate) return false;
    if (filter.endDate && transaction.date > filter.endDate) return false;
    return true;
  });

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <MdTrendingDown className="mr-3" />
          {t('expenses.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('expenses.subtitle')}</p>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('common.expenseSummary')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.totalExpenses')}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.thisMonth')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {filteredTransactions.length} {t('common.transactions')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.averagePerTransaction')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {filteredTransactions.length > 0 ? formatCurrency(totalExpenses / filteredTransactions.length) : '$0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Add New Expense Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('common.addNewExpense')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.amount')}
              </label>
              <input
                type="number"
                step="0.01"
                id="amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.category')}
              </label>
              <select
                id="category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="input-field"
                required
              >
                <option value="">{t('common.selectCategory')}</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.description')}
              </label>
              <input
                type="text"
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="input-field"
                placeholder={t('common.whatDidYouBuy')}
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.date')}
              </label>
              <input
                type="date"
                id="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="input-field"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            <MdAdd className="mr-2" />
            {t('common.add')} Expense
          </button>
        </form>
      </div>

      {/* Filter Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('common.filterExpenses')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.category')}
            </label>
            <select
              id="filterCategory"
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value})}
              className="input-field"
            >
              <option value="">{t('common.allCategories')}</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.startDate')}
            </label>
            <input
              type="date"
              id="startDate"
              value={filter.startDate}
              onChange={(e) => setFilter({...filter, startDate: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.endDate')}
            </label>
            <input
              type="date"
              id="endDate"
              value={filter.endDate}
              onChange={(e) => setFilter({...filter, endDate: e.target.value})}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('common.recentExpenses')}</h2>
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('common.noExpensesFound')}</p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {EXPENSE_CATEGORIES.find(cat => cat.name === transaction.category)?.icon || '💰'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.category} • {transaction.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(transaction.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
