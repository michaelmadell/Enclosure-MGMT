import React from 'react';
import { Monitor } from 'lucide-react';
import { ApiToolsPanel } from './ApiToolsPanel';

export const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-base-200 border border-base-300">
      <div className="text-center text-base-content/30">
      
        <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No CMC selected</p>
        <p className="text-sm mt-2">Select a CMC from the sidebar or add a new one to get started</p>
      </div>
    </div>
  );
};