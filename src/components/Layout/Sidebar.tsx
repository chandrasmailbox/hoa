import { Home, Wrench, DollarSign, CreditCard, Bell, Megaphone, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { profile, signOut, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'resident'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'resident'] },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, roles: ['admin'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'resident'] },
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

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <Home className="h-6 w-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold">HOA Manager</h1>
            <p className="text-xs text-slate-400">
              {isAdmin ? 'Admin Portal' : 'Resident Portal'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-4 mb-3">
          <p className="text-sm font-medium text-white">{profile?.full_name}</p>
          <p className="text-xs text-slate-400">{profile?.email}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-full">
            {profile?.role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
