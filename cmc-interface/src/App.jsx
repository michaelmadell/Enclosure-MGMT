import React, { useState } from 'react';
import { Server, Plus, LogOut, Shield, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useCmcs } from './hooks/useCmcs';
import { useTheme } from './hooks/useTheme';
import { CmcSidebar } from './components/CmcSidebar';
import { CmcViewer } from './components/CmcViewer';
import { EmptyState } from './components/EmptyState';
import { AddCmcModal } from './components/AddCmcModal';
import { EditCmcModal } from './components/EditCmcModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Login } from './components/Login';

function AppContent() {
  const { user, logout, isAdmin, isGuest, isAuthenticated, loading: authLoading } = useAuth();
  const { cmcs, selectedCmc, setSelectedCmc, addCmc, updateCmc, deleteCmc, loading, error } = useCmcs();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCmc, setEditingCmc] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

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
    if (!confirm('Are you sure you want to delete this CMC?')) return;
    
    const result = await deleteCmc(id);
    if (result?.success === false) {
      alert(`Failed to delete CMC: ${result.error}`);
    }
  };

  // Show loading state
  if (loading || authLoading) {
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
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-base-200">
      {/* Header */}
      <header className="bg-base-100 border-b border-base-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-base-content">CMC Central Manager</h1>
              <p className="text-xs text-base-content/60">Manage multiple CMCs from one interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* User Info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg">
              {isAdmin() ? (
                <Shield className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-info" />
              )}
              <div className="text-sm">
                <div className="font-semibold text-base-content">{user?.username}</div>
                <div className="text-xs text-base-content/60 capitalize">{user?.role}</div>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="btn btn-ghost btn-sm gap-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-base-100 border-r border-base-300 flex flex-col">
          <div className="p-4 border-b border-base-300">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary w-full gap-2"
              disabled={isGuest()}
            >
              <Plus className="w-4 h-4" />
              Add CMC
            </button>
            {isGuest() && (
              <p className="text-xs text-warning mt-2 text-center">
                Guest users have read-only access
              </p>
            )}
          </div>
          
          <CmcSidebar
            cmcs={cmcs}
            selectedCmc={selectedCmc}
            onSelectCmc={setSelectedCmc}
            onEditCmc={(cmc) => setEditingCmc(cmc)}
            onDeleteCmc={handleDeleteCmc}
            readOnly={isGuest()}
          />
        </aside>

        {/* Main Viewer */}
        <main className="flex-1 overflow-hidden">
          {selectedCmc ? (
            <CmcViewer cmc={selectedCmc} />
          ) : (
            <EmptyState onAddClick={() => setShowAddModal(true)} />
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCmcModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCmc}
        />
      )}

      {editingCmc && (
        <EditCmcModal
          cmc={editingCmc}
          onClose={() => setEditingCmc(null)}
          onUpdate={handleEditCmc}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;