// src/components/Button.tsx
import React from 'react';

type ButtonProps = {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'dangerous';
    isLoading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
    children,
    variant = 'primary',
    isLoading = false,
    ...props
}: ButtonProps) {
        const baseClasses = "px-6 py-3 rounded-xl font-body font-bold transition cursor-pointer disabled:cursor-not-allowed";

    const isDisabled = props.disabled;

    // Remove hover classes if disabled and not loading
    const variantClasses = {
        primary: isDisabled && !isLoading
            ? 'bg-cuero text-white shadow-md'
            : 'bg-cuero text-white hover:bg-madera-oscura shadow-md',
        secondary: isDisabled && !isLoading
            ? 'bg-pergamino text-madera-oscura border border-madera-oscura'
            : 'bg-pergamino text-madera-oscura border border-madera-oscura hover:opacity-80',
        dangerous: isDisabled && !isLoading
            ? 'bg-carmesi text-white shadow-md'
            : 'bg-carmesi text-white hover:bg-red-800 shadow-md',
    };

    const disabledClasses =
        isDisabled && !isLoading
            ? 'bg-stone-300 text-stone-500'
            : '';

    const loadingClasses = isLoading
        ? 'flex items-center justify-center gap-2 cursor-wait'
        : '';

    const finalClasses = [
        baseClasses,
        variantClasses[variant],
        disabledClasses,
        loadingClasses,
    ].join(' ');

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