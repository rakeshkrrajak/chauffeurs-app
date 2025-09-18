import React from 'react';

export const FleetProLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    height="40"
    viewBox="0 0 280 40"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="FleetPro Logo"
    {...props}
  >
    <defs>
      {/* Brighter, higher-contrast gradients for the emblem */}
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      
      {/* Gradients for the star's faces with more contrast for a 3D effect */}
      <linearGradient id="starFace1" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="starFace2" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      
      {/* Subtle drop shadow filter for depth */}
      <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.5"/>
      </filter>
    </defs>

    {/* Emblem Group */}
    <g transform="translate(20, 20)" filter="url(#logoShadow)">
      {/* Outer Ring */}
      <circle cx="0" cy="0" r="18" fill="none" stroke="url(#ringGrad)" strokeWidth="3" />
      
      {/* Star - constructed from 6 polygons for a 3D beveled effect */}
      <g>
        {/* Top point */}
        <polygon points="0,-17 0,-3 5,-1.5" fill="url(#starFace1)" />
        <polygon points="0,-17 0,-3 -5,-1.5" fill="url(#starFace2)" />
        
        {/* Bottom-right point */}
        <g transform="rotate(120 0 0)">
          <polygon points="0,-17 0,-3 5,-1.5" fill="url(#starFace1)" />
          <polygon points="0,-17 0,-3 -5,-1.5" fill="url(#starFace2)" />
        </g>
        
        {/* Bottom-left point */}
        <g transform="rotate(240 0 0)">
          <polygon points="0,-17 0,-3 5,-1.5" fill="url(#starFace1)" />
          <polygon points="0,-17 0,-3 -5,-1.5" fill="url(#starFace2)" />
        </g>
      </g>
    </g>

    {/* Text */}
    <text
      x="52"
      y="29"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      fontSize="26"
      fontWeight="600"
      letterSpacing="1"
    >
      <tspan fill="#38bdf8">Fleet</tspan>
      <tspan fill="#f1f5f9" fontWeight="700">Pro</tspan>
    </text>
  </svg>
);

export default FleetProLogo;