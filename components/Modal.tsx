
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  theme?: 'dark' | 'light';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', theme = 'dark' }) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const themeClasses = {
    bg: isLight ? 'bg-white' : 'bg-gray-800',
    border: isLight ? 'border-gray-200' : 'border-gray-700',
    titleText: isLight ? 'text-gray-900' : 'text-gray-100',
    closeButton: isLight 
      ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' 
      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out" aria-modal="true" role="dialog">
      <div 
        className={`${themeClasses.bg} rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
        style={{ animationFillMode: 'forwards' }} // Keep final state of animation
      >
        <div className={`flex justify-between items-center p-6 border-b ${themeClasses.border}`}>
          <h3 className={`text-xl font-semibold ${themeClasses.titleText}`}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1 rounded-full transition-colors ${themeClasses.closeButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`p-6 overflow-y-auto ${isLight ? 'text-gray-900' : ''}`}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation-name: modalShow;
          animation-duration: 0.3s; /* Adjust duration as needed */
          animation-timing-function: ease-out;
        }
      `}</style>
    </div>
  );
};

export default Modal;
