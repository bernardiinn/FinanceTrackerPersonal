import React, { useState, useEffect } from 'react';
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdAccountBalance, 
  MdGpsFixed,
  MdCreditCard,
  MdAttachMoney 
} from 'react-icons/md';
import type { DashboardStats } from '../types';
import { api } from '../services/api';
import { useLocalization } from '../hooks/useLocalization';

const Dashboard: React.FC = () => {
  const { t, formatCurrency } = useLocalization();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const dashboardStats = await api.getDashboardStats();
        setStats(dashboardStats);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode;
    change?: string; 
    color?: string;
  }> = ({
    title,
    value,
    icon,
    change,
    color = 'text-gray-900 dark:text-gray-100',
  }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {change && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{change}</p>
          )}
        </div>
        <div className="text-2xl text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center">
        <p className="text-red-600 dark:text-red-400">{t('common.error')}: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary mt-4"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center">
        <p className="text-gray-600 dark:text-gray-400">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={t('dashboard.totalIncome')}
          value={formatCurrency(stats.totalIncome)}
          icon={<MdAttachMoney />}
          change="+12% from last month"
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title={t('dashboard.totalExpenses')}
          value={formatCurrency(stats.totalExpenses)}
          icon={<MdTrendingDown />}
          change="+5% from last month"
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          title={t('dashboard.netIncome')}
          value={formatCurrency(stats.netIncome)}
          icon={<MdTrendingUp />}
          change={stats.netIncome > 0 ? t('common.positiveCashFlow') : t('common.negativeCashFlow')}
          color={stats.netIncome > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard
          title={t('dashboard.accountsTotal')}
          value={formatCurrency(stats.accountsTotal)}
          icon={<MdAccountBalance />}
          change="Across all accounts"
        />
        <StatCard
          title={t('dashboard.goalsProgress')}
          value={`${stats.goalsProgress.toFixed(1)}%`}
          icon={<MdGpsFixed />}
          change="On track to meet targets"
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title={t('dashboard.debtTotal')}
          value={formatCurrency(stats.debtTotal)}
          icon={<MdCreditCard />}
          change="Active loans"
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart Placeholder */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Income vs Expenses
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">{t('common.chartWillBeImplemented')}</p>
          </div>
        </div>

        {/* Expense Categories Chart Placeholder */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Expense Categories
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">{t('common.pieChartWillBeImplemented')}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {[
            { description: 'Salary Payment', amount: 5000, category: 'Income', date: '2025-07-20' },
            { description: 'Grocery Shopping', amount: -120, category: 'Food & Dining', date: '2025-07-19' },
            { description: 'Gas Station', amount: -45, category: 'Transportation', date: '2025-07-18' },
            { description: 'Netflix Subscription', amount: -15, category: 'Entertainment', date: '2025-07-17' },
          ].map((transaction, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category} • {transaction.date}</p>
              </div>
              <span className={`font-semibold ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
