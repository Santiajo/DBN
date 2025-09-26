import React from 'react';
import { twMerge } from 'tailwind-merge';

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
  const isDisabled = props.disabled;

  const baseClasses = "px-6 py-3 rounded-xl font-body font-bold transition cursor-pointer disabled:cursor-not-allowed";

  const variantClasses = {
    primary: 'bg-madera-oscura text-white hover:bg-cuero shadow-md',
    secondary: 'bg-pergamino text-madera-oscura border border-madera-oscura hover:opacity-80',
    dangerous: 'bg-carmesi text-white hover:bg-red-800 shadow-md',
  };

  const disabledClasses = isDisabled && !isLoading
    ? 'bg-stone-300 text-stone-500 shadow-none'
    : '';

  const loadingClasses = isLoading
    ? 'flex items-center justify-center gap-2 cursor-wait'
    : '';

  const finalClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    disabledClasses,
    loadingClasses,
    className
  );

  return (
    <button
      disabled={isLoading || isDisabled}
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