import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccess = (rut, pass) => {
    setIdentifier(rut);
    setPassword(pass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 20%, #1A2417 0%, #0D110E 75%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: 'rgba(19, 25, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(110, 136, 66, 0.25)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(110, 136, 66, 0.15)',
        padding: '40px 32px',
        position: 'relative'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(110, 136, 66, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            marginBottom: '16px'
          }}>
            <Dumbbell size={32} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em' }}>
              MOTTUS
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--md-sys-color-primary-light)',
              letterSpacing: '0.12em',
              backgroundColor: 'rgba(110, 136, 66, 0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(110, 136, 66, 0.3)'
            }}>
              STUDIO
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--md-sys-color-tertiary)', marginTop: '6px' }}>
            Sistema Inteligente de Entrenamiento & Rutinas
          </p>
          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            app.mottus.cl
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: 'rgba(255, 180, 171, 0.12)',
            border: '1px solid rgba(255, 180, 171, 0.3)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--md-sys-color-error)',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>
              RUT o Correo Electrónico
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 12345678-9 o usuario@mottus.cl"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-surface-variant)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: '#FFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--md-sys-color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(110, 136, 66, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-surface-variant)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: '#FFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--md-sys-color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(110, 136, 66, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
              color: '#FFF',
              border: '1px solid rgba(137, 168, 84, 0.4)',
              fontWeight: 700,
              fontSize: '14.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)',
              transition: 'all 0.2s',
              marginTop: '6px'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.filter = 'none')}
          >
            {loading ? 'Ingresando...' : (
              <>
                Ingresar a la Plataforma
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(110, 136, 66, 0.15)',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '10px'
          }}>
            <Sparkles size={14} color="var(--md-sys-color-primary-light)" />
            Acceso Rápido de Prueba:
          </span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fillQuickAccess('1-9', 'Admin123!')}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(110, 136, 66, 0.12)',
                border: '1px solid rgba(110, 136, 66, 0.25)',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.12)'}
            >
              Admin (1-9)
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccess('2-7', 'Coach123!')}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(110, 136, 66, 0.12)',
                border: '1px solid rgba(110, 136, 66, 0.25)',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.12)'}
            >
              Coach (2-7)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
