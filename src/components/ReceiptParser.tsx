import React, { useState, useEffect } from 'react';
import { MdEdit, MdCheck, MdClose, MdInfo } from 'react-icons/md';
import type { Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { useLocalization } from '../hooks/useLocalization';

interface ParsedData {
  merchant: string | null;
  total: number | null;
  date: string | null;
  raw_text: string;
  suggestions: {
    all_amounts: number[];
  };
  warnings?: string[];
  vendor_raw?: string | null;
}

interface ReceiptParserProps {
  parsedData: ParsedData;
  onConfirm: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  isCreating: boolean;
}

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
}

const ReceiptParser: React.FC<ReceiptParserProps> = ({
  parsedData,
  onConfirm,
  onCancel,
  isCreating
}) => {
  const { t, formatCurrency } = useLocalization();
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    category: '',
    description: '',
    date: ''
  });
  const [showRawText, setShowRawText] = useState(false);

  // Initialize form data with parsed values
  useEffect(() => {
    setFormData({
      amount: parsedData.total?.toString() || '',
      category: '', // User needs to select category
      description: parsedData.merchant || '',
      date: parsedData.date || new Date().toISOString().split('T')[0]
    });
  }, [parsedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const transaction: Omit<Transaction, 'id'> = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      type: 'expense'
    };

    onConfirm(transaction);
  };

  const isFormValid = formData.amount && formData.category && formData.description && formData.date;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('receipts.parsedData')}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          disabled={isCreating}
        >
          <MdClose size={24} />
        </button>
      </div>

      {/* Parsed Data Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <MdInfo className="mr-2" />
          {t('receipts.extractedInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('common.merchant')}:</span>
            <p className="font-medium">{parsedData.merchant || t('receipts.notDetected')}</p>
            {parsedData.vendor_raw && parsedData.vendor_raw !== parsedData.merchant && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Raw: {parsedData.vendor_raw}</p>
            )}
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('common.amount')}:</span>
            <p className="font-medium">
              {parsedData.total ? formatCurrency(parsedData.total) : t('receipts.notDetected')}
            </p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('common.date')}:</span>
            <p className="font-medium">{parsedData.date || t('receipts.notDetected')}</p>
          </div>
        </div>

        {parsedData.warnings && parsedData.warnings.length > 0 && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded p-3">
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">{t('receipts.warnings')}:</p>
            <ul className="list-disc ml-4 space-y-0.5 text-xs text-yellow-800 dark:text-yellow-200">
              {parsedData.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Alternative amounts if available */}
        {parsedData.suggestions.all_amounts.length > 1 && (
          <div className="mt-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('receipts.otherAmounts')}:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {parsedData.suggestions.all_amounts
                .filter(amount => amount !== parsedData.total)
                .slice(0, 5)
                .map((amount, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Raw text toggle */}
        <button
          type="button"
          onClick={() => setShowRawText(!showRawText)}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          {showRawText ? t('receipts.hideRawText') : t('receipts.showRawText')}
        </button>
        {showRawText && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-900 border rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
            {parsedData.raw_text}
          </div>
        )}
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center mb-4">
          <MdEdit className="mr-2 text-blue-600 dark:text-blue-400" />
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
            {t('receipts.reviewAndEdit')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.amount')} *
            </label>
            <input
              type="number"
              step="0.01"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.category')} *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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
              {t('common.description')} *
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field"
              placeholder={t('receipts.merchantOrDescription')}
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.date')} *
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isCreating}
            className="btn-primary flex-1"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.creating')}
              </>
            ) : (
              <>
                <MdCheck className="mr-2" />
                {t('receipts.createExpense')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptParser;
