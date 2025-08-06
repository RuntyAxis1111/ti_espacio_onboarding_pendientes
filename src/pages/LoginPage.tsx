import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      console.log('🔍 LoginPage: Initiating Google login...');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/`
        }
      });
      console.log('🔍 LoginPage: Google login initiated');
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  console.log('🔍 LoginPage: Rendering login page');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png"
              alt="Tux" 
              className="h-12 w-12 mr-3" 
            />
            <h1 className="text-2xl font-bold text-slate-900">
              IT Checklist Manager
            </h1>
          </div>
          <p className="text-slate-600">
            Inicia sesión para acceder al sistema
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-slate-200 rounded-lg px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Solo usuarios autorizados de Hybe Latin America</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;