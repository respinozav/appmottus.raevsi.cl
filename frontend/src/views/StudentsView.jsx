import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Copy, 
  Check, 
  Users, 
  Phone, 
  Scale, 
  TrendingUp, 
  Activity, 
  Dumbbell, 
  Flame, 
  Award
} from 'lucide-react';
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

  // Student Progress & History Modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStudent, setProgressStudent] = useState(null);
  const [progressActiveTab, setProgressActiveTab] = useState('body'); // 'body' | 'strength'
  
  // Body metrics tab state
  const [studentMetrics, setStudentMetrics] = useState([]);
  const [loadingStudentMetrics, setLoadingStudentMetrics] = useState(false);

  // Strength 1RM tab state
  const [loggedExercises, setLoggedExercises] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [strengthAnalysis, setStrengthAnalysis] = useState(null);
  const [loadingStrength, setLoadingStrength] = useState(false);

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
    // Load all exercises list for dropdown fallback
    api.get('/exercises/').then(res => setAllExercises(res.data)).catch(console.error);
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

  // Open Progress / History Modal
  const handleOpenProgressModal = async (student) => {
    setProgressStudent(student);
    setShowProgressModal(true);
    setProgressActiveTab('body');
    setLoadingStudentMetrics(true);

    try {
      // 1. Fetch body metrics
      const mRes = await api.get(`/metrics/student/${student.id}`);
      setStudentMetrics(mRes.data);

      // 2. Fetch logged exercises
      const exRes = await api.get(`/analytics/student-logged-exercises/${student.id}`);
      setLoggedExercises(exRes.data);

      if (exRes.data.length > 0) {
        setSelectedExerciseId(exRes.data[0].id);
        loadStrengthAnalysis(student.id, exRes.data[0].id);
      } else if (allExercises.length > 0) {
        setSelectedExerciseId(allExercises[0].id);
        loadStrengthAnalysis(student.id, allExercises[0].id);
      }
    } catch (err) {
      console.error('Error al cargar progreso del alumno:', err);
    } finally {
      setLoadingStudentMetrics(false);
    }
  };

  const loadStrengthAnalysis = async (studentId, exerciseId) => {
    if (!exerciseId) return;
    setLoadingStrength(true);
    try {
      const res = await api.get(`/analytics/exercise-history/${studentId}/${exerciseId}`);
      setStrengthAnalysis(res.data);
    } catch (err) {
      console.error('Error al cargar análisis de fuerza:', err);
      setStrengthAnalysis(null);
    } finally {
      setLoadingStrength(false);
    }
  };

  const handleSelectExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    if (progressStudent) {
      loadStrengthAnalysis(progressStudent.id, exerciseId);
    }
  };

  // Render SVG Body Metrics Chart
  const renderBodyChart = () => {
    const chartData = [...studentMetrics].reverse();
    if (chartData.length < 2) {
      return (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)', fontSize: '13px' }}>
          Registra al menos 2 mediciones antropométricas para trazar la curva de peso.
        </div>
      );
    }

    const weights = chartData.map(d => d.weight);
    const minW = Math.floor(Math.min(...weights) - 2);
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const range = maxW - minW || 1;

    const width = 620;
    const height = 170;
    const padding = 34;

    const points = chartData.map((d, idx) => {
      const x = padding + (idx / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.weight - minW) / range) * (height - padding * 2);
      return { x, y, weight: d.weight, date: d.measured_at };
    });

    const pathD = points.reduce((acc, p, idx) => idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="studentBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E8842" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6E8842" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />
          <path d={areaD} fill="url(#studentBodyGrad)" />
          <path d={pathD} fill="none" stroke="#89A854" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#DEEAC1" stroke="#4D602E" strokeWidth="2" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#DEEAC1" fontSize="10.5" fontWeight="700">
                {p.weight}kg
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Render SVG 1RM & Max Weight Strength Chart
  const renderStrengthChart = () => {
    if (!strengthAnalysis || strengthAnalysis.sessions.length === 0) {
      return (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)', fontSize: '13px' }}>
          El alumno aún no ha registrado series de peso para este ejercicio.
        </div>
      );
    }

    const sessions = strengthAnalysis.sessions;
    if (sessions.length < 2) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#DEEAC1', fontSize: '13px' }}>
          Registrado 1 entrenamiento: Carga Máx {sessions[0].max_weight}kg | 1RM Epley: {sessions[0].max_estimated_1rm}kg.
          Se requieren al menos 2 sesiones para graficar la curva de tendencia.
        </div>
      );
    }

    const allValues = sessions.flatMap(s => [s.max_weight, s.max_estimated_1rm]);
    const minVal = Math.floor(Math.min(...allValues) * 0.9);
    const maxVal = Math.ceil(Math.max(...allValues) * 1.1) || 10;
    const range = maxVal - minVal || 1;

    const width = 640;
    const height = 180;
    const padding = 36;

    const points1RM = sessions.map((s, idx) => {
      const x = padding + (idx / (sessions.length - 1)) * (width - padding * 2);
      const y = height - padding - ((s.max_estimated_1rm - minVal) / range) * (height - padding * 2);
      return { x, y, val: s.max_estimated_1rm, date: s.date };
    });

    const pointsWeight = sessions.map((s, idx) => {
      const x = padding + (idx / (sessions.length - 1)) * (width - padding * 2);
      const y = height - padding - ((s.max_weight - minVal) / range) * (height - padding * 2);
      return { x, y, val: s.max_weight, date: s.date };
    });

    const path1RM = points1RM.reduce((acc, p, idx) => idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');
    const pathWeight = pointsWeight.reduce((acc, p, idx) => idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Legend */}
          <g transform={`translate(${padding}, 16)`}>
            <line x1="0" y1="0" x2="16" y2="0" stroke="#FFB74D" strokeWidth="2.5" />
            <circle cx="8" cy="0" r="3" fill="#FFB74D" />
            <text x="22" y="3.5" fill="#FFB74D" fontSize="11" fontWeight="700">1RM Estimado (Epley)</text>

            <line x1="160" y1="0" x2="176" y2="0" stroke="#89A854" strokeWidth="2.5" />
            <circle cx="168" cy="0" r="3" fill="#89A854" />
            <text x="182" y="3.5" fill="#DEEAC1" fontSize="11" fontWeight="700">Peso Máx Levantado</text>
          </g>

          {/* Grid */}
          <line x1={padding} y1={padding + 10} x2={width - padding} y2={padding + 10} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2 + 10} x2={width - padding} y2={height / 2 + 10} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />

          {/* 1RM Line (Orange) */}
          <path d={path1RM} fill="none" stroke="#FFB74D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points1RM.map((p, i) => (
            <g key={`1rm-${i}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#FFB74D" stroke="#0D110E" strokeWidth="1.5" />
              <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#FFB74D" fontSize="10" fontWeight="700">
                {p.val}kg
              </text>
            </g>
          ))}

          {/* Max Weight Line (Green) */}
          <path d={pathWeight} fill="none" stroke="#89A854" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pointsWeight.map((p, i) => (
            <g key={`w-${i}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#DEEAC1" stroke="#4D602E" strokeWidth="1.5" />
              <text x={p.x} y={p.y + 14} textAnchor="middle" fill="#DEEAC1" fontSize="9.5">
                {p.val}kg
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="view-title">
          Gestión de Alumnos & Registro por RUT
        </h1>
        <p className="view-subtitle">
          Administra altas por RUT, registra evaluaciones antropométricas y analiza la evolución de fuerza (1RM) de cada alumno
        </p>
      </div>

      <div className="responsive-grid-split">
        {/* Left Column: Invite Generator Card */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '24px',
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
              <label style={labelStyle}>RUT del Alumno *</label>
              <input
                type="text"
                required
                placeholder="Ej: 12345678-9 o 12.345.678-9"
                value={rutInput}
                onChange={(e) => setRutInput(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
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
              <UserPlus size={18} />
              {generating ? 'Generando Enlace...' : 'Generar Enlace de Activación'}
            </button>
          </form>

          {generatedInvite && (
            <div style={{
              marginTop: '20px',
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
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '6px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <span><strong>RUT:</strong> {student.rut}</span>
                      {student.phone && <span><strong>Tel:</strong> {student.phone}</span>}
                      {student.weight && <span><strong>Peso:</strong> {student.weight} kg</span>}
                      {student.height && <span><strong>Estatura:</strong> {student.height} cm</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {student.is_registered && (
                      <>
                        {/* Ver Progreso / Historial Button */}
                        <button
                          onClick={() => handleOpenProgressModal(student)}
                          title="Ver historial antropométrico y de fuerza 1RM"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(110, 136, 66, 0.25)',
                            border: '1px solid rgba(137, 168, 84, 0.5)',
                            color: '#DEEAC1',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          <TrendingUp size={14} />
                          Ver Progreso / Historial
                        </button>

                        {/* Evaluar Métricas Button */}
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
                            backgroundColor: 'transparent',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Scale size={14} />
                          Evaluar
                        </button>
                      </>
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

      {/* Modal: Student Progress & Strength History (Coach View) */}
      {showProgressModal && progressStudent && (
        <div style={modalBackdropStyle} onClick={() => setShowProgressModal(false)}>
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Ficha de Rendimiento & Evolución
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF' }}>
                  {progressStudent.name} ({progressStudent.rut})
                </h2>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-outline)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Inner Tabs: Body vs Strength */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setProgressActiveTab('body')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  backgroundColor: progressActiveTab === 'body' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: progressActiveTab === 'body' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                <Scale size={16} />
                Evolución Corporal ({studentMetrics.length} mediciones)
              </button>

              <button
                onClick={() => setProgressActiveTab('strength')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  backgroundColor: progressActiveTab === 'strength' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: progressActiveTab === 'strength' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                <Dumbbell size={16} />
                Evolución de Fuerza & 1RM
              </button>
            </div>

            {/* TAB 1: BODY METRICS */}
            {progressActiveTab === 'body' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {loadingStudentMetrics ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-tertiary)' }}>
                    Cargando métricas corporales...
                  </div>
                ) : (
                  <>
                    <div className="md-card" style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#DEEAC1', marginBottom: '12px' }}>
                        Curva de Peso Corporal (kg)
                      </h4>
                      {renderBodyChart()}
                    </div>

                    {/* Table of measurements */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--md-sys-color-tertiary)' }}>
                            <th style={{ padding: '8px' }}>Fecha</th>
                            <th style={{ padding: '8px' }}>Peso</th>
                            <th style={{ padding: '8px' }}>IMC</th>
                            <th style={{ padding: '8px' }}>% Grasa</th>
                            <th style={{ padding: '8px' }}>Masa Muscular</th>
                            <th style={{ padding: '8px' }}>Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentMetrics.map((m) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px', color: '#FFF' }}>
                                {new Date(m.measured_at).toLocaleDateString('es-CL')}
                              </td>
                              <td style={{ padding: '8px', fontWeight: 700, color: '#DEEAC1' }}>
                                {m.weight} kg
                              </td>
                              <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {m.bmi ? `${m.bmi} kg/m²` : '-'}
                              </td>
                              <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {m.body_fat_percentage ? `${m.body_fat_percentage}%` : '-'}
                              </td>
                              <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {m.muscle_mass ? `${m.muscle_mass} kg` : '-'}
                              </td>
                              <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {m.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: STRENGTH & 1RM ANALYSIS */}
            {progressActiveTab === 'strength' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Exercise Selector */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                    Selecciona Ejercicio:
                  </label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => handleSelectExercise(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', minWidth: '240px' }}
                  >
                    {loggedExercises.length > 0 ? (
                      loggedExercises.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.logs_count} registros)
                        </option>
                      ))
                    ) : (
                      allExercises.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.category?.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {loadingStrength ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-tertiary)' }}>
                    Calculando 1RM e historial de fuerza...
                  </div>
                ) : strengthAnalysis ? (
                  <>
                    {/* PR Stats Cards */}
                    <div className="responsive-kpi-grid">
                      <div className="md-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>RÉCORD ESTIMADO (1RM)</span>
                          <Flame size={16} color="#FFB74D" />
                        </div>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFB74D' }}>
                          {strengthAnalysis.all_time_best_1rm} kg
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>Fórmula Epley</span>
                      </div>

                      <div className="md-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>PESO MÁXIMO LEVANTADO</span>
                          <Award size={16} color="var(--md-sys-color-secondary)" />
                        </div>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#DEEAC1' }}>
                          {strengthAnalysis.all_time_max_weight} kg
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>Carga real directa</span>
                      </div>

                      <div className="md-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>VOLUMEN TOTAL ACUMULADO</span>
                          <Activity size={16} color="#90CAF9" />
                        </div>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFF' }}>
                          {strengthAnalysis.total_volume_lifted} kg
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>Suma de (peso x reps)</span>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="md-card" style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '12px' }}>
                        Evolución de Cargas & 1RM: {strengthAnalysis.exercise_name}
                      </h4>
                      {renderStrengthChart()}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-tertiary)' }}>
                    No hay datos de fuerza registrados para este ejercicio.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Coach records evaluation for student */}
      {showMetricModal && selectedStudentForMetric && (
        <div style={modalBackdropStyle} onClick={() => setShowMetricModal(false)}>
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
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

              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
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
  boxSizing: 'border-box'
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
