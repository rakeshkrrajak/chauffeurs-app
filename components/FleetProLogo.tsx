import React from 'react';

export const FleetProLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="160"
    height="36"
    viewBox="0 0 160 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="FleetPro Logo"
    {...props}
  >
    <rect width="160" height="36" fill="white" />
    {/* Icon Part */}
    <g transform="scale(1.1) translate(0, 1)">
      {/* Motion dashes */}
      <path d="M2,14 H4" stroke="#00529B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="7" cy="14" r="1.25" fill="#00529B" />
      <path d="M0,18 H8" stroke="#00529B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="11" cy="18" r="1.25" fill="#00529B" />
      <path d="M3,22 H14" stroke="#00529B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="17" cy="22" r="1.25" fill="#00529B" />
      
      {/* Main Shape */}
      {/* Blue part */}
      <path d="M13.5 26L24.5 6H21.5L10.5 26H13.5Z" fill="#00529B" />
      <path d="M24.5 6L31 21L28 26H13.5L24.5 6Z" fill="#00529B" />
      {/* Green part */}
      <path d="M19 26L30 6H37L26 26H19Z" fill="#65B32E" />
      <path d="M24.5 6L21.5 6L31 21L34 15.5L24.5 6Z" fill="#65B32E" />
    </g>

    {/* Text Part "FleetPro" */}
    <text
      x="48" 
      y="27" 
      fontFamily="sans-serif"
      fontSize="24"
      fontWeight="bold"
    >
      <tspan fill="#00529B">Fleet</tspan>
      <tspan fill="#65B32E">Pro</tspan>
    </text>
  </svg>
);

export default FleetProLogo;