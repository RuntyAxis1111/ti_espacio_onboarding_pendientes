import React, { ReactNode } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import LoginPage from '../pages/LoginPage';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  // const { user, loading } = useAuth();

  // console.log('🔍 AuthLayout: user:', user, 'loading:', loading);

  // if (loading) {
  //   console.log('🔍 AuthLayout: Showing loading state');
  //   return (
  //     <div className="min-h-screen bg-white flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   console.log('🔍 AuthLayout: No user found, showing LoginPage');
  //   return <LoginPage />;
  // }

  // console.log('🔍 AuthLayout: User authenticated, showing protected content');
  
  return <>{children}</>;
};

export default AuthLayout;