import React from 'react';
import { Link } from 'react-router-dom';
import { BellAlertIcon } from '../constants';
import { SystemNotification } from '../types';

interface HeaderProps {
  notifications: SystemNotification[];
}

const Header: React.FC<HeaderProps> = ({ notifications }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Style for the subtle dot pattern background, inspired by Mercedes-Benz grille patterns
  const headerStyle = {
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
    backgroundSize: '1rem 1rem'
  };

  return (
    <header
      className="bg-gray-850 border-b border-gray-700 h-[73px] flex-shrink-0 flex items-center justify-end px-6 lg:px-8"
      style={headerStyle}
    >
      <div className="flex items-center space-x-5">
        <Link to="/monitoring/notifications" className="relative text-gray-400 hover:text-white transition-colors">
          <BellAlertIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse ring-2 ring-gray-850">
              {unreadCount}
            </span>
          )}
        </Link>
        {/* User profile avatar */}
        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold text-sm ring-2 ring-gray-600 cursor-pointer" title="User Profile">
          FP
        </div>
      </div>
    </header>
  );
};

export default Header;