import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Scale, 
  Activity, 
  Calendar, 
  FileText, 
  Trash2, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProgressView = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form states
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [notes, setNotes] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/metrics/my-metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Error al cargar métricas corporales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSaveMetric = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      await api.post('/metrics/my-metrics', {
        weight: parseFloat(weight),
        height: height ? parseFloat(height) : null,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        notes: notes || null
      });
      setShowModal(false);
      setNotes('');
      fetchMetrics();
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Error al guardar la medición.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMetric = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro de métrica?')) {
      try {
        await api.delete(`/metrics/${id}`);
        fetchMetrics();
      } catch (err) {
        alert('Error al eliminar registro');
      }
    }
  };

  // Latest and initial stats
  const latestMetric = metrics[0] || null;
  const initialMetric = metrics[metrics.length - 1] || null;
  const currentWeight = latestMetric ? latestMetric.weight : (user?.weight || 0);
  const initialWeight = initialMetric ? initialMetric.weight : currentWeight;
  const weightDiff = currentWeight && initialWeight ? Math.round((currentWeight - initialWeight) * 10) / 10 : 0;

  // BMI Category determination
  const bmiVal = latestMetric?.bmi || null;
  let bmiCategory = { label: 'Sin datos', color: 'var(--md-sys-color-tertiary)' };
  if (bmiVal) {
    if (bmiVal < 18.5) bmiCategory = { label: 'Bajo peso', color: '#90CAF9' };
    else if (bmiVal < 25.0) bmiCategory = { label: 'Peso Saludable', color: '#81C784' };
    else if (bmiVal < 30.0) bmiCategory = { label: 'Sobrepeso', color: '#FFB74D' };
    else bmiCategory = { label: 'Obesidad', color: '#E57373' };
  }

  // Generate SVG points for chart
  const chartData = [...metrics].reverse(); // chronological
  const renderChart = () => {
    if (chartData.length < 2) {
      return (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)', fontSize: '14px' }}>
          Registra al menos 2 mediciones para generar tu gráfica de tendencia.
        </div>
      );
    }

    const weights = chartData.map(d => d.weight);
    const minW = Math.floor(Math.min(...weights) - 2);
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const range = maxW - minW || 1;

    const width = 640;
    const height = 180;
    const padding = 36;

    const points = chartData.map((d, idx) => {
      const x = padding + (idx / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.weight - minW) / range) * (height - padding * 2);
      return { x, y, weight: d.weight, date: d.measured_at };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E8842" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6E8842" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />

          {/* Area fill */}
          <path d={areaD} fill="url(#metricGradient)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#89A854" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points & Tooltip Labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#DEEAC1" stroke="#4D602E" strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fill="#FFF"
                fontSize="11"
                fontWeight="700"
              >
                {p.weight} kg
              </text>
              <text
                x={p.x}
                y={height - 14}
                textAnchor="middle"
                fill="var(--md-sys-color-tertiary)"
                fontSize="10"
              >
                {new Date(p.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFF' }}>
            Mi Progreso Corporal
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
            Monitorea tu evolución de peso, índice de masa corporal y composición a lo largo del tiempo
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
            color: '#FFF',
            border: '1px solid rgba(137, 168, 84, 0.4)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
          }}
        >
          <Plus size={18} />
          Registrar Peso / Medición
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Card 1: Peso Actual */}
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
              Peso Actual
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
              <Scale size={18} color="var(--md-sys-color-secondary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFF' }}>
              {currentWeight || '--'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>kg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            {weightDiff > 0 ? (
              <span style={{ color: '#FFB74D', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowUpRight size={14} /> +{weightDiff} kg
              </span>
            ) : weightDiff < 0 ? (
              <span style={{ color: '#81C784', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowDownRight size={14} /> {weightDiff} kg
              </span>
            ) : (
              <span style={{ color: 'var(--md-sys-color-tertiary)', display: 'flex', alignItems: 'center' }}>
                <Minus size={14} /> Sin variación
              </span>
            )}
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>desde el inicio</span>
          </div>
        </div>

        {/* Card 2: IMC */}
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
              Índice de Masa Corporal (IMC)
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
              <Activity size={18} color="var(--md-sys-color-secondary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFF' }}>
              {bmiVal || '--'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>kg/m²</span>
          </div>
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: bmiCategory.color
            }}>
              {bmiCategory.label}
            </span>
          </div>
        </div>

        {/* Card 3: Grasa Corporal */}
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
              % Grasa Estimada
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
              <TrendingUp size={18} color="var(--md-sys-color-secondary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFF' }}>
              {latestMetric?.body_fat_percentage || '--'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>%</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {latestMetric?.muscle_mass ? `Masa magra: ${latestMetric.muscle_mass} kg` : 'Medición antropométrica'}
          </span>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="md-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--md-sys-color-primary-light)" />
            Evolución de Peso
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
            {metrics.length} {metrics.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
        {renderChart()}
      </div>

      {/* History Table */}
      <div className="md-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
          Historial de Mediciones
        </h3>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)' }}>
            Cargando historial...
          </div>
        ) : metrics.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No hay mediciones registradas aún. Haz clic en "Registrar Peso / Medición" para comenzar.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'left', color: 'var(--md-sys-color-tertiary)' }}>
                  <th style={{ padding: '12px' }}>Fecha</th>
                  <th style={{ padding: '12px' }}>Peso (kg)</th>
                  <th style={{ padding: '12px' }}>Altura (cm)</th>
                  <th style={{ padding: '12px' }}>IMC</th>
                  <th style={{ padding: '12px' }}>% Grasa</th>
                  <th style={{ padding: '12px' }}>Notas</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', color: '#FFF', fontWeight: 600 }}>
                      {new Date(m.measured_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--md-sys-color-secondary)', fontWeight: 700 }}>
                      {m.weight} kg
                    </td>
                    <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface)' }}>
                      {m.height || '--'}
                    </td>
                    <td style={{ padding: '12px', color: '#FFF' }}>
                      {m.bmi || '--'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface)' }}>
                      {m.body_fat_percentage ? `${m.body_fat_percentage}%` : '--'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', maxWidth: '200px' }}>
                      {m.notes || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteMetric(m.id)}
                        title="Eliminar medición"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--md-sys-color-outline)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--md-sys-color-error)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--md-sys-color-outline)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Metric */}
      {showModal && (
        <div style={modalBackdropStyle} onClick={() => setShowModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginBottom: '6px' }}>
              Registrar Nueva Medición
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', marginBottom: '20px' }}>
              Ingresa tus datos corporales para actualizar tu gráfica de evolución.
            </p>

            {saveError && (
              <div style={{
                backgroundColor: 'rgba(255, 180, 171, 0.15)',
                border: '1px solid rgba(255, 180, 171, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--md-sys-color-error)',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveMetric} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Peso Actual (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ej: 78.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Altura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej: 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
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
                    placeholder="Ej: 18.2"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Masa Muscular kg (Opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 35.0"
                    value={muscleMass}
                    onChange={(e) => setMuscleMass(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas u Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej: Medición matutina en ayunas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                    color: '#FFF',
                    border: '1px solid rgba(137, 168, 84, 0.4)',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar Medición'}
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
