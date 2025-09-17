import React from 'react';

export const WholesaleFinanceLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="180"
    height="36"
    viewBox="0 0 180 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Wholesale Finance Logo"
    {...props}
  >
    {/* Stylized Icon Part */}
    <rect x="2" y="8" width="20" height="20" rx="4" className="fill-primary-600" />
    <path
      d="M8 14 L12 18 L18 12"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="stroke-gray-100"
    />
     <path
      d="M12 22 L16 18"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="stroke-gray-100"
    />
    
    {/* Text Part "Wholesale Finance" */}
    <text
      x="32" 
      y="27" 
      fontFamily="sans-serif"
      fontSize="20"
      fontWeight="bold"
      className="fill-primary-400"
    >
      Wholesale
      <tspan
        className="fill-gray-100" 
        dx="5"
      >
        Finance
      </tspan>
    </text>
  </svg>
);

export default WholesaleFinanceLogo;
