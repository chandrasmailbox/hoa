import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MaintenanceList } from './components/Maintenance/MaintenanceList';
import { TransactionList } from './components/Financial/TransactionList';
import { PaymentPortal } from './components/Payments/PaymentPortal';
import { AnnouncementList } from './components/Announcements/AnnouncementList';
import { NotificationCenter } from './components/Notifications/NotificationCenter';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'maintenance':
        return <MaintenanceList />;
      case 'transactions':
        return <TransactionList />;
      case 'payments':
        return <PaymentPortal />;
      case 'announcements':
        return <AnnouncementList />;
      case 'notifications':
        return <NotificationCenter />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {renderView()}
        </div>
      </main>
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
