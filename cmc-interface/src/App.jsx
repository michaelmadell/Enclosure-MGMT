import React, { useState, useEffect } from 'react';
import { Server, Plus, LogOut, Shield, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CmcSidebar } from './components/CmcSidebar';
import { CmcViewer } from './components/CmcViewer';
import { EmptyState } from './components/EmptyState';
import { AddCmcModal } from './components/AddCmcModal';
import { EditCmcModal } from './components/EditCmcModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Login } from './components/Login';
import { API_BASE_URL } from './config';
import { useTheme } from './hooks/useTheme';
import { useCmcs } from './hooks/useCmcs';



function AppContent() {
  const { user, logout, isAdmin, isGuest, isAuthenticated, loading: authLoading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCmc, setEditingCmc] = useState(null);
  const [cmcs, setCmcs] = useState([]);
  const [selectedCmc, setSelectedCmc] = useState(null);
  const { loading, setLoading } = useCmcs();

  const { isDark, toggleTheme } = useTheme();

  const fetchCmcs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/cmcs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCmcs(data);
        
        // If we had a selected CMC, update it with fresh data
        if (selectedCmc) {
          const updatedCmc = data.find(c => c.id === selectedCmc.id);
          if (updatedCmc) {
            setSelectedCmc(updatedCmc);
          }
        }
      } else {
        console.error('Failed to fetch CMCs:', response.status);
      }
    } catch (error) {
      console.error('Error fetching CMCs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCmcs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAddCmc = async (formData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/cmcs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newCmc = await response.json();
        await fetchCmcs();
        setSelectedCmc(newCmc);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to add CMC' };
      }
    } catch (error) {
      console.error('Error adding CMC:', error);
      return { success: false, error: error.message };
    }
  };

  const handleUpdateCmc = async (id, formData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/cmcs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCmcs();
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update CMC' };
      }
    } catch (error) {
      console.error('Error updating CMC:', error);
      return { success: false, error: error.message };
    }
  };

  const handleEditClick = (cmc) => {
    setEditingCmc(cmc);
    setShowEditModal(true);
  };

  const handleDeleteCmc = async (id) => {
    if (!confirm('Are you sure you want to delete this CMC?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/cmcs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (selectedCmc?.id === id) {
          setSelectedCmc(null);
        }
        await fetchCmcs();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete CMC');
      }
    } catch (error) {
      console.error('Error deleting CMC:', error);
      alert(error.message);
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

  // Show login if not authenticated
  if (!isAuthenticated || !user) {
    return <Login />;
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
            onEditCmc={handleEditClick}
            onDeleteCmc={handleDeleteCmc}
            isAdmin={isAdmin()}
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
      <AddCmcModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCmc}
      />

      <EditCmcModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCmc(null);
        }}
        onUpdate={handleUpdateCmc}
        cmc={editingCmc}
      />
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