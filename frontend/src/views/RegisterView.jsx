import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Dumbbell, ArrowRight } from 'lucide-react';
import api from '../services/api';

export const RegisterView = ({ token, onRegistered }) => {
  const [validating, setValidating] = useState(true);
  const [validUser, setValidUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido o sin token de invitación.');
      setValidating(false);
      return;
    }

    api.get(`/users/verify-token/${token}`)
      .then((res) => {
        setValidUser(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'El enlace de registro ha expirado o ya fue utilizado.');
      })
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/users/complete-registration', {
        token,
        name,
        gender,
        phone,
        email: email ? email.trim() : null,
        password,
        weight: parseFloat(weight),
        height: parseFloat(height),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onRegistered) onRegistered();
        else window.location.href = '/';
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al completar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--md-sys-color-background)' }}>
        <p style={{ color: 'var(--md-sys-color-tertiary)' }}>Verificando enlace de invitación Mottus Gym...</p>
      </div>
    );
  }

  if (error && !validUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--md-sys-color-background)' }}>
        <div style={{ maxWidth: '440px', textAlign: 'center', padding: '32px', backgroundColor: 'var(--md-sys-color-surface)', borderRadius: '24px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <AlertCircle size={48} color="var(--md-sys-color-error)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', color: '#FFF', marginBottom: '8px' }}>Enlace no disponible</h2>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px' }}>{error}</p>
          <a href="/" style={{ color: 'var(--md-sys-color-primary-container)', fontWeight: 600, textDecoration: 'none' }}>
            Ir a inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--md-sys-color-background)' }}>
        <div style={{ maxWidth: '460px', textAlign: 'center', padding: '40px 32px', backgroundColor: 'var(--md-sys-color-surface)', borderRadius: '24px', border: '1px solid var(--md-sys-color-primary)' }}>
          <CheckCircle2 size={54} color="var(--md-sys-color-secondary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>¡Registro Completado!</h2>
          <p style={{ fontSize: '15px', color: 'var(--md-sys-color-tertiary)', marginBottom: '16px' }}>
            Bienvenido a <strong>Mottus Gym</strong>, {name}. Tu cuenta ha sido activada con éxito.
          </p>
          <span style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Redirigiendo a la pantalla de inicio de sesión...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{
      background: 'radial-gradient(circle at top, #1E271F 0%, #0E120E 80%)'
    }}>
      <div className="auth-card" style={{ maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Dumbbell size={30} color="#FFF" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
            Bienvenido a Mottus Gym
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
            Completa tus datos para activar tu cuenta de entrenamiento
          </p>
          {validUser?.rut && (
            <div style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(110, 136, 66, 0.2)',
              border: '1px solid rgba(137, 168, 84, 0.4)',
              color: 'var(--md-sys-color-primary-light)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              RUT Asignado: {validUser.rut}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255, 180, 171, 0.15)',
            border: '1px solid rgba(255, 180, 171, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'var(--md-sys-color-error)',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Camilo Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="responsive-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
                Sexo *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={inputStyle}
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
                Celular / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="responsive-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
                Peso Actual (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="75.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
                Estatura (cm) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
              Correo Electrónico (Opcional)
            </label>
            <input
              type="email"
              placeholder="ejemplo@mottus.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
              Crea tu Contraseña de Acceso *
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
              color: '#FFF',
              border: '1px solid rgba(137, 168, 84, 0.4)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)',
              marginTop: '10px'
            }}
          >
            {submitting ? 'Activando cuenta...' : (
              <>
                Finalizar Registro & Activar Cuenta
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  backgroundColor: 'var(--md-sys-color-surface-variant)',
  border: '1px solid var(--md-sys-color-outline-variant)',
  color: '#FFF',
  fontSize: '14px',
  outline: 'none',
};
