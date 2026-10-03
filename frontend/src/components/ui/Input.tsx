'use client';
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1 mb-4">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">{icon}</div>}
        <input
          className={`w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};
