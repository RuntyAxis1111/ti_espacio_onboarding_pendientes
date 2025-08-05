import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './components/AuthLayout';
import Navigation from './components/Navigation';
import ITChecklistManager from './pages/ITChecklistManager';
import PendingTasksManager from './components/PendingTasksManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('it-checklist');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'it-checklist':
        return <ITChecklistManager />;
      case 'pendientes-johan':
        return <PendingTasksManager tableName="pendientes_johan" title="Pendientes Johan" />;
      case 'pendientes-dani':
        return <PendingTasksManager tableName="pendientes_dani" title="Pendientes Dani" />;
      case 'pendientes-paco':
        return <PendingTasksManager tableName="pendientes_paco" title="Pendientes Paco" />;
      default:
        return <ITChecklistManager />;
    }
  };
  
  return (
    <AuthLayout>
      <div className="min-h-screen bg-white">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main>{renderContent()}</main>
      </div>
    </AuthLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppLayout />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;