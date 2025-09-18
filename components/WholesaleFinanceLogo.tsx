import React from 'react';

export const WholesaleFinanceLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="200"
    height="36"
    viewBox="0 0 200 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Wholesale Finance Logo"
    {...props}
  >
    {/* Icon Part */}
    <g transform="translate(0, 4) scale(0.9)">
      <rect x="2" y="2" width="28" height="28" rx="4" className="fill-gray-700" />
      <g transform="translate(6, 6) scale(0.6)">
        <path d="M25 5 C 20 15, 20 25, 32 30" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M15 5 C 20 15, 20 25, 8 30" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(120 18 18)" />
        <path d="M15 25 C 20 15, 20 5, 32 10" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(-120 18 18)" />
      </g>
    </g>
    
    {/* Text Part "Wholesale Finance" */}
    <text
      x="38"
      y="26"
      fontFamily="'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif"
      fontSize="20"
      fontWeight="600"
      letterSpacing="0.5"
    >
      <tspan fill="#d1d5db">Wholesale</tspan>
      <tspan fill="#9ca3af" fontWeight="400" dx="5">Finance</tspan>
    </text>
  </svg>
);

export default WholesaleFinanceLogo;