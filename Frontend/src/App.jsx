import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function Main() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}