import React from 'react';
import { NavLink } from 'react-router-dom';
import { WHOLESALE_NAVIGATION_ITEMS } from '../constants';
import { NavigationItem } from '../types';
import WholesaleFinanceLogo from './WholesaleFinanceLogo';
import AppSwitcher from './AppSwitcher';

interface WholesaleSidebarProps {
  currentApp: 'fleet' | 'wholesale';
  setCurrentApp: (app: 'fleet' | 'wholesale') => void;
}

const WholesaleSidebarNavLink: React.FC<{ item: NavigationItem }> = ({ item }) => {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/wholesale/dashboard"} 
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out group text-base ${
          isActive ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-gray-700 hover:text-gray-100 text-gray-300'
        }`
      }
    >
      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-primary-400" />
      <span className="font-medium">{item.name}</span>
    </NavLink>
  );
};

const WholesaleSidebar: React.FC<WholesaleSidebarProps> = ({ currentApp, setCurrentApp }) => {
  return (
    <div className="w-72 h-screen bg-gray-800 text-gray-100 flex flex-col fixed top-0 left-0 shadow-2xl">
      <div className="p-5 flex items-center justify-start border-b border-gray-700 h-[73px]">
        <WholesaleFinanceLogo />
      </div>

      <AppSwitcher currentApp={currentApp} setCurrentApp={setCurrentApp} />

      <nav className="flex-grow p-5 space-y-2 overflow-y-auto border-t border-gray-700">
        {WHOLESALE_NAVIGATION_ITEMS.map((item: NavigationItem) => (
          <WholesaleSidebarNavLink key={item.name} item={item} />
        ))}
      </nav>
      <div className="p-5 border-t border-gray-700 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Wholesale Finance System.
      </div>
    </div>
  );
};

export default WholesaleSidebar;
