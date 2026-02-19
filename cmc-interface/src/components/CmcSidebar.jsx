import React from 'react';
import { Monitor, Trash2, Edit } from 'lucide-react';

export const CmcSidebar = ({ cmcs, selectedCmc, onSelectCmc, onDeleteCmc, onEditCmc }) => {
  return (
    <div className="w-80 bg-base-200 border-r border-base-300 overflow-y-auto flex-shrink-0">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
          Enclosures
        </h2>

        {cmcs.length === 0 ? (
          <div className="text-center py-8 text-base-content/30">
            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No CMCs added yet</p>
            <p className="text-xs mt-1">Click "Add CMC" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cmcs.map(cmc => (
              <CmcCard
                key={cmc.id}
                cmc={cmc}
                isSelected={selectedCmc?.id === cmc.id}
                onSelect={() => onSelectCmc(cmc)}
                onEdit={() => onEditCmc(cmc)}
                onDelete={() => onDeleteCmc(cmc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CmcCard = ({ cmc, isSelected, onSelect, onEdit, onDelete }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete ${cmc.name}?`)) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-accent text-accent-content shadow-lg'
          : 'bg-base-300 hover:bg-base-300/70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{cmc.name}</h3>
          <p className={`text-xs truncate mt-1 ${isSelected ? 'text-accent-content/70' : 'text-base-content/60'}`}>
            {cmc.address}
          </p>
          <p className={`text-xs mt-1 ${isSelected ? 'text-accent-content/60' : 'text-base-content/40'}`}>
            User: {cmc.username} | Pass: {cmc.password}
          </p>
          {cmc.notes && (
            <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-accent-content/50' : 'text-base-content/30'}`}>
              {cmc.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={handleEdit}
            className="btn btn-ghost btn-xs opacity-70 hover:opacity-100"
            title="Edit CMC"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-ghost btn-xs text-error opacity-70 hover:opacity-100"
            title="Delete CMC"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};