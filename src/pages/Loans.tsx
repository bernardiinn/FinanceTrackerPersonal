import React, { useState, useEffect } from 'react';
import { MdAccountBalance, MdAdd, MdPayment, MdTrendingDown, MdCreditCard } from 'react-icons/md';
import { api } from '../services/api';
import { useLocalization } from '../hooks/useLocalization';
import type { Loan } from '../types';

const Loans: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLocalization();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newLoan, setNewLoan] = useState({
    name: '',
    total_amount: '',
    remaining_amount: '',
    interest_rate: '',
    monthly_payment: '',
    payment_frequency: 'monthly' as Loan['payment_frequency'],
    next_payment_date: '',
    type: 'credit_card' as Loan['type']
  });

  const [payment, setPayment] = useState<{ [key: string]: string }>({});

  // Fetch loans from backend
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLoans();
      setLoans(data);
    } catch (err) {
      setError('Failed to load loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.name || !newLoan.total_amount || !newLoan.remaining_amount || !newLoan.monthly_payment) return;

    try {
      setError(null);
      const loanData = {
        name: newLoan.name,
        total_amount: parseFloat(newLoan.total_amount),
        remaining_amount: parseFloat(newLoan.remaining_amount),
        interest_rate: parseFloat(newLoan.interest_rate),
        monthly_payment: parseFloat(newLoan.monthly_payment),
        payment_frequency: newLoan.payment_frequency,
        next_payment_date: newLoan.next_payment_date,
        type: newLoan.type
      };

      const createdLoan = await api.createLoan(loanData);
      setLoans([...loans, createdLoan]);
      setNewLoan({
        name: '',
        total_amount: '',
        remaining_amount: '',
        interest_rate: '',
        monthly_payment: '',
        payment_frequency: 'monthly' as Loan['payment_frequency'],
        next_payment_date: '',
        type: 'credit_card' as Loan['type']
      });
    } catch (err) {
      setError('Failed to create loan');
      console.error('Error creating loan:', err);
    }
  };

  const handlePayment = async (loanId: string) => {
    const paymentAmount = parseFloat(payment[loanId] || '0');
    if (paymentAmount <= 0) return;

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      const updatedLoan = await api.updateLoan(loanId, {
        remaining_amount: Math.max(0, loan.remaining_amount - paymentAmount)
      });

      setLoans(loans.map(l => 
        l.id === loanId ? updatedLoan : l
      ));
      
      setPayment({ ...payment, [loanId]: '' });
    } catch (err) {
      setError('Failed to process payment');
      console.error('Error processing payment:', err);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    try {
      await api.deleteLoan(loanId);
      setLoans(loans.filter(l => l.id !== loanId));
    } catch (err) {
      setError('Failed to delete loan');
      console.error('Error deleting loan:', err);
    }
  };

  const calculateProgress = (loan: Loan) => {
    return ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;
  };

  const loanTypeIcons = {
    credit_card: { icon: MdCreditCard, color: 'text-red-600 dark:text-red-400' },
    personal: { icon: MdAccountBalance, color: 'text-blue-600 dark:text-blue-400' },
    mortgage: { icon: MdAccountBalance, color: 'text-green-600 dark:text-green-400' },
    auto: { icon: MdTrendingDown, color: 'text-purple-600 dark:text-purple-400' },
    student: { icon: MdAccountBalance, color: 'text-orange-600 dark:text-orange-400' }
  };

  if (loading) return (
    <div className="p-6">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('navigation.loans')}</h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add New Loan Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MdAdd className="text-blue-600" />
          {t('loans.addNew')}
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.name')}
            </label>
            <input
              type="text"
              value={newLoan.name}
              onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.type')}
            </label>
            <select
              value={newLoan.type}
              onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as Loan['type'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="credit_card">{t('loans.types.creditCard')}</option>
              <option value="personal">{t('loans.types.personal')}</option>
              <option value="mortgage">{t('loans.types.mortgage')}</option>
              <option value="auto">{t('loans.types.auto')}</option>
              <option value="student">{t('loans.types.student')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.totalAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={newLoan.total_amount}
              onChange={(e) => setNewLoan({ ...newLoan, total_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.remainingAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={newLoan.remaining_amount}
              onChange={(e) => setNewLoan({ ...newLoan, remaining_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.interestRate')}
            </label>
            <input
              type="number"
              step="0.01"
              value={newLoan.interest_rate}
              onChange={(e) => setNewLoan({ ...newLoan, interest_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.monthlyPayment')}
            </label>
            <input
              type="number"
              step="0.01"
              value={newLoan.monthly_payment}
              onChange={(e) => setNewLoan({ ...newLoan, monthly_payment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.paymentFrequency')}
            </label>
            <select
              value={newLoan.payment_frequency}
              onChange={(e) => setNewLoan({ ...newLoan, payment_frequency: e.target.value as Loan['payment_frequency'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="weekly">{t('paymentFrequencies.weekly')}</option>
              <option value="fortnightly">{t('paymentFrequencies.fortnightly')}</option>
              <option value="monthly">{t('paymentFrequencies.monthly')}</option>
              <option value="quarterly">{t('paymentFrequencies.quarterly')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loans.form.nextPaymentDate')}
            </label>
            <input
              type="date"
              value={newLoan.next_payment_date}
              onChange={(e) => setNewLoan({ ...newLoan, next_payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {t('loans.addLoan')}
            </button>
          </div>
        </form>
      </div>

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('loans.noLoans')}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {loans.map((loan) => {
            const IconComponent = loanTypeIcons[loan.type].icon;
            const iconColor = loanTypeIcons[loan.type].color;
            const progress = calculateProgress(loan);
            
            return (
              <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`text-2xl ${iconColor}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {loan.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t(`loans.types.${loan.type}`)} • {t(`paymentFrequencies.${loan.payment_frequency}`)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteLoan(loan.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded"
                  >
                    {t('common.delete')}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('loans.totalAmount')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(loan.total_amount)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('loans.remaining')}</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(loan.remaining_amount)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('loans.monthlyPayment')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(loan.monthly_payment)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('loans.nextPayment')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {loan.next_payment_date ? formatDate(loan.next_payment_date) : t('common.notSet')}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>{t('loans.progress')}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t('loans.paymentAmount')}
                      value={payment[loan.id] || ''}
                      onChange={(e) => setPayment({ ...payment, [loan.id]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => handlePayment(loan.id)}
                      disabled={!payment[loan.id] || parseFloat(payment[loan.id]) <= 0}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <MdPayment />
                      {t('loans.makePayment')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Loans;
