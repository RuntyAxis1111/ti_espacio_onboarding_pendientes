import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
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
  const theme = useTheme();
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
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main>{renderContent()}</main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppLayout />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;