import React from 'react';
import { Link } from 'react-router-dom';
import { BellAlertIcon } from '../constants';
import { SystemNotification } from '../types';

interface HeaderProps {
  notifications: SystemNotification[];
}

const Header: React.FC<HeaderProps> = ({ notifications }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-gray-800 border-b border-gray-700 h-[73px] flex-shrink-0 flex items-center justify-between px-6 lg:px-8">
      <div>
        {/* Placeholder for breadcrumbs or page title if needed later */}
        <h1 className="text-lg font-semibold text-gray-200">FleetPro</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/monitoring/notifications" className="relative text-gray-400 hover:text-white transition-colors">
          <BellAlertIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>
        {/* Other header items like user profile can be added here */}
      </div>
    </header>
  );
};

export default Header;
