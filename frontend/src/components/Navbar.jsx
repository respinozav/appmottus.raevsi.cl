import React, { useState, useEffect } from 'react';
import { Dumbbell, UserCheck, CalendarCheck, LogOut, TrendingUp, BarChart3, User as UserIcon, Lock, KeyRound, Check, X, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DirectMessagesModal } from './DirectMessagesModal';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, updateUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/users/messages-unread-count');
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const openProfileModal = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      current_password: '',
      new_password: ''
    });
    setProfileMsg({ type: '', text: '' });
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const payload = {
        name: profileForm.name.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
      };

      if (profileForm.new_password) {
        if (!profileForm.current_password) {
          setProfileMsg({ type: 'error', text: 'Ingresa tu contraseña actual para cambiarla.' });
          setSavingProfile(false);
          return;
        }
        payload.current_password = profileForm.current_password;
        payload.new_password = profileForm.new_password;
      }

      const res = await api.put('/auth/profile', payload);
      updateUser(res.data);
      setProfileMsg({ type: 'success', text: '¡Perfil actualizado con éxito!' });
      setProfileForm(prev => ({ ...prev, current_password: '', new_password: '' }));
      setTimeout(() => {
        setIsProfileOpen(false);
        setProfileMsg({ type: '', text: '' });
      }, 1400);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setProfileMsg({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Error al guardar cambios de perfil.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const roleBadge = {
    admin: { label: 'Admin', bg: 'rgba(110, 136, 66, 0.25)', border: '1px solid rgba(137, 168, 84, 0.5)', text: '#DEEAC1' },
    coach: { label: 'Coach', bg: 'rgba(141, 168, 88, 0.2)', border: '1px solid rgba(141, 168, 88, 0.4)', text: '#EDF1E8' },
    user: { label: 'Alumno', bg: 'rgba(42, 54, 26, 0.6)', border: '1px solid rgba(110, 136, 66, 0.3)', text: '#DCE5B9' }
  }[user?.role || 'user'];

  const navTabs = user?.role === 'user'
    ? [
        { id: 'my-routines', label: 'Mis Rutinas', shortLabel: 'Rutinas', icon: CalendarCheck },
        { id: 'progress', label: 'Mi Progreso', shortLabel: 'Progreso', icon: TrendingUp },
      ]
    : [
        { id: 'exercises', label: 'Parrilla de Ejercicios', shortLabel: 'Ejercicios', icon: Dumbbell },
        { id: 'routines', label: 'Rutinas Asignadas', shortLabel: 'Rutinas', icon: CalendarCheck },
        { id: 'students', label: 'Alumnos & Registro', shortLabel: 'Alumnos', icon: UserCheck },
        { id: 'analytics', label: 'Estadísticas', shortLabel: 'Métricas', icon: BarChart3 },
      ];

  return (
    <>
      {/* Top Header */}
      <header className="glass-panel top-navbar" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(110, 136, 66, 0.15)',
        backgroundColor: 'rgba(15, 20, 16, 0.88)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(110, 136, 66, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <Dumbbell size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF' }}>
                MOTTUS
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--md-sys-color-primary-light)',
                letterSpacing: '0.1em',
                backgroundColor: 'rgba(110, 136, 66, 0.15)',
                padding: '2px 5px',
                borderRadius: '5px',
                border: '1px solid rgba(110, 136, 66, 0.3)'
              }}>
                STUDIO
              </span>
            </div>
            <span className="navbar-brand-subtitle" style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', letterSpacing: '0.02em' }}>
              appmottus.raevsi.cl
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="desktop-nav-tabs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: isActive ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                  boxShadow: isActive ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
                }}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <span className="navbar-user-name" style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFF' }}>
                {user?.name || user?.rut}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: roleBadge.bg,
                border: roleBadge.border,
                color: roleBadge.text,
                padding: '2px 6px',
                borderRadius: '5px',
                flexShrink: 0
              }}>
                {roleBadge.label}
              </span>
            </div>
            <span className="navbar-user-rut" style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)', display: 'block' }}>
              RUT: {user?.rut}
            </span>
          </div>

          {/* Botón Chat Directo con Badge */}
          <button
            onClick={() => setIsChatOpen(true)}
            title="Mensajes Directos (Inbox 1 a 1)"
            aria-label="Mensajes Directos"
            style={{
              position: 'relative',
              background: unreadCount > 0 ? 'rgba(110, 136, 66, 0.3)' : 'var(--md-sys-color-surface-variant)',
              border: unreadCount > 0 ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid var(--md-sys-color-outline-variant)',
              color: unreadCount > 0 ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)';
              e.currentTarget.style.color = '#DEEAC1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = unreadCount > 0 ? 'rgba(110, 136, 66, 0.3)' : 'var(--md-sys-color-surface-variant)';
              e.currentTarget.style.color = unreadCount > 0 ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)';
            }}
          >
            <MessageSquare size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#89A854',
                color: '#151D14',
                fontSize: '10px',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px rgba(137, 168, 84, 0.8)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={openProfileModal}
            title="Mi Perfil y Contraseña"
            aria-label="Mi Perfil y Contraseña"
            style={{
              background: 'var(--md-sys-color-surface-variant)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)';
              e.currentTarget.style.color = '#DEEAC1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-variant)';
              e.currentTarget.style.color = 'var(--md-sys-color-on-surface-variant)';
            }}
          >
            <UserIcon size={17} />
          </button>

          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            style={{
              background: 'var(--md-sys-color-surface-variant)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 180, 171, 0.15)';
              e.currentTarget.style.color = 'var(--md-sys-color-error)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-variant)';
              e.currentTarget.style.color = 'var(--md-sys-color-on-surface-variant)';
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for Smartphones & Tablets) */}
      <nav className="mobile-bottom-nav" aria-label="Navegación Móvil">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isActive ? 'rgba(110, 136, 66, 0.3)' : 'transparent',
                color: isActive ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: isActive ? '0 0 14px rgba(110, 136, 66, 0.35)' : 'none',
                minWidth: '58px',
                minHeight: '48px',
                touchAction: 'manipulation'
              }}
            >
              <Icon size={20} color={isActive ? '#E2EFC8' : 'currentColor'} />
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em',
                lineHeight: 1
              }}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modal Mi Perfil y Seguridad */}
      {isProfileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(110, 136, 66, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(110, 136, 66, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--md-sys-color-primary-light)'
                }}>
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFF', margin: 0 }}>Mi Perfil</h3>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    RUT: {user?.rut} ({roleBadge.label})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {profileMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: profileMsg.type === 'success' ? 'rgba(110, 136, 66, 0.2)' : 'rgba(255, 180, 171, 0.15)',
                color: profileMsg.type === 'success' ? '#DEEAC1' : 'var(--md-sys-color-error)',
                border: `1px solid ${profileMsg.type === 'success' ? 'rgba(110, 136, 66, 0.4)' : 'rgba(255, 180, 171, 0.3)'}`
              }}>
                {profileMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    fontSize: '14px'
                  }}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    fontSize: '14px'
                  }}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    fontSize: '14px'
                  }}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div style={{
                marginTop: '6px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-sys-color-primary-light)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Lock size={14} /> Cambiar Contraseña (Opcional)
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="password"
                    value={profileForm.current_password}
                    onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFF',
                      fontSize: '13px'
                    }}
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                  />
                  <input
                    type="password"
                    value={profileForm.new_password}
                    onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFF',
                      fontSize: '13px'
                    }}
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: 'var(--md-sys-color-on-surface)',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Mensajes Directos 1 a 1 (Inbox TrueCoach) */}
      <DirectMessagesModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
        onMessagesRead={fetchUnreadCount}
      />
    </>
  );
};

export default Navbar;
