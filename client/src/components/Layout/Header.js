import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bars3Icon, BellIcon, PlusIcon } from '@heroicons/react/24/outline';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/tenders': 'Tenders',
  '/tenders/new': 'New Tender',
  '/guarantees/expiring': 'Expiring Guarantees',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.includes('/edit')) return 'Edit Tender';
    if (location.pathname.match(/\/tenders\/[^/]+$/)) return 'Tender Details';
    return pageTitles[location.pathname] || 'TenderPro';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/tenders/new"
          className="hidden sm:flex btn-primary"
        >
          <PlusIcon className="w-4 h-4" />
          New Tender
        </Link>
        <Link
          to="/guarantees/expiring"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Expiring Guarantees"
        >
          <BellIcon className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
