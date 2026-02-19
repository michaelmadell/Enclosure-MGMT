import React from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group btn btn-secondary px-5 py-2">
      {/* Sun icon */}
      <Sun
        className={`w-4 h-4 transition-colors text-base-content group-data-[state=checked]:text-gray-400`}
      />

      {/* DaisyUI toggle */}
      <input
        type="checkbox"
        className="toggle toggle-sm text-base-content"
        checked={isDark}
        onChange={onToggle}
        aria-label="Toggle dark mode"
      />

      {/* Moon icon */}
      <Moon
        className={`w-4 h-4 transition-colors text-base-content group-data-[state=checked]:text-gray-400`}
      />

      {/* Label */}
      <span className="text-xs text-base-content hidden sm:inline">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </label>
  );
};