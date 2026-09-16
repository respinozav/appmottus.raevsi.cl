import React from 'react';
import { Dumbbell, UserCheck, CalendarCheck, LogOut, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const roleBadge = {
    admin: { label: 'Admin', bg: 'rgba(110, 136, 66, 0.25)', border: '1px solid rgba(137, 168, 84, 0.5)', text: '#DEEAC1' },
    coach: { label: 'Coach', bg: 'rgba(141, 168, 88, 0.2)', border: '1px solid rgba(141, 168, 88, 0.4)', text: '#EDF1E8' },
    user: { label: 'Alumno', bg: 'rgba(42, 54, 26, 0.6)', border: '1px solid rgba(110, 136, 66, 0.3)', text: '#DCE5B9' }
  }[user?.role || 'user'];

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(110, 136, 66, 0.15)',
      backgroundColor: 'rgba(15, 20, 16, 0.82)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(110, 136, 66, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
        }}>
          <Dumbbell size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF' }}>
              MOTTUS
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--md-sys-color-primary-light)',
              letterSpacing: '0.12em',
              backgroundColor: 'rgba(110, 136, 66, 0.15)',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid rgba(110, 136, 66, 0.3)'
            }}>
              STUDIO
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', letterSpacing: '0.02em' }}>
            app.mottus.cl
          </span>
        </div>
      </div>

      {/* Navigation Tabs (Depending on role) */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(19, 25, 20, 0.6)',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid rgba(110, 136, 66, 0.15)'
      }}>
        {/* User View Tabs */}
        {user?.role === 'user' && (
          <>
            <button
              onClick={() => setActiveTab('my-routines')}
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
                backgroundColor: activeTab === 'my-routines' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'my-routines' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'my-routines' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <CalendarCheck size={17} />
              Mis Rutinas
            </button>

            <button
              onClick={() => setActiveTab('progress')}
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
                backgroundColor: activeTab === 'progress' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'progress' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'progress' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <TrendingUp size={17} />
              Mi Progreso
            </button>
          </>
        )}

        {/* Coach / Admin View Tabs */}
        {(user?.role === 'coach' || user?.role === 'admin') && (
          <>
            <button
              onClick={() => setActiveTab('exercises')}
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
                backgroundColor: activeTab === 'exercises' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'exercises' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'exercises' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <Dumbbell size={17} />
              Parrilla de Ejercicios
            </button>

            <button
              onClick={() => setActiveTab('routines')}
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
                backgroundColor: activeTab === 'routines' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'routines' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'routines' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <CalendarCheck size={17} />
              Rutinas Asignadas
            </button>

            <button
              onClick={() => setActiveTab('students')}
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
                backgroundColor: activeTab === 'students' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'students' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'students' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <UserCheck size={17} />
              Alumnos & Registro RUT
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
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
                backgroundColor: activeTab === 'analytics' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeTab === 'analytics' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: activeTab === 'analytics' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
              }}
            >
              <BarChart3 size={17} />
              Estadísticas
            </button>
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFF' }}>
              {user?.name || user?.rut}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: roleBadge.bg,
              border: roleBadge.border,
              color: roleBadge.text,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {roleBadge.label}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
            RUT: {user?.rut}
          </span>
        </div>

        <button
          onClick={logout}
          title="Cerrar sesión"
          style={{
            background: 'var(--md-sys-color-surface-variant)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
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
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
