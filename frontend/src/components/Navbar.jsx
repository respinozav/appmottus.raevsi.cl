import React from 'react';
import { Dumbbell, UserCheck, CalendarCheck, LogOut, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

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
    </>
  );
};

export default Navbar;
