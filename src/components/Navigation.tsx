import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardListIcon } from '@heroicons/react/24/outline';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'it-checklist', label: 'IT Checklist', icon: '🐧' },
  { id: 'pendientes-johan', label: 'Pendientes Johan', icon: ClipboardListIcon },
  { id: 'pendientes-dani', label: 'Pendientes Dani', icon: ClipboardListIcon },
  { id: 'pendientes-paco', label: 'Pendientes Paco', icon: ClipboardListIcon },
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6">
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
      </div>
    </nav>
  );
};

export default Navigation;