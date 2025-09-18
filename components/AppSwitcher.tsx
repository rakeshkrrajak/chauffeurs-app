import React from 'react';

interface AppSwitcherProps {
  currentApp: 'fleet' | 'wholesale';
  setCurrentApp: (app: 'fleet' | 'wholesale') => void;
}

const AppSwitcher: React.FC<AppSwitcherProps> = () => {
  return (
    <div className="p-3">
      <div className="flex w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
        <div
          className="w-full py-2 px-3 text-xs font-bold text-center bg-primary-600 text-white shadow-inner"
        >
          Fleet Manager
        </div>
      </div>
    </div>
  );
};

export default AppSwitcher;
