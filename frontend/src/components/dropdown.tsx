'use client';

import { SelectHTMLAttributes } from 'react';

// Estructura de cada opción en el menú
export interface OptionType {
  value: string | number;
  label: string;
}

// Props del componente
interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  // SOLUCIÓN: Hacemos que la prop 'label' sea opcional con '?'
  label?: string;
  options: OptionType[];
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  label,
  options,
  placeholder,
  className = '',
  ...props
}: DropdownProps) {
  return (
    // Hemos quitado la lógica del <label> de este div principal
    // para manejarlo de forma condicional.
    <div className={`w-full font-body ${className}`}>
      {/* SOLUCIÓN: El <label> solo se renderiza si la prop 'label' existe. */}
      {label && (
        <label htmlFor={props.id || props.name} className="block text-stone-800 mb-2">
          {label}
        </label>
      )}
      <select
        className="w-full px-4 py-2 rounded-lg border border-stone-400 bg-white text-stone-900 
                   focus:ring-2 focus:ring-[#3E6B5C] focus:border-[#3E6B5C] focus:outline-none"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}