import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  children, 
  className = '', 
  disabled, 
  isLoading,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 active:scale-[0.98]';
  
  const variantClasses = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 shadow-sm hover:shadow-md hover:-translate-y-px',
    secondary: 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 hover:shadow-sm',
    ghost: 'hover:bg-gray-100 text-gray-600 px-4 py-2',
    danger: 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 focus:ring-red-500 hover:shadow-sm',
    icon: 'p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600'
  };

  const isDisabled = disabled || isLoading;
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
      {children}
    </button>
  );
}
