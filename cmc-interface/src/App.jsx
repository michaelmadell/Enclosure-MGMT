import React, { useState } from 'react';
import { Server, Plus } from 'lucide-react';
import { useCmcs } from './hooks/useCmcs';  // ← CHANGED: Using API backend
import { useTheme } from './hooks/useTheme';
import { CmcSidebar } from './components/CmcSidebar';
import { CmcViewer } from './components/CmcViewer';
import { EmptyState } from './components/EmptyState';
import { AddCmcModal } from './components/AddCmcModal';
import { EditCmcModal } from './components/EditCmcModal';
import { ThemeToggle } from './components/ThemeToggle';

function App() {
  const { cmcs, selectedCmc, setSelectedCmc, addCmc, updateCmc, deleteCmc, loading, error } = useCmcs();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCmc, setEditingCmc] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  const handleAddCmc = async (cmcData) => {
    const result = await addCmc(cmcData);
    if (result?.success !== false) {
      setShowAddModal(false);
    } else {
      alert(`Failed to add CMC: ${result.error}`);
    }
  };

  const handleEditCmc = async (id, cmcData) => {
    const result = await updateCmc(id, cmcData);
    if (result?.success !== false) {
      setEditingCmc(null);
    } else {
      alert(`Failed to update CMC: ${result.error}`);
    }
  };

  const handleDeleteCmc = async (id) => {
    const result = await deleteCmc(id);
    if (result?.success === false) {
      alert(`Failed to delete CMC: ${result.error}`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading CMC Manager...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-base-100">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Backend Connection Error</h3>
            <div className="text-sm">{error}</div>
            <div className="text-xs mt-2 opacity-75">
              Make sure backend is running: cd backend && npm run dev
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-base-100">
      {/* Header */}
      <header className="bg-base-200 border-b border-base-300 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-base-content">CMC Central Manager</h1>
              <p className="text-sm text-base-content/50">Chassis Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle theme={isDark ? 'business' : 'silk'} onToggle={toggleTheme} />
            <div className="divider divider-horizontal mx-0"></div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Add CMC
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <CmcSidebar
          cmcs={cmcs}
          selectedCmc={selectedCmc}
          onSelectCmc={setSelectedCmc}
          onEditCmc={setEditingCmc}
          onDeleteCmc={handleDeleteCmc}
        />

        {selectedCmc ? (
          <CmcViewer cmc={selectedCmc} />
        ) : (
          <EmptyState onAddCmc={() => setShowAddModal(true)} />
        )}
      </div>

      {/* Add CMC Modal */}
      {showAddModal && (
        <AddCmcModal
          onAdd={handleAddCmc}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit CMC Modal */}
      {editingCmc && (
        <EditCmcModal
          cmc={editingCmc}
          onUpdate={handleEditCmc}
          onClose={() => setEditingCmc(null)}
        />
      )}
    </div>
  );
}

export default App;