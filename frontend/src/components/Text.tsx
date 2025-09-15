"use client";

import { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  variant?: "title" | "subtitle" | "body";
}

export default function Text({ children, variant = "body" }: TextProps) {
  const styles = {
    title: "text-2xl font-bold",
    subtitle: "text-lg font-semibold text-gray-600",
    body: "text-base text-gray-800",
  };

  return <p className={styles[variant]}>{children}</p>;
}