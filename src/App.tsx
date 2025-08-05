import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import LaptopInventory from './pages/LaptopInventory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppLayout>
          <LaptopInventory />
        </AppLayout>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;