import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Scale, 
  Activity, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Dumbbell,
  Flame,
  Award,
  Utensils,
  Droplets,
  Footprints,
  Moon,
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Eye,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProgressView = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('body'); // 'body' | 'strength' | 'habits'

  // Body metrics states
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

  // Perímetros y Fotos
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [photoFront, setPhotoFront] = useState('');
  const [photoSide, setPhotoSide] = useState('');
  const [photoBack, setPhotoBack] = useState('');

  // Comparador Antes vs Después
  const [compareIdA, setCompareIdA] = useState('');
  const [compareIdB, setCompareIdB] = useState('');

  // Strength / 1RM states
  const [loggedExercises, setLoggedExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [strengthAnalysis, setStrengthAnalysis] = useState(null);
  const [loadingStrength, setLoadingStrength] = useState(false);

  // Daily Habits states
  const [habitsHistory, setHabitsHistory] = useState([]);
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [habitForm, setHabitForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    kcal_consumed: '',
    protein_grams: '',
    water_liters: '',
    steps: '',
    sleep_hours: '',
    notes: ''
  });
  const [savingHabit, setSavingHabit] = useState(false);
  const [habitMsg, setHabitMsg] = useState({ type: '', text: '' });

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/metrics/my-metrics');
      setMetrics(res.data);
      if (res.data.length > 0) {
        setCompareIdB(prev => prev || res.data[0].id);
        setCompareIdA(prev => prev || res.data[res.data.length - 1].id);
      }
    } catch (err) {
      console.error('Error al cargar métricas corporales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoggedExercises = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/analytics/student-logged-exercises/${user.id}`);
      setLoggedExercises(res.data);
      if (res.data.length > 0) {
        setSelectedExerciseId(res.data[0].id);
        loadStrengthData(res.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar ejercicios del alumno:', err);
    }
  };

  const loadStrengthData = async (exerciseId) => {
    if (!exerciseId || !user?.id) return;
    setLoadingStrength(true);
    try {
      const res = await api.get(`/analytics/exercise-history/${user.id}/${exerciseId}`);
      setStrengthAnalysis(res.data);
    } catch (err) {
      console.error('Error al cargar datos de fuerza:', err);
      setStrengthAnalysis(null);
    } finally {
      setLoadingStrength(false);
    }
  };

  const fetchHabits = async () => {
    if (!user?.id) return;
    setLoadingHabits(true);
    try {
      const res = await api.get(`/metrics/habits/${user.id}`);
      setHabitsHistory(res.data);
      // Pre-cargar valores de hoy si ya existen
      const today = new Date().toISOString().split('T')[0];
      const todayHabit = res.data.find(h => h.log_date === today);
      if (todayHabit) {
        setHabitForm({
          log_date: todayHabit.log_date,
          kcal_consumed: todayHabit.kcal_consumed ?? '',
          protein_grams: todayHabit.protein_grams ?? '',
          water_liters: todayHabit.water_liters ?? '',
          steps: todayHabit.steps ?? '',
          sleep_hours: todayHabit.sleep_hours ?? '',
          notes: todayHabit.notes ?? ''
        });
      }
    } catch (err) {
      console.error('Error al cargar hábitos diarios:', err);
    } finally {
      setLoadingHabits(false);
    }
  };

  const handleSaveHabit = async (e) => {
    e.preventDefault();
    setSavingHabit(true);
    setHabitMsg({ type: '', text: '' });

    try {
      const payload = {
        log_date: habitForm.log_date || new Date().toISOString().split('T')[0],
        kcal_consumed: habitForm.kcal_consumed !== '' ? parseInt(habitForm.kcal_consumed) : null,
        protein_grams: habitForm.protein_grams !== '' ? parseInt(habitForm.protein_grams) : null,
        water_liters: habitForm.water_liters !== '' ? parseFloat(habitForm.water_liters) : null,
        steps: habitForm.steps !== '' ? parseInt(habitForm.steps) : null,
        sleep_hours: habitForm.sleep_hours !== '' ? parseFloat(habitForm.sleep_hours) : null,
        notes: habitForm.notes.trim() || null
      };

      await api.post('/metrics/habits', payload);
      setHabitMsg({ type: 'success', text: '¡Hábitos del día registrados con éxito!' });
      fetchHabits();
      setTimeout(() => setHabitMsg({ type: '', text: '' }), 2500);
    } catch (err) {
      setHabitMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Error al guardar hábitos diarios.'
      });
    } finally {
      setSavingHabit(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLoggedExercises();
    fetchHabits();
  }, [user?.id]);

  const handleSelectExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    loadStrengthData(exerciseId);
  };

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
        waist_cm: waist ? parseFloat(waist) : null,
        hip_cm: hip ? parseFloat(hip) : null,
        chest_cm: chest ? parseFloat(chest) : null,
        arm_cm: arm ? parseFloat(arm) : null,
        thigh_cm: thigh ? parseFloat(thigh) : null,
        photo_front_url: photoFront.trim() || null,
        photo_side_url: photoSide.trim() || null,
        photo_back_url: photoBack.trim() || null,
        notes: notes || null
      });
      setShowModal(false);
      setNotes('');
      setWaist('');
      setHip('');
      setChest('');
      setArm('');
      setThigh('');
      setPhotoFront('');
      setPhotoSide('');
      setPhotoBack('');
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
        console.error('Error al eliminar registro:', err);
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

  // Generate SVG points for body chart
  const chartData = [...metrics].reverse();
  const renderBodyChart = () => {
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

    const pathD = points.reduce((acc, p, idx) => idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');
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

          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />

          <path d={areaD} fill="url(#metricGradient)" />
          <path d={pathD} fill="none" stroke="#89A854" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#DEEAC1" stroke="#4D602E" strokeWidth="2.5" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="700">
                {p.weight} kg
              </text>
              <text x={p.x} y={height - 14} textAnchor="middle" fill="var(--md-sys-color-tertiary)" fontSize="10">
                {new Date(p.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Render SVG 1RM Strength Chart
  const renderStrengthChart = () => {
    if (!strengthAnalysis || strengthAnalysis.sessions.length === 0) {
      return (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)', fontSize: '13px' }}>
          Aún no tienes series guardadas para este ejercicio. Completa tu rutina en "Mis Rutinas" para ver tu progreso.
        </div>
      );
    }

    const sessions = strengthAnalysis.sessions;
    if (sessions.length < 2) {
      return (
        <div style={{ padding: '28px', textAlign: 'center', color: '#DEEAC1', fontSize: '13.5px' }}>
          1 sesión completada: Carga Máxima {sessions[0].max_weight}kg | 1RM Estimado: {sessions[0].max_estimated_1rm}kg.
          Se requieren al menos 2 sesiones para graficar la línea de tendencia.
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
            <text x="182" y="3.5" fill="#DEEAC1" fontSize="11" fontWeight="700">Carga Máxima Real</text>
          </g>

          {/* Grid lines */}
          <line x1={padding} y1={padding + 12} x2={width - padding} y2={padding + 12} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
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
              <text x={p.x} y={height - 12} textAnchor="middle" fill="var(--md-sys-color-tertiary)" fontSize="9">
                {new Date(p.date + 'T12:00:00Z').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
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
      <div className="view-header">
        <div>
          <h1 className="view-title">
            Mi Progreso & Rendimiento
          </h1>
          <p className="view-subtitle">
            Monitorea tu composición corporal y analiza tu progresión de fuerza máxima (1RM Epley)
          </p>
        </div>

        {(activeSubTab === 'body' || activeSubTab === 'photos') && (
          <div className="view-actions">
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 22px',
                minHeight: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                color: '#FFF',
                border: '1px solid rgba(137, 168, 84, 0.4)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)',
                width: '100%'
              }}
            >
              <Plus size={18} />
              Registrar Medición / Fotos
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs: Composición Corporal vs Mi Fuerza / RMs vs Hábitos vs Fotos */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        paddingBottom: '12px',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveSubTab('body')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            backgroundColor: activeSubTab === 'body' ? 'var(--md-sys-color-primary)' : 'transparent',
            color: activeSubTab === 'body' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'body' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
          }}
        >
          <Scale size={18} />
          Composición Corporal
        </button>

        <button
          onClick={() => setActiveSubTab('strength')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            backgroundColor: activeSubTab === 'strength' ? 'var(--md-sys-color-primary)' : 'transparent',
            color: activeSubTab === 'strength' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'strength' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
          }}
        >
          <Dumbbell size={18} />
          Mi Fuerza / RMs (1RM)
        </button>

        <button
          onClick={() => setActiveSubTab('habits')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            backgroundColor: activeSubTab === 'habits' ? 'var(--md-sys-color-primary)' : 'transparent',
            color: activeSubTab === 'habits' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'habits' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
          }}
        >
          <Utensils size={18} />
          Hábitos & Nutrición
        </button>

        <button
          onClick={() => setActiveSubTab('photos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            backgroundColor: activeSubTab === 'photos' ? 'var(--md-sys-color-primary)' : 'transparent',
            color: activeSubTab === 'photos' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'photos' ? '0 2px 10px rgba(110, 136, 66, 0.35)' : 'none'
          }}
        >
          <Camera size={18} />
          Fotos & Comparador
        </button>
      </div>

      {/* TAB 1: COMPOSICIÓN CORPORAL */}
      {activeSubTab === 'body' && (
        <>
          {/* KPI Cards */}
          <div className="responsive-kpi-grid" style={{ marginBottom: '28px' }}>
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
                Evolución de Peso Corporal
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                {metrics.length} {metrics.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            {renderBodyChart()}
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
              <div className="scroll-touch-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'left', color: 'var(--md-sys-color-tertiary)' }}>
                      <th style={{ padding: '12px' }}>Fecha</th>
                      <th style={{ padding: '12px' }}>Peso (kg)</th>
                      <th style={{ padding: '12px' }}>Altura (cm)</th>
                      <th style={{ padding: '12px' }}>IMC</th>
                      <th style={{ padding: '12px' }}>% Grasa</th>
                      <th style={{ padding: '12px' }}>Perímetros (cm)</th>
                      <th style={{ padding: '12px' }}>Fotos</th>
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
                        <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface)', fontSize: '12px' }}>
                          {(m.waist_cm || m.hip_cm || m.chest_cm || m.arm_cm || m.thigh_cm) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {m.waist_cm && <span>Cint: {m.waist_cm}cm</span>}
                              {m.hip_cm && <span>Cad: {m.hip_cm}cm</span>}
                              {m.chest_cm && <span>Pech: {m.chest_cm}cm</span>}
                              {m.arm_cm && <span>Braz: {m.arm_cm}cm</span>}
                              {m.thigh_cm && <span>Musl: {m.thigh_cm}cm</span>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--md-sys-color-tertiary)' }}>--</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {(m.photo_front_url || m.photo_side_url || m.photo_back_url) ? (
                            <button
                              onClick={() => {
                                setCompareIdB(m.id);
                                setActiveSubTab('photos');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(110, 136, 66, 0.25)',
                                color: '#DEEAC1',
                                border: '1px solid rgba(137, 168, 84, 0.3)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Camera size={12} /> Ver fotos
                            </button>
                          ) : (
                            <span style={{ color: 'var(--md-sys-color-tertiary)', fontSize: '12px' }}>Sin fotos</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', maxWidth: '180px' }}>
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
        </>
      )}

      {/* TAB 2: MI FUERZA / 1RM */}
      {activeSubTab === 'strength' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Exercise Selector */}
          <div className="md-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
                Progresión de Fuerza por Ejercicio
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                Fórmula de Epley para 1RM: Peso x (1 + Reps/30)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                Ejercicio:
              </label>
              <select
                value={selectedExerciseId}
                onChange={(e) => handleSelectExercise(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  color: '#FFF',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '220px'
                }}
              >
                {loggedExercises.length === 0 ? (
                  <option value="">Sin ejercicios con registros aún</option>
                ) : (
                  loggedExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {loadingStrength ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)' }}>
              Calculando historial de fuerza y 1RM...
            </div>
          ) : strengthAnalysis ? (
            <>
              {/* Strength KPIs */}
              <div className="responsive-kpi-grid">
                <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      RÉCORD ESTIMADO (1RM)
                    </span>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255, 183, 77, 0.2)' }}>
                      <Flame size={18} color="#FFB74D" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFB74D' }}>
                      {strengthAnalysis.all_time_best_1rm}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>kg</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Mejor marca teórica lograda
                  </span>
                </div>

                <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      CARGA MÁXIMA REAL
                    </span>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
                      <Award size={18} color="var(--md-sys-color-secondary)" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#DEEAC1' }}>
                      {strengthAnalysis.all_time_max_weight}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>kg</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Mayor peso efectivo levantado
                  </span>
                </div>

                <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      VOLUMEN TOTAL ACUMULADO
                    </span>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(144, 202, 249, 0.2)' }}>
                      <Activity size={18} color="#90CAF9" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFF' }}>
                      {strengthAnalysis.total_volume_lifted}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>kg</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    En {strengthAnalysis.total_sessions_count} sesiones completadas
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="md-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF' }}>
                    Curva de Progresión: {strengthAnalysis.exercise_name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                    {strengthAnalysis.sessions.length} sesiones registradas
                  </span>
                </div>
                {renderStrengthChart()}
              </div>

              {/* Session breakdown list */}
              <div className="md-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
                  Desglose de Series por Sesión
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {strengthAnalysis.sessions.map((sess, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--md-sys-color-surface-variant)',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#FFF', fontSize: '14px' }}>{sess.routine_title}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', marginLeft: '10px' }}>
                            {new Date(sess.date + 'T12:00:00Z').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#FFB74D', fontWeight: 700 }}>
                          1RM Máx: {sess.max_estimated_1rm} kg
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {sess.sets.map((setPoint, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              fontSize: '11.5px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: '#DEEAC1',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            Serie {setPoint.set_number}: {setPoint.actual_weight}kg x {setPoint.actual_reps} reps
                            {setPoint.actual_rpe ? ` (RPE ${setPoint.actual_rpe})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="md-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Completa tus entrenamientos serie por serie en "Mis Rutinas" para empezar a generar tu historial de fuerza.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HÁBITOS & NUTRICIÓN */}
      {activeSubTab === 'habits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Metas configuradas por el Coach */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--md-sys-color-primary-light)" />
              Mis Metas Diarias (Prescritas por el Coach)
            </h3>
            <div className="responsive-kpi-grid">
              <div className="md-card" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Calorías Objetivo</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#DEEAC1' }}>
                  {user?.daily_kcal_target ? `${user.daily_kcal_target} kcal` : 'Sin meta'}
                </span>
              </div>
              <div className="md-card" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Proteína Objetivo</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#DEEAC1' }}>
                  {user?.daily_protein_target ? `${user.daily_protein_target} g` : 'Sin meta'}
                </span>
              </div>
              <div className="md-card" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Agua Diaria</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#DEEAC1' }}>
                  {user?.daily_water_liters_target ? `${user.daily_water_liters_target} L` : 'Sin meta'}
                </span>
              </div>
              <div className="md-card" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Pasos Diarios</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#DEEAC1' }}>
                  {user?.daily_steps_target ? user.daily_steps_target.toLocaleString() : 'Sin meta'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario Registro de Hábitos del Día */}
          <div className="md-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  Registrar / Actualizar Hábitos Diarios
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Lleva control de tu ingesta calórica, macronutrientes, hidratación y descanso.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Fecha:</label>
                <input
                  type="date"
                  value={habitForm.log_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const existing = habitsHistory.find(h => h.log_date === newDate);
                    setHabitForm({
                      log_date: newDate,
                      kcal_consumed: existing ? (existing.kcal_consumed ?? '') : '',
                      protein_grams: existing ? (existing.protein_grams ?? '') : '',
                      water_liters: existing ? (existing.water_liters ?? '') : '',
                      steps: existing ? (existing.steps ?? '') : '',
                      sleep_hours: existing ? (existing.sleep_hours ?? '') : '',
                      notes: existing ? (existing.notes ?? '') : ''
                    });
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: '#FFF',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {habitMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: habitMsg.type === 'success' ? 'rgba(110, 136, 66, 0.2)' : 'rgba(255, 180, 171, 0.15)',
                color: habitMsg.type === 'success' ? '#DEEAC1' : 'var(--md-sys-color-error)',
                border: `1px solid ${habitMsg.type === 'success' ? 'rgba(110, 136, 66, 0.4)' : 'rgba(255, 180, 171, 0.3)'}`
              }}>
                {habitMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {habitMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveHabit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
                <div>
                  <label style={labelStyle}>🔥 Calorías Consumidas (kcal)</label>
                  <input
                    type="number"
                    step="10"
                    placeholder="Ej: 2350"
                    value={habitForm.kcal_consumed}
                    onChange={(e) => setHabitForm({ ...habitForm, kcal_consumed: e.target.value })}
                    style={inputStyle}
                  />
                  {user?.daily_kcal_target && habitForm.kcal_consumed && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--md-sys-color-primary-light)' }}>
                      {Math.round((parseInt(habitForm.kcal_consumed) / user.daily_kcal_target) * 100)}% de tu meta diaria ({user.daily_kcal_target} kcal)
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>🥩 Proteína Ingerida (gramos)</label>
                  <input
                    type="number"
                    step="5"
                    placeholder="Ej: 155"
                    value={habitForm.protein_grams}
                    onChange={(e) => setHabitForm({ ...habitForm, protein_grams: e.target.value })}
                    style={inputStyle}
                  />
                  {user?.daily_protein_target && habitForm.protein_grams && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--md-sys-color-primary-light)' }}>
                      {Math.round((parseInt(habitForm.protein_grams) / user.daily_protein_target) * 100)}% de tu meta ({user.daily_protein_target} g)
                    </div>
                  )}
                </div>
              </div>

              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
                <div>
                  <label style={labelStyle}>💧 Agua Ingerida (Litros)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Ej: 2.5"
                    value={habitForm.water_liters}
                    onChange={(e) => setHabitForm({ ...habitForm, water_liters: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>👟 Pasos Caminados</label>
                  <input
                    type="number"
                    step="500"
                    placeholder="Ej: 8500"
                    value={habitForm.steps}
                    onChange={(e) => setHabitForm({ ...habitForm, steps: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
                <div>
                  <label style={labelStyle}>🌙 Horas de Sueño</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej: 7.5"
                    value={habitForm.sleep_hours}
                    onChange={(e) => setHabitForm({ ...habitForm, sleep_hours: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Notas / Sensaciones del Día</label>
                  <input
                    type="text"
                    placeholder="Ej: Buen nivel de energía, hidratación completa"
                    value={habitForm.notes}
                    onChange={(e) => setHabitForm({ ...habitForm, notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={savingHabit}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                    color: '#FFF',
                    border: '1px solid rgba(137, 168, 84, 0.4)',
                    fontWeight: 700,
                    cursor: savingHabit ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
                  }}
                >
                  {savingHabit ? 'Guardando...' : 'Guardar Hábitos del Día'}
                </button>
              </div>
            </form>
          </div>

          {/* Historial de Hábitos Anteriores */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '14px' }}>
              Historial de Hábitos Recientes ({habitsHistory.length} días)
            </h3>
            {loadingHabits ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--md-sys-color-tertiary)' }}>
                Cargando historial de hábitos...
              </div>
            ) : habitsHistory.length === 0 ? (
              <div className="md-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Aún no has registrado hábitos diarios. Completa el formulario de arriba para iniciar tu registro.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {habitsHistory.map((h) => (
                  <div
                    key={h.id}
                    className="md-card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFF', display: 'block' }}>
                        📅 {h.log_date}
                      </span>
                      {h.notes && (
                        <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                          "{h.notes}"
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                      {h.kcal_consumed !== null && (
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Calorías</span>
                          <span style={{ fontWeight: 700, color: '#DEEAC1' }}>{h.kcal_consumed} kcal</span>
                        </div>
                      )}
                      {h.protein_grams !== null && (
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Proteína</span>
                          <span style={{ fontWeight: 700, color: '#DEEAC1' }}>{h.protein_grams} g</span>
                        </div>
                      )}
                      {h.water_liters !== null && (
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Agua</span>
                          <span style={{ fontWeight: 700, color: '#DEEAC1' }}>{h.water_liters} L</span>
                        </div>
                      )}
                      {h.steps !== null && (
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Pasos</span>
                          <span style={{ fontWeight: 700, color: '#DEEAC1' }}>{h.steps.toLocaleString()}</span>
                        </div>
                      )}
                      {h.sleep_hours !== null && (
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Sueño</span>
                          <span style={{ fontWeight: 700, color: '#DEEAC1' }}>{h.sleep_hours} hrs</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FOTOS & COMPARADOR ANTES VS DESPUÉS */}
      {activeSubTab === 'photos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header & Date Selectors */}
          <div className="md-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#89A854" />
                  Comparador Visual Antes vs Después (Side-by-Side)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
                  Selecciona dos fechas de evaluación para contrastar fotografías y calcular diferencias exactas de masa y perímetros.
                </p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                  color: '#FFF',
                  border: '1px solid rgba(137, 168, 84, 0.4)',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Subir Fotos / Medición
              </button>
            </div>

            {metrics.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--md-sys-color-tertiary)' }}>
                No tienes mediciones registradas aún. Registra una medición con fotografías para utilizar el comparador.
              </div>
            ) : (
              <div className="responsive-grid-2col" style={{ gap: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#90CAF9', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Calendar size={14} /> Evaluación Inicial / "Antes" (A)
                  </label>
                  <select
                    value={compareIdA}
                    onChange={(e) => setCompareIdA(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-surface-variant)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      color: '#FFF',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  >
                    {metrics.map(m => (
                      <option key={`a-${m.id}`} value={m.id}>
                        {new Date(m.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} — {m.weight} kg {m.body_fat_percentage ? `(${m.body_fat_percentage}% grasa)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#81C784', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Calendar size={14} /> Evaluación Actual / "Después" (B)
                  </label>
                  <select
                    value={compareIdB}
                    onChange={(e) => setCompareIdB(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-surface-variant)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      color: '#FFF',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  >
                    {metrics.map(m => (
                      <option key={`b-${m.id}`} value={m.id}>
                        {new Date(m.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} — {m.weight} kg {m.body_fat_percentage ? `(${m.body_fat_percentage}% grasa)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Delta Comparisons and Photos */}
          {(() => {
            const metricA = metrics.find(m => m.id === compareIdA) || metrics[metrics.length - 1];
            const metricB = metrics.find(m => m.id === compareIdB) || metrics[0];

            if (!metricA || !metricB) return null;

            const calcDiff = (valB, valA, unit = '') => {
              if (valB === null || valB === undefined || valA === null || valA === undefined) return null;
              const diff = Math.round((valB - valA) * 10) / 10;
              const isZero = diff === 0;
              const isPositive = diff > 0;
              return {
                diff,
                text: `${isPositive ? '+' : ''}${diff} ${unit}`,
                color: isZero ? 'var(--md-sys-color-tertiary)' : isPositive ? '#FFB74D' : '#81C784'
              };
            };

            const diffWeight = calcDiff(metricB.weight, metricA.weight, 'kg');
            const diffFat = calcDiff(metricB.body_fat_percentage, metricA.body_fat_percentage, '%');
            const diffWaist = calcDiff(metricB.waist_cm, metricA.waist_cm, 'cm');
            const diffHip = calcDiff(metricB.hip_cm, metricA.hip_cm, 'cm');
            const diffChest = calcDiff(metricB.chest_cm, metricA.chest_cm, 'cm');
            const diffArm = calcDiff(metricB.arm_cm, metricA.arm_cm, 'cm');
            const diffThigh = calcDiff(metricB.thigh_cm, metricA.thigh_cm, 'cm');

            return (
              <>
                {/* KPI Deltas */}
                <div className="responsive-kpi-grid">
                  <div className="md-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>Δ PESO CORPORAL</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="kpi-delta-val" style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
                        {metricA.weight}kg → {metricB.weight}kg
                      </span>
                    </div>
                    {diffWeight && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: diffWeight.color }}>
                        {diffWeight.text}
                      </span>
                    )}
                  </div>

                  <div className="md-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>Δ GRASA CORPORAL</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="kpi-delta-val" style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
                        {metricA.body_fat_percentage ? `${metricA.body_fat_percentage}%` : '--'} → {metricB.body_fat_percentage ? `${metricB.body_fat_percentage}%` : '--'}
                      </span>
                    </div>
                    {diffFat && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: diffFat.color }}>
                        {diffFat.text}
                      </span>
                    )}
                  </div>

                  <div className="md-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>Δ CINTURA</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="kpi-delta-val" style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
                        {metricA.waist_cm ? `${metricA.waist_cm}cm` : '--'} → {metricB.waist_cm ? `${metricB.waist_cm}cm` : '--'}
                      </span>
                    </div>
                    {diffWaist && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: diffWaist.color }}>
                        {diffWaist.text}
                      </span>
                    )}
                  </div>

                  <div className="md-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>Δ CADERA</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="kpi-delta-val" style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
                        {metricA.hip_cm ? `${metricA.hip_cm}cm` : '--'} → {metricB.hip_cm ? `${metricB.hip_cm}cm` : '--'}
                      </span>
                    </div>
                    {diffHip && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: diffHip.color }}>
                        {diffHip.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Side-by-side Photo Comparison */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { label: 'Vista Frontal', photoA: metricA.photo_front_url, photoB: metricB.photo_front_url },
                    { label: 'Vista Lateral / Perfil', photoA: metricA.photo_side_url, photoB: metricB.photo_side_url },
                    { label: 'Vista Posterior / Espalda', photoA: metricA.photo_back_url, photoB: metricB.photo_back_url }
                  ].map((angle, idx) => (
                    <div key={idx} className="md-card" style={{ padding: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#DEEAC1', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={18} color="#89A854" />
                        {angle.label}
                      </h4>

                      <div className="responsive-grid-2col" style={{ gap: '20px' }}>
                        {/* Photo A */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#90CAF9' }}>
                            ANTES — {new Date(metricA.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} ({metricA.weight} kg)
                          </span>
                          <div style={{
                            width: '100%',
                            minHeight: '260px',
                            maxHeight: '400px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {angle.photoA ? (
                              <img
                                src={angle.photoA}
                                alt={`Foto ${angle.label} Antes`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div style={{
                              display: angle.photoA ? 'none' : 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              color: 'var(--md-sys-color-tertiary)',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              <ImageIcon size={36} opacity={0.4} />
                              <span style={{ fontSize: '12.5px' }}>Sin fotografía frontal registrada para esta fecha.</span>
                            </div>
                          </div>
                        </div>

                        {/* Photo B */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#81C784' }}>
                            DESPUÉS — {new Date(metricB.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} ({metricB.weight} kg)
                          </span>
                          <div style={{
                            width: '100%',
                            minHeight: '260px',
                            maxHeight: '400px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {angle.photoB ? (
                              <img
                                src={angle.photoB}
                                alt={`Foto ${angle.label} Después`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div style={{
                              display: angle.photoB ? 'none' : 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              color: 'var(--md-sys-color-tertiary)',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              <ImageIcon size={36} opacity={0.4} />
                              <span style={{ fontSize: '12.5px' }}>Sin fotografía para esta fecha de evaluación.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Perimeters Comparison Table */}
                <div className="md-card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
                    Tabla Comparativa de Perímetros Anatómicos
                  </h4>
                  <div className="scroll-touch-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'left', color: 'var(--md-sys-color-tertiary)' }}>
                          <th style={{ padding: '10px' }}>Medición</th>
                          <th style={{ padding: '10px' }}>Antes ({new Date(metricA.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })})</th>
                          <th style={{ padding: '10px' }}>Después ({new Date(metricB.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })})</th>
                          <th style={{ padding: '10px' }}>Variación Neta (Δ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Peso Corporal', a: metricA.weight ? `${metricA.weight} kg` : '--', b: metricB.weight ? `${metricB.weight} kg` : '--', diff: diffWeight },
                          { name: '% Grasa Corporal', a: metricA.body_fat_percentage ? `${metricA.body_fat_percentage}%` : '--', b: metricB.body_fat_percentage ? `${metricB.body_fat_percentage}%` : '--', diff: diffFat },
                          { name: 'Cintura', a: metricA.waist_cm ? `${metricA.waist_cm} cm` : '--', b: metricB.waist_cm ? `${metricB.waist_cm} cm` : '--', diff: diffWaist },
                          { name: 'Cadera', a: metricA.hip_cm ? `${metricA.hip_cm} cm` : '--', b: metricB.hip_cm ? `${metricB.hip_cm} cm` : '--', diff: diffHip },
                          { name: 'Pecho / Tórax', a: metricA.chest_cm ? `${metricA.chest_cm} cm` : '--', b: metricB.chest_cm ? `${metricB.chest_cm} cm` : '--', diff: diffChest },
                          { name: 'Brazo', a: metricA.arm_cm ? `${metricA.arm_cm} cm` : '--', b: metricB.arm_cm ? `${metricB.arm_cm} cm` : '--', diff: diffArm },
                          { name: 'Muslo', a: metricA.thigh_cm ? `${metricA.thigh_cm} cm` : '--', b: metricB.thigh_cm ? `${metricB.thigh_cm} cm` : '--', diff: diffThigh }
                        ].map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 10px', color: '#FFF', fontWeight: 600 }}>{row.name}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--md-sys-color-on-surface)' }}>{row.a}</td>
                            <td style={{ padding: '12px 10px', color: '#FFF', fontWeight: 700 }}>{row.b}</td>
                            <td style={{ padding: '12px 10px' }}>
                              {row.diff ? (
                                <span style={{ fontWeight: 700, color: row.diff.color }}>
                                  {row.diff.text}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--md-sys-color-tertiary)' }}>--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal: New Metric */}
      {showModal && (
        <div style={modalBackdropStyle} onClick={() => setShowModal(false)}>
          <div className="responsive-modal-box" style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
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
              <div className="responsive-grid-2col" style={{ gap: '14px' }}>
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
                  <label style={labelStyle}>Estatura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej: 178"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
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
                    placeholder="Ej: 15.2"
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

              {/* Perímetros Anatómicos (cm) */}
              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '16px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#DEEAC1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                  Perímetros Anatómicos (cm, Opcional)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Cintura</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 82"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Cadera</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 98"
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Pecho / Tórax</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 104"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Brazo</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 36"
                      value={arm}
                      onChange={(e) => setArm(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Muslo</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 58"
                      value={thigh}
                      onChange={(e) => setThigh(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Fotografías de Progreso (URLs) */}
              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#DEEAC1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                  Fotografías de Progreso (URLs, Opcional)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Foto Frontal (URL)</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fotos/frontal.jpg"
                      value={photoFront}
                      onChange={(e) => setPhotoFront(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Foto Lateral / Perfil (URL)</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fotos/lateral.jpg"
                      value={photoSide}
                      onChange={(e) => setPhotoSide(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Foto Posterior / Espalda (URL)</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fotos/espalda.jpg"
                      value={photoBack}
                      onChange={(e) => setPhotoBack(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas / Sensaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Medición en ayunas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
  maxWidth: '620px',
  maxHeight: '92vh',
  overflowY: 'auto',
  backgroundColor: 'var(--md-sys-color-surface)',
  borderRadius: '24px',
  border: '1px solid var(--md-sys-color-outline-variant)',
  padding: '28px 24px',
  boxShadow: 'var(--md-elevation-3)'
};
