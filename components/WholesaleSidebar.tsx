import React from 'react';
import WholesaleFinanceLogo from './WholesaleFinanceLogo';

interface WholesaleSidebarProps {
  currentApp: 'fleet' | 'wholesale';
  setCurrentApp: (app: 'fleet' | 'wholesale') => void;
}

const WholesaleSidebar: React.FC<WholesaleSidebarProps> = () => {
  return (
    <div className="w-72 h-screen bg-gray-800 text-gray-100 flex flex-col fixed top-0 left-0 shadow-2xl">
      <div className="p-5 flex items-center justify-start border-b border-gray-700 h-[73px]">
        <WholesaleFinanceLogo />
      </div>
      <div className="p-5">
        <p className="text-sm text-center text-gray-500">
          Wholesale Finance functionality is not available in this version.
        </p>
      </div>
    </div>
  );
};

export default WholesaleSidebar;
