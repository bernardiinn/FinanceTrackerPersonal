import React, { useState, useEffect } from 'react';
import { MdTrackChanges, MdAdd, MdFlag, MdTrendingUp } from 'react-icons/md';
import { api } from '../services/api';
import type { Goal } from '../types';
import { useLocalization } from '../hooks/useLocalization';

const Goals: React.FC = () => {
  const { t, formatCurrency } = useLocalization();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    category: 'other' as Goal['category']
  });

  const [addAmount, setAddAmount] = useState<{ [key: string]: string }>({});

  // Fetch goals from backend
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals');
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount) return;

    try {
      setError(null);
      const goalData = {
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount),
        deadline: newGoal.deadline || undefined,
        category: newGoal.category
      };

      const createdGoal = await api.createGoal(goalData);
      setGoals([...goals, createdGoal]);
      setNewGoal({
        name: '',
        target_amount: '',
        current_amount: '0',
        deadline: '',
        category: 'other'
      });
    } catch (err) {
      setError('Failed to create goal');
      console.error('Error creating goal:', err);
    }
  };

  const handleAddToGoal = async (goalId: string) => {
    const amount = parseFloat(addAmount[goalId] || '0');
    if (amount <= 0) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedGoal = await api.updateGoal(goalId, {
        current_amount: goal.current_amount + amount
      });

      setGoals(goals.map(g => 
        g.id === goalId ? updatedGoal : g
      ));
      setAddAmount({ ...addAmount, [goalId]: '' });
    } catch (err) {
      setError('Failed to update goal');
      console.error('Error updating goal:', err);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getCategoryIcon = (category: Goal['category']) => {
    const iconMap = {
      emergency: { icon: MdFlag, color: 'text-red-600 dark:text-red-400' },
      vacation: { icon: MdTrendingUp, color: 'text-blue-600 dark:text-blue-400' },
      home: { icon: MdTrackChanges, color: 'text-green-600 dark:text-green-400' },
      car: { icon: MdTrendingUp, color: 'text-purple-600 dark:text-purple-400' },
      other: { icon: MdTrackChanges, color: 'text-gray-600 dark:text-gray-400' }
    };
    return iconMap[category] || iconMap.other;
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MdTrackChanges className="text-2xl sm:text-3xl text-primary-600 dark:text-primary-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('goals.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('goals.subtitle')}</p>
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
          <p className="text-gray-600 dark:text-gray-400 mt-4">{t('common.loadingGoals')}</p>
        </div>
      ) : (
        <>
          {/* Add New Goal Form */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <MdAdd className="text-xl sm:text-2xl text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{t('common.addNewGoal')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="target_amount"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                    className="input-field"
                    placeholder="10000.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="current_amount"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal({...newGoal, current_amount: e.target.value})}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value as Goal['category']})}
                    className="input-field"
                  >
                    <option value="emergency">{t('common.emergencyFund')}</option>
                    <option value="vacation">{t('common.vacation')}</option>
                    <option value="home">{t('common.home')}</option>
                    <option value="car">{t('common.car')}</option>
                    <option value="other">{t('common.other')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={newGoal.deadline || ''}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  <MdAdd className="mr-2" />
                  Create Goal
                </button>
              </div>
            </form>
          </div>

          {/* Goals List */}
          <div className="space-y-4 sm:space-y-6">
            {goals.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <MdTrackChanges className="text-4xl sm:text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('common.noGoalsCreated')}</p>
              </div>
            ) : (
              goals.map((goal) => {
                const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
                const daysUntilDeadline = getDaysUntilDeadline(goal.deadline);
                const categoryData = getCategoryIcon(goal.category);
                const IconComponent = categoryData.icon;

                return (
                  <div key={goal.id} className="card p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      {/* Goal Info */}
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 sm:p-3 rounded-lg ${categoryData.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-').replace('-600', '-100').replace('-400', '-800')}`}>
                          <IconComponent className={`text-lg sm:text-xl ${categoryData.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{goal.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{goal.category}</p>
                          {goal.deadline && (
                            <p className={`text-xs sm:text-sm font-medium mt-1 ${
                              daysUntilDeadline !== null && daysUntilDeadline < 30 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {daysUntilDeadline !== null && daysUntilDeadline >= 0
                                ? `${daysUntilDeadline} days remaining`
                                : daysUntilDeadline !== null && daysUntilDeadline < 0
                                ? `${Math.abs(daysUntilDeadline)} days overdue`
                                : 'No deadline'
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress and Actions */}
                      <div className="w-full sm:w-auto sm:ml-6">
                        <div className="flex flex-col sm:items-end space-y-3">
                          {/* Progress */}
                          <div className="w-full sm:w-64">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                              </span>
                              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                              <div 
                                className="bg-primary-600 dark:bg-primary-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Add Money Section */}
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                            <input
                              type="number"
                              step="0.01"
                              value={addAmount[goal.id] || ''}
                              onChange={(e) => setAddAmount({ ...addAmount, [goal.id]: e.target.value })}
                              className="input-field text-sm py-1 px-2 sm:w-24"
                              placeholder={t('common.amount')}
                            />
                            <button
                              onClick={() => handleAddToGoal(goal.id)}
                              className="btn-primary text-sm py-1 px-3 sm:px-4 w-full sm:w-auto"
                              disabled={!addAmount[goal.id] || parseFloat(addAmount[goal.id]) <= 0}
                            >
                              <MdAdd className="mr-1" />
                              <span className="hidden sm:inline">{t('common.add')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievement Badge */}
                    {progress >= 100 && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <MdFlag className="text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            🎉 Goal achieved! Congratulations!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Goals;
