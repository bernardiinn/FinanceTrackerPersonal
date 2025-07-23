import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdAdd, MdAttachMoney, MdWork, MdAccountBalance } from 'react-icons/md';
import { api } from '../services/api';
import type { Transaction } from '../types';
import { INCOME_CATEGORIES } from '../types';
import { useLocalization } from '../hooks/useLocalization';

const Income: React.FC = () => {
  const { t, formatCurrency } = useLocalization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newIncome, setNewIncome] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch income transactions from backend
  useEffect(() => {
    fetchIncomeTransactions();
  }, []);

  const fetchIncomeTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTransactions('income');
      setTransactions(data);
    } catch (err) {
      setError('Failed to load income transactions');
      console.error('Error fetching income:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.amount || !newIncome.category || !newIncome.description) return;

    try {
      setError(null);
      const income: Omit<Transaction, 'id'> = {
        amount: parseFloat(newIncome.amount),
        category: newIncome.category,
        description: newIncome.description,
        date: newIncome.date,
        type: 'income'
      };

      const createdTransaction = await api.createTransaction(income);
      setTransactions([createdTransaction, ...transactions]);
      setNewIncome({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError('Failed to create income transaction');
      console.error('Error creating income:', err);
    }
  };

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MdTrendingUp className="text-2xl sm:text-3xl text-green-600 dark:text-green-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('income.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('income.subtitle')}</p>
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
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">{t('common.loadingIncomeData')}</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <MdAttachMoney className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalIncome')}</h2>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('common.thisPeriod')}</p>
              </div>
            </div>
          </div>

          {/* Add New Income Form */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <MdAdd className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('common.addNewIncome')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                    className="input-field"
                    placeholder="1500.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newIncome.category}
                    onChange={(e) => setNewIncome({...newIncome, category: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">{t('common.selectCategory')}</option>
                    {INCOME_CATEGORIES.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
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
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                    className="input-field"
                    placeholder={t('common.sourceOfIncome')}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  <MdAdd className="mr-2" />
                  Add Income
                </button>
              </div>
            </form>
          </div>

          {/* Income List */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <MdWork className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('common.incomeHistory')}</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <MdAccountBalance className="text-4xl sm:text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('common.noIncomeFound')}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {transactions.map((transaction) => {
                  const category = INCOME_CATEGORIES.find(cat => cat.name === transaction.category);
                  return (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start sm:items-center space-x-3 flex-1">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <span className="text-lg sm:text-xl text-green-600 dark:text-green-400">{category?.icon || '💰'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{transaction.description}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>{transaction.category}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
                        <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                          +{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Income;
