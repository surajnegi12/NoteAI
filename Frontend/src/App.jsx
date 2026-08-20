import React from 'react';
import { useAuth } from './context/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Dashboard /> : <Auth />;
}