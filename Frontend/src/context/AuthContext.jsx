import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser({ email });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/signin', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('userEmail', res.data.email);
    setUser({ email: res.data.email });
  };

  const signup = async (email, password) => {
    const res = await api.post('/auth/signup', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('userEmail', res.data.email);
    setUser({ email: res.data.email });
  };

  const googleLogin = async (idToken) => {
    const res = await api.post('/auth/google', { idToken });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('userEmail', res.data.email);
    setUser({ email: res.data.email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};