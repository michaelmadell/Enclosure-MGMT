import React from 'react';
import { Server, Plus } from 'lucide-react';
// Remove the ApiToolsPanel import

export function EmptyState({ onAddClick }) {
  return (
    <div className="h-full flex items-center justify-center bg-base-100 p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
          <Server className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-base-content mb-2">
          No CMCs Yet
        </h2>
        
        <p className="text-base-content/60 mb-6">
          Get started by adding your first CMC configuration. You can manage multiple
          CMCs from this central interface.
        </p>
        
        <button
          onClick={onAddClick}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Your First CMC
        </button>

        <div className="mt-8 text-sm text-base-content/50">
          <p>CMCs will appear in the sidebar once added.</p>
        </div>
      </div>
    </div>
  );
}