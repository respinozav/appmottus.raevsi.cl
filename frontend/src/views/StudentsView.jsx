import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, ExternalLink, Users, Calendar, Phone, Weight, Ruler, Scale, TrendingUp, Trash2, Plus } from 'lucide-react';
import api from '../services/api';

export const StudentsView = () => {
  const [rutInput, setRutInput] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Evaluation modal states
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedStudentForMetric, setSelectedStudentForMetric] = useState(null);
  const [metricWeight, setMetricWeight] = useState('');
  const [metricHeight, setMetricHeight] = useState('');
  const [metricFat, setMetricFat] = useState('');
  const [metricMuscle, setMetricMuscle] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);
  const [metricError, setMetricError] = useState('');

  const handleRecordStudentMetric = async (e) => {
    e.preventDefault();
    if (!selectedStudentForMetric) return;
    setSavingMetric(true);
    setMetricError('');

    try {
      await api.post(`/metrics/student/${selectedStudentForMetric.id}`, {
        weight: parseFloat(metricWeight),
        height: metricHeight ? parseFloat(metricHeight) : null,
        body_fat_percentage: metricFat ? parseFloat(metricFat) : null,
        muscle_mass: metricMuscle ? parseFloat(metricMuscle) : null,
        notes: metricNotes || null
      });
      setShowMetricModal(false);
      setMetricNotes('');
      setMetricFat('');
      setMetricMuscle('');
      fetchStudents();
    } catch (err) {
      setMetricError(err.response?.data?.detail || 'Error al guardar la evaluación antropométrica.');
    } finally {
      setSavingMetric(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Error al cargar alumnos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    setCopied(false);
    try {
      const res = await api.post('/users/invite-by-rut', { rut: rutInput });
      setGeneratedInvite(res.data);
      setRutInput('');
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar enlace de registro.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFF' }}>
          Gestión de Alumnos & Registro por RUT
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
          Ingresa el RUT del alumno para generar su enlace único de activación y asignarle rutinas
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Invite Generator Card */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '28px',
          boxShadow: 'var(--md-elevation-1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={22} color="#FFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFF' }}>
                Invitar Nuevo Alumno
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Paso 1: Asignar RUT
              </span>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 180, 171, 0.15)',
              border: '1px solid rgba(255, 180, 171, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              color: 'var(--md-sys-color-error)',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
                RUT del Alumno *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 19876543-2"
                value={rutInput}
                onChange={(e) => setRutInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  color: '#FFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                color: '#FFF',
                border: '1px solid rgba(137, 168, 84, 0.4)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
              }}
            >
              <UserPlus size={16} />
              {generating ? 'Generando...' : 'Generar Enlace Único'}
            </button>
          </form>

          {/* Result Banner when link is generated */}
          {generatedInvite && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface-variant)',
              border: '1px solid var(--md-sys-color-secondary)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-sys-color-secondary)', display: 'block', marginBottom: '6px' }}>
                ¡Enlace generado para RUT: {generatedInvite.rut}!
              </span>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '12px' }}>
                Copia y envía este enlace al alumno para que active su cuenta completando su perfil.
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.registration_url}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <button
                  onClick={() => handleCopy(generatedInvite.registration_url)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: copied ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-primary)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Students List */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '28px',
          boxShadow: 'var(--md-elevation-1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={22} color="var(--md-sys-color-secondary)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFF' }}>
                Alumnos Registrados ({students.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-tertiary)' }}>
              Cargando lista de alumnos...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Aún no hay alumnos registrados. Ingresa un RUT a la izquierda para comenzar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {students.map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>
                        {student.name || 'Registro Pendiente'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: student.is_registered ? 'rgba(112, 130, 56, 0.25)' : 'rgba(255, 180, 171, 0.2)',
                        color: student.is_registered ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-error)',
                        border: student.is_registered ? '1px solid var(--md-sys-color-secondary)' : '1px solid var(--md-sys-color-error)'
                      }}>
                        {student.is_registered ? 'Activo' : 'Pendiente Activación'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <span><strong>RUT:</strong> {student.rut}</span>
                      {student.phone && <span><strong>Tel:</strong> {student.phone}</span>}
                      {student.weight && <span><strong>Peso:</strong> {student.weight} kg</span>}
                      {student.height && <span><strong>Estatura:</strong> {student.height} cm</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {student.is_registered && (
                      <button
                        onClick={() => {
                          setSelectedStudentForMetric(student);
                          setMetricWeight(student.weight || '');
                          setMetricHeight(student.height || '');
                          setShowMetricModal(true);
                        }}
                        title="Registrar evaluación antropométrica"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(110, 136, 66, 0.2)',
                          border: '1px solid rgba(137, 168, 84, 0.4)',
                          color: '#DEEAC1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <Scale size={14} />
                        Evaluar Métricas
                      </button>
                    )}

                    {!student.is_registered && student.registration_token && (
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/register?token=${student.registration_token}`)}
                        title="Copiar enlace de invitación"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          color: 'var(--md-sys-color-tertiary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <Copy size={14} />
                        Copiar Enlace
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Coach records evaluation for student */}
      {showMetricModal && selectedStudentForMetric && (
        <div style={modalBackdropStyle} onClick={() => setShowMetricModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
              Evaluación Antropométrica
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', marginBottom: '18px' }}>
              Registra el peso y composición corporal de <strong>{selectedStudentForMetric.name}</strong> ({selectedStudentForMetric.rut})
            </p>

            {metricError && (
              <div style={{
                backgroundColor: 'rgba(255, 180, 171, 0.15)',
                border: '1px solid rgba(255, 180, 171, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--md-sys-color-error)',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {metricError}
              </div>
            )}

            <form onSubmit={handleRecordStudentMetric} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Peso en Báscula (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={metricWeight}
                    onChange={(e) => setMetricWeight(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Estatura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={metricHeight}
                    onChange={(e) => setMetricHeight(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>% Grasa Corporal (Opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 16.5"
                    value={metricFat}
                    onChange={(e) => setMetricFat(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Masa Muscular kg (Opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 34.2"
                    value={metricMuscle}
                    onChange={(e) => setMetricMuscle(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas del Coach</label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación presencial, perímetro cintura 82cm"
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowMetricModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMetric}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                    color: '#FFF',
                    border: '1px solid rgba(137, 168, 84, 0.4)',
                    fontWeight: 700,
                    cursor: savingMetric ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
                  }}
                >
                  {savingMetric ? 'Guardando...' : 'Registrar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--md-sys-color-on-surface)',
  marginBottom: '6px'
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

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 5, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalBoxStyle = {
  width: '100%',
  maxWidth: '540px',
  backgroundColor: 'var(--md-sys-color-surface)',
  borderRadius: '24px',
  border: '1px solid var(--md-sys-color-outline-variant)',
  padding: '28px 24px',
  boxShadow: 'var(--md-elevation-3)'
};
