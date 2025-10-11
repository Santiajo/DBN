'use client';

import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export default function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer font-body ${className}`}>
      <input
        type="checkbox"
        className="h-5 w-5 text-madera-oscura border-madera-oscura rounded focus:ring-2 focus:ring-[#3E6B5C] bg-transparent accent-bosque"
        {...props}
      />
      <span className="text-stone-800 select-none">{label}</span>
    </label>
  );
}