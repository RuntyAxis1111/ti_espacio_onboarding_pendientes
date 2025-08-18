import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'it-checklist', label: 'IT Checklist', icon: '🐧' },
  { id: 'ticketing', label: 'Ticketing', icon: '🎫' },
  { id: 'pendientes-johan', label: 'Pendientes Johan', icon: ClipboardDocumentListIcon },
  { id: 'pendientes-dani', label: 'Pendientes Dani', icon: ClipboardDocumentListIcon },
  { id: 'pendientes-paco', label: 'Pendientes Paco', icon: ClipboardDocumentListIcon },
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center space-x-2 px-4 py-4 text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-300 hover:text-slate-100'
                }`}
              >
                {typeof IconComponent === 'string' ? (
                  <span className="text-lg">{IconComponent}</span>
                ) : (
                  <IconComponent className="h-4 w-4" />
                )}
                <span>{tab.label}</span>
                
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-200">
                  {user?.user_metadata?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-200">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.user_metadata?.email}
                </p>
              </div>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                >
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;