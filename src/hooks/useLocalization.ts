import { useTranslation } from 'react-i18next';

export const useLocalization = () => {
  const { i18n, t } = useTranslation();

  const formatCurrency = (amount: number) => {
    const currency = t('common.currency');
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const formatDateShort = (date: string | Date) => {
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const formatPercentage = (value: number) => {
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatNumber = (value: number) => {
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    
    return new Intl.NumberFormat(locale).format(value);
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
    ];
  };

  return {
    t,
    formatCurrency,
    formatDate,
    formatDateShort,
    formatPercentage,
    formatNumber,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
  };
};
