import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdAttachMoney, 
  MdTrendingUp, 
  MdGpsFixed, 
  MdAccountBalance, 
  MdRefresh, 
  MdPerson,
  MdLightMode,
  MdDarkMode,
  MdLogout,
  MdCreditCard,
  MdMenu,
  MdClose,
  MdSecurity,
  MdMoreHoriz
} from 'react-icons/md';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../hooks/useLocalization';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const { t } = useLocalization();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the user menu and mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowMobileMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowMoreMenu(false);
  }, [location.pathname]);

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: <MdDashboard /> },
    { name: t('navigation.expenses'), href: '/expenses', icon: <MdTrendingUp /> },
    { name: t('navigation.income'), href: '/income', icon: <MdAttachMoney /> },
    { name: t('navigation.goals'), href: '/goals', icon: <MdGpsFixed /> },
    { name: t('navigation.loans'), href: '/loans', icon: <MdAccountBalance /> },
    { name: t('navigation.recurring'), href: '/recurring', icon: <MdRefresh /> },
    { name: t('navigation.security'), href: '/security', icon: <MdSecurity /> },
  ];

  // Split navigation for responsive design
  const primaryNavigation = navigation.slice(0, 4); // Dashboard, Expenses, Income, Goals
  const secondaryNavigation = navigation.slice(4); // Loans, Recurring, Security

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.email || 'User';
  };

  return (
    <>
      {/* Fixed navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center">
                  <MdCreditCard className="mr-2" />
                  <span className="hidden sm:block">{t('common.appName')}</span>
                  <span className="sm:hidden">FT</span>
                </h1>
              </div>
              {/* Desktop Navigation - Responsive design */}
              <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4 lg:space-x-6">
                {/* Primary navigation items - always visible on md+ */}
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors lg:px-2`}
                  >
                    <span className="mr-1 lg:mr-2">{item.icon}</span>
                    <span className="hidden lg:block">{item.name}</span>
                  </Link>
                ))}
                
                {/* Secondary navigation - "More" dropdown on tablet, full items on desktop */}
                <div className="lg:hidden relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    aria-haspopup="menu"
                    aria-expanded={showMoreMenu}
                    aria-label="More navigation"
                    className={`${
                      secondaryNavigation.some(item => location.pathname === item.href)
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    <MdMoreHoriz className="mr-1" />
                  </button>
                  
                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50" role="menu" aria-label="More navigation menu">
                      <div className="py-1" role="none">
                        {secondaryNavigation.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setShowMoreMenu(false)}
                            className={`${
                              location.pathname === item.href
                                ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            } flex items-center px-4 py-2 text-sm transition-colors`}
                            role="menuitem"
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Full secondary navigation for desktop */}
                <div className="hidden lg:flex lg:space-x-6">
                  {secondaryNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
              >
                {isDarkMode ? <MdLightMode className="text-sm sm:text-base" /> : <MdDarkMode className="text-sm sm:text-base" />}
              </button>

              {/* Desktop User menu */}
              <div className="hidden sm:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-label="User menu"
                  className="flex items-center text-sm rounded-full bg-gray-100 dark:bg-gray-700 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <MdPerson className="mr-2" />
                  <span className="hidden lg:block text-gray-700 dark:text-gray-300">
                    {getUserDisplayName()}
                  </span>
                  <span className="ml-1">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50" role="menu" aria-label="User menu">
                    <div className="py-1" role="none">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-medium">{getUserDisplayName()}</p>
                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        role="menuitem"
                      >
                        <MdLogout className="mr-2" />
                        {t('navigation.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showMobileMenu ? <MdClose /> : <MdMenu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowMobileMenu(false)} />
        </div>
      )}

      {/* Mobile Slide-out Menu */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-sm bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile menu header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('navigation.menu')}</h2>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MdClose />
            </button>
          </div>

          {/* User info section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                <MdPerson className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <div className="flex-1 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-4 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  } flex items-center px-4 py-3 text-base font-medium transition-colors`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Language switcher for mobile */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.language')}</span>
              <LanguageSwitcher />
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <MdLogout className="mr-3" />
              {t('navigation.signOut')}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;
