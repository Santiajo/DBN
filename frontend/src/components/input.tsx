// src/components/Input.tsx
import React from 'react';

type InputProps = {
  state?: 'normal' | 'error' | 'success';
  message?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  state = 'normal',
  message,
  ...props
}: InputProps) {
  const baseClasses = "px-4 py-2 w-full rounded-lg border bg-white text-madera-oscura focus:outline-none focus:ring-2 disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed";

  const stateClasses = {
    normal: 'border-stone-400 focus:ring-bosque',
    error: 'border-carmesi focus:ring-carmesi',
    success: 'border-green-600 focus:ring-green-600',
  };
  
  const messageClasses = {
    error: 'text-sm text-carmesi mt-1',
    success: 'text-sm text-green-700 mt-1',
    normal: ''
  }

  return (
    <div>
      <input
        className={`${baseClasses} ${stateClasses[state]}`}
        {...props}
      />
      {message && (state === 'error' || state === 'success') && (
        <p className={messageClasses[state]}>{message}</p>
      )}
    </div>
  );
}