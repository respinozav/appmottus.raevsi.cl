import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inactividad
const INACTIVITY_CHECK_INTERVAL_MS = 15 * 1000; // Chequeo cada 15 segundos

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(() => {
    return sessionStorage.getItem('mottus_session_expired') || '';
  });

  const clearSessionExpiredMsg = useCallback(() => {
    setSessionExpiredMsg('');
    sessionStorage.removeItem('mottus_session_expired');
  }, []);

  const logout = useCallback((isDueToInactivity = false) => {
    localStorage.removeItem('mottus_token');
    localStorage.removeItem('mottus_user');
    localStorage.removeItem('mottus_last_active');
    setUser(null);

    if (isDueToInactivity) {
      const msg = 'Tu sesión ha expirado por 30 minutos de inactividad. Por favor, inicia sesión nuevamente para continuar entrenando.';
      setSessionExpiredMsg(msg);
      sessionStorage.setItem('mottus_session_expired', msg);
    } else {
      clearSessionExpiredMsg();
    }
  }, [clearSessionExpiredMsg]);

  // Verificación inicial de sesión guardada
  useEffect(() => {
    const savedUser = localStorage.getItem('mottus_user');
    const token = localStorage.getItem('mottus_token');
    const lastActive = parseInt(localStorage.getItem('mottus_last_active') || '0', 10);

    // Si ya pasaron más de 30 minutos desde la última actividad guardada
    if (token && lastActive && (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS)) {
      logout(true);
      setLoading(false);
      return;
    }

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        localStorage.setItem('mottus_last_active', String(Date.now()));
        
        // Verificar validez con backend
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
  }, [logout]);

  // Monitor de Inactividad de 30 minutos
  useEffect(() => {
    if (!user) return;

    // Registrar actividad con throttle de 10s para no saturar localStorage
    let lastThrottledTime = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 10000) {
        lastThrottledTime = now;
        localStorage.setItem('mottus_last_active', String(now));
      }
    };

    // Eventos de interacción del usuario (tacto, click, teclado, scroll)
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Chequeo periódico cada 15 segundos
    const intervalId = setInterval(() => {
      const storedLastActive = parseInt(localStorage.getItem('mottus_last_active') || '0', 10);
      if (storedLastActive && (Date.now() - storedLastActive > INACTIVITY_TIMEOUT_MS)) {
        logout(true);
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);

    // Chequeo inmediato al reanudar pestaña o desbloquear celular
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const storedLastActive = parseInt(localStorage.getItem('mottus_last_active') || '0', 10);
        if (storedLastActive && (Date.now() - storedLastActive > INACTIVITY_TIMEOUT_MS)) {
          logout(true);
        } else {
          handleUserInteraction();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [user, logout]);

  const login = async (identifier, password) => {
    clearSessionExpiredMsg();
    const response = await api.post('/auth/login', {
      identifier: identifier.trim(),
      password: password,
    });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('mottus_token', access_token);
    localStorage.setItem('mottus_user', JSON.stringify(userData));
    localStorage.setItem('mottus_last_active', String(Date.now()));
    setUser(userData);
    return userData;
  };

  const updateUser = (userData) => {
    localStorage.setItem('mottus_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      updateUser, 
      isAuthenticated: !!user,
      sessionExpiredMsg,
      clearSessionExpiredMsg
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
