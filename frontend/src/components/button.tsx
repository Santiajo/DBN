import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dangerous';
  isLoading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className, 
  ...props
}: ButtonProps) {
  
  const baseClasses = "px-6 py-3 rounded-xl font-body font-bold transition cursor-pointer disabled:bg-stone-300 disabled:shadow-none disabled:text-stone-500 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: 'bg-cuero text-white hover:bg-madera-oscura shadow-md',
    secondary: 'bg-pergamino text-madera-oscura border border-madera-oscura hover:opacity-80',
    dangerous: 'bg-carmesi text-white hover:bg-red-800 shadow-md',
  };

  const finalClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    (isLoading || props.disabled) && "disabled:bg-stone-300 disabled:shadow-none disabled:text-stone-500 disabled:cursor-not-allowed",
    isLoading && 'flex items-center justify-center gap-2 cursor-wait',
    className
  );

  return (
    <button
      disabled={isLoading || props.disabled}
      className={finalClasses}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
          <span>Cargando</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}