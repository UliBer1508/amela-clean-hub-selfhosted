import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a consistent color from a string (e.g., booking ID)
 * Returns a Tailwind border color class
 */
export const getColorFromString = (str: string): string => {
  // Color palette - 12 vibrant, distinguishable colors
  const colors = [
    'border-l-blue-500',
    'border-l-purple-500',
    'border-l-pink-500',
    'border-l-red-500',
    'border-l-orange-500',
    'border-l-amber-500',
    'border-l-lime-500',
    'border-l-green-500',
    'border-l-emerald-500',
    'border-l-teal-500',
    'border-l-cyan-500',
    'border-l-indigo-500',
  ];

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Get index from hash (always same color for same string)
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
