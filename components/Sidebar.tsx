import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../constants';
import { NavigationItem } from '../types';
import FleetProLogo from './FleetProLogo';

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    const activeParent = NAVIGATION_ITEMS.find(item => 
        item.children?.some(child => location.pathname.startsWith(child.path))
    );
    return activeParent ? activeParent.name : null;
  });

  const toggleMenu = (name: string) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  return (
    <div className="w-72 h-screen bg-gray-800 text-gray-100 flex flex-col fixed top-0 left-0 shadow-2xl border-r border-gray-700">
      <div className="p-5 flex items-center justify-start border-b border-gray-700 h-[73px]">
        <FleetProLogo />
      </div>
      
      <nav className="flex-grow p-5 space-y-2 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item: NavigationItem) => {
          const isParentActive = item.children?.some(child => location.pathname.startsWith(child.path));

          if (item.children) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center justify-between w-full space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out group text-base ${
                    isParentActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 hover:text-gray-100 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-300 ${openMenu === item.name ? 'rotate-180' : ''}`}
                  />
                </button>
                {openMenu === item.name && (
                  <div className="pl-6 pt-2 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                            isActive ? 'bg-gray-700 text-white font-semibold' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          }`
                        }
                      >
                        <span className="w-5 h-5 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                        </span>
                        <span>{child.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out group text-base ${
                  isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 hover:text-gray-100 text-gray-300'
                }`
              }
            >
              <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;