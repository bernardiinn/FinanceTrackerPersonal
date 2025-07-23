import React, { useState, useEffect } from 'react';
import { MdRepeat, MdPause, MdPlayArrow, MdDelete, MdAdd, MdTrendingUp, MdTrendingDown, MdSchedule } from 'react-icons/md';
import { api } from '../services/api';
import type { RecurringTransaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { useLocalization } from '../hooks/useLocalization';

const Recurring: React.FC = () => {
  const { t, formatCurrency } = useLocalization();
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    next_date: '',
    type: 'expense' as RecurringTransaction['type']
  });

  // Fetch recurring transactions from backend
  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  const fetchRecurringTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecurringTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to load recurring transactions');
      console.error('Error fetching recurring transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.description || !newTransaction.next_date) return;

    try {
      setError(null);
      const transactionData = {
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description,
        frequency: newTransaction.frequency,
        next_date: newTransaction.next_date,
        type: newTransaction.type,
        is_active: true
      };

      const createdTransaction = await api.createRecurringTransaction(transactionData);
      setTransactions([...transactions, createdTransaction]);
      setNewTransaction({
        amount: '',
        category: '',
        description: '',
        frequency: 'monthly',
        next_date: '',
        type: 'expense'
      });
    } catch (err) {
      setError('Failed to create recurring transaction');
      console.error('Error creating recurring transaction:', err);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;

      const updatedTransaction = await api.updateRecurringTransaction(id, {
        is_active: !transaction.is_active
      });

      setTransactions(transactions.map(t => 
        t.id === id ? updatedTransaction : t
      ));
    } catch (err) {
      setError('Failed to update recurring transaction');
      console.error('Error updating recurring transaction:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.deleteRecurringTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete recurring transaction');
      console.error('Error deleting recurring transaction:', err);
    }
  };

  const getNextOccurrence = (next_date: string, _frequency: RecurringTransaction['frequency']) => {
    const date = new Date(next_date);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const availableCategories = newTransaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const activeTransactions = transactions.filter(t => t.is_active);
  const inactiveTransactions = transactions.filter(t => !t.is_active);

  const totalMonthlyIncome = activeTransactions
    .filter(t => t.type === 'income' && t.frequency === 'monthly')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlyExpenses = activeTransactions
    .filter(t => t.type === 'expense' && t.frequency === 'monthly')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MdRepeat className="text-2xl sm:text-3xl text-primary-600 dark:text-primary-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('common.recurringTransactions')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('recurring.subtitle')}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">{t('recurring.loadingTransactions')}</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="card p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <MdTrendingUp className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('recurring.monthlyIncome')}</h3>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalMonthlyIncome)}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <MdTrendingDown className="text-xl sm:text-2xl text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('recurring.monthlyExpenses')}</h3>
                  <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalMonthlyExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3">
                <MdSchedule className="text-xl sm:text-2xl text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('recurring.netMonthly')}</h3>
                  <p className={`text-lg sm:text-2xl font-bold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add New Recurring Transaction Form */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <MdAdd className="text-xl sm:text-2xl text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('recurring.addTransaction')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    id="type"
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as RecurringTransaction['type'], category: ''})}
                    className="input-field"
                    required
                  >
                    <option value="expense">{t('recurring.expenseOption')}</option>
                    <option value="income">{t('recurring.incomeOption')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="input-field"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    value={newTransaction.frequency}
                    onChange={(e) => setNewTransaction({...newTransaction, frequency: e.target.value as RecurringTransaction['frequency']})}
                    className="input-field"
                    required
                  >
                    <option value="weekly">{t('recurring.weekly')}</option>
                    <option value="monthly">{t('recurring.monthly')}</option>
                    <option value="yearly">{t('recurring.yearly')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">{t('common.selectCategory')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Netflix Subscription"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="next_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Next Date
                  </label>
                  <input
                    type="date"
                    id="next_date"
                    value={newTransaction.next_date}
                    onChange={(e) => setNewTransaction({...newTransaction, next_date: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  <MdAdd className="mr-2" />
                  Add Recurring Transaction
                </button>
              </div>
            </form>
          </div>

          {/* Active Transactions */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <MdPlayArrow className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('recurring.activeTransactions')}</h2>
            </div>
            {activeTransactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <MdRepeat className="text-4xl sm:text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('recurring.noActiveTransactions')}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activeTransactions.map((transaction) => {
                  const category = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(cat => cat.name === transaction.category);
                  return (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl sm:text-2xl">{category?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{transaction.description}</p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {transaction.category} • {transaction.frequency} • {getNextOccurrence(transaction.next_date, transaction.frequency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <span className={`font-semibold text-sm sm:text-base ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleActive(transaction.id)}
                            className="flex items-center btn-secondary text-xs sm:text-sm py-1 px-2 sm:py-1 sm:px-3"
                          >
                            <MdPause className="mr-1" />
                            <span className="hidden sm:inline">{t('recurring.pause')}</span>
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm p-1"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inactive Transactions */}
          {inactiveTransactions.length > 0 && (
            <div className="card p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <MdPause className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('recurring.pausedTransactions')}</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {inactiveTransactions.map((transaction) => {
                  const category = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(cat => cat.name === transaction.category);
                  return (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 opacity-60 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl sm:text-2xl">{category?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{transaction.description}</p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {transaction.category} • {transaction.frequency} • Paused
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <span className={`font-semibold text-sm sm:text-base ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleActive(transaction.id)}
                            className="flex items-center btn-primary text-xs sm:text-sm py-1 px-2 sm:py-1 sm:px-3"
                          >
                            <MdPlayArrow className="mr-1" />
                            <span className="hidden sm:inline">{t('recurring.resume')}</span>
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm p-1"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recurring;
