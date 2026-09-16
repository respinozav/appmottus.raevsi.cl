import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mottus_user');
    const token = localStorage.getItem('mottus_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify current user validity with backend
        api.get('/auth/me')
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('mottus_user', JSON.stringify(res.data));
          })
          .catch(() => {
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', {
      identifier: identifier.trim(),
      password: password,
    });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('mottus_token', access_token);
    localStorage.setItem('mottus_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('mottus_token');
    localStorage.removeItem('mottus_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
