import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const theme = useTheme();

  return (
    <motion.nav 
      className="sticky top-0 z-50"
      style={{ 
        backgroundColor: theme.background,
        borderBottom: `1px solid ${theme.tableBorder}`
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            style={{ color: theme.textPrimary }}
          >
            <ComputerDesktopIcon className="h-8 w-8" style={{ color: theme.primaryAccent }} />
            <span className="text-xl font-extrabold">
              HYBE LATAM FEED FINANCE
            </span>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;