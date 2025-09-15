"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({ children, onClick, type = "button" }: ButtonProps) {
  return (
    <button
      type={type}   // por defecto será "button", no "submit"
      onClick={onClick}
      className="dbn-parchment-button"
    >
      {children}
    </button>
  );
}