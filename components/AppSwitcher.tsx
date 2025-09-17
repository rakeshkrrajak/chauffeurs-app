import React from 'react';

interface AppSwitcherProps {
  currentApp: 'fleet' | 'wholesale';
  setCurrentApp: (app: 'fleet' | 'wholesale') => void;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ currentApp, setCurrentApp }) => {
  const baseStyle = "w-1/2 py-2 px-3 text-xs font-bold transition-colors duration-200 text-center";
  const activeStyle = "bg-primary-600 text-white shadow-inner";
  const inactiveStyle = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  return (
    <div className="p-3">
      <div className="flex w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
        <button
          onClick={() => setCurrentApp('fleet')}
          className={`${baseStyle} rounded-l-md ${currentApp === 'fleet' ? activeStyle : inactiveStyle}`}
          aria-pressed={currentApp === 'fleet'}
        >
          Fleet Manager
        </button>
        <button
          onClick={() => setCurrentApp('wholesale')}
          className={`${baseStyle} rounded-r-md ${currentApp === 'wholesale' ? activeStyle : inactiveStyle}`}
          aria-pressed={currentApp === 'wholesale'}
        >
          Wholesale Finance
        </button>
      </div>
    </div>
  );
};

export default AppSwitcher;
