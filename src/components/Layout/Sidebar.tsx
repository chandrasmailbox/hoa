import { Home, Wrench, DollarSign, CreditCard, Bell, Megaphone, LogOut, BarChart3, FileText, Menu, X, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { profile, signOut, isAdmin } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'resident'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'resident'] },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, roles: ['admin'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'resident'] },
    { id: 'properties', label: 'Properties', icon: Building2, roles: ['admin'] }, // <-- Added here
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
    { id: 'statements', label: 'Statements', icon: FileText, roles: ['admin'] },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, roles: ['admin', 'resident'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'resident'] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(profile?.role || 'resident')
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-slate-900 text-white flex flex-col h-screen
          fixed lg:relative
          transition-all duration-300 ease-in-out
          z-40
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg flex-shrink-0">
              <Home className="h-6 w-6 text-slate-900" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold truncate">HOA Manager</h1>
                <p className="text-xs text-slate-400 truncate">
                  {isAdmin ? 'Admin Portal' : 'Resident Portal'}
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex mt-4 w-full justify-center py-2 text-sm text-slate-400 hover:text-white transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          {!isCollapsed && (
            <div className="bg-slate-800 rounded-lg p-4 mb-3">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-full">
                {profile?.role}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};