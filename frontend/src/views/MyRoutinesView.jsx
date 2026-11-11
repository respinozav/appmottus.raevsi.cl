import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  CheckCircle2, 
  Circle, 
  Play, 
  Dumbbell, 
  Send, 
  MessageSquare, 
  Save, 
  Activity, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  LayoutList, 
  CalendarDays,
  Timer,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  X
} from 'lucide-react';
import api from '../services/api';
import { VideoModal } from '../components/VideoModal';

export const MyRoutinesView = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [videoExercise, setVideoExercise] = useState(null);

  // View Mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState('list');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Floating Rest Timer (TrueCoach Rest Timer)
  const [restTimer, setRestTimer] = useState({
    active: false,
    totalSeconds: 60,
    remainingSeconds: 60,
    exerciseName: '',
    isPaused: false
  });

  // Expanded routine cards map: { [routineId]: boolean }
  const [expandedRoutines, setExpandedRoutines] = useState({});

  // Local log state map: { [`${routineExerciseId}_${setNumber}`]: { actual_weight, actual_reps, actual_rpe, is_completed, student_notes } }
  const [localLogs, setLocalLogs] = useState({});
  const [savingLogsRoutineId, setSavingLogsRoutineId] = useState(null);
  const [saveSuccessRoutineId, setSaveSuccessRoutineId] = useState(null);

  // Comments state: { [routineId]: RoutineComment[] }
  const [routineComments, setRoutineComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [sendingCommentRoutineId, setSendingCommentRoutineId] = useState(null);

  const fetchMyRoutines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/routines/my-routines');
      setRoutines(res.data);

      // Pre-fill local logs state from existing exercise_logs
      const initialLogs = {};
      const initialExpanded = {};
      const initialComments = {};

      res.data.forEach((r, rIdx) => {
        // Expand the most recent or unexecuted routine by default
        if (rIdx === 0 || !r.is_executed) {
          initialExpanded[r.id] = true;
        }

        if (r.comments) {
          initialComments[r.id] = r.comments;
        }

        r.routine_exercises?.forEach((re) => {
          const logs = re.exercise_logs || [];
          for (let s = 1; s <= re.series; s++) {
            const existing = logs.find(l => l.set_number === s);
            initialLogs[`${re.id}_${s}`] = {
              actual_weight: existing?.actual_weight ?? (re.target_weight ?? ''),
              actual_reps: existing?.actual_reps ?? '',
              actual_rpe: existing?.actual_rpe ?? (re.target_rpe ?? ''),
              is_completed: existing?.is_completed ?? false,
              student_notes: existing?.student_notes ?? ''
            };
          }
        });
      });

      setLocalLogs(initialLogs);
      setExpandedRoutines(prev => ({ ...initialExpanded, ...prev }));
      setRoutineComments(initialComments);
    } catch (err) {
      console.error('Error cargando rutinas del alumno:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRoutines();
  }, []);

  // Rest Timer Interval
  useEffect(() => {
    if (!restTimer.active || restTimer.isPaused || restTimer.remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev.remainingSeconds <= 1) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          } catch (e) {
            // Audio context unsupported
          }
          return { ...prev, remainingSeconds: 0, active: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.isPaused, restTimer.remainingSeconds]);

  const startRestTimer = (seconds = 60, exerciseName = '') => {
    const sec = seconds && seconds > 0 ? seconds : 60;
    setRestTimer({
      active: true,
      totalSeconds: sec,
      remainingSeconds: sec,
      exerciseName: exerciseName || 'Ejercicio',
      isPaused: false
    });
  };

  const toggleExpand = (routineId) => {
    setExpandedRoutines(prev => ({
      ...prev,
      [routineId]: !prev[routineId]
    }));
  };

  const handleLogChange = (routineExerciseId, setNum, field, value, restSeconds = 60, exName = '') => {
    const key = `${routineExerciseId}_${setNum}`;
    setLocalLogs(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));

    if (field === 'is_completed' && value === true) {
      startRestTimer(restSeconds, exName);
    }
  };

  const handleSaveRoutineLogs = async (routine) => {
    setSavingLogsRoutineId(routine.id);
    setSaveSuccessRoutineId(null);

    try {
      const logsPayload = [];
      routine.routine_exercises.forEach((re) => {
        for (let s = 1; s <= re.series; s++) {
          const entry = localLogs[`${re.id}_${s}`];
          if (entry) {
            logsPayload.push({
              routine_exercise_id: re.id,
              set_number: s,
              actual_weight: entry.actual_weight !== '' && entry.actual_weight !== null ? parseFloat(entry.actual_weight) : null,
              actual_reps: entry.actual_reps !== '' && entry.actual_reps !== null ? parseInt(entry.actual_reps) : null,
              actual_rpe: entry.actual_rpe !== '' && entry.actual_rpe !== null ? parseFloat(entry.actual_rpe) : null,
              is_completed: !!entry.is_completed,
              student_notes: entry.student_notes || null
            });
          }
        }
      });

      const res = await api.post(`/routines/${routine.id}/logs`, { logs: logsPayload });
      
      // Update routine in list
      setRoutines(prev => prev.map(r => r.id === routine.id ? res.data : r));
      setSaveSuccessRoutineId(routine.id);
      setTimeout(() => setSaveSuccessRoutineId(null), 3000);
    } catch (err) {
      console.error('Error al guardar series:', err);
      alert('Error al guardar el progreso de las series.');
    } finally {
      setSavingLogsRoutineId(null);
    }
  };

  const handleToggleExecution = async (routine) => {
    setUpdatingId(routine.id);
    try {
      const res = await api.patch(`/routines/${routine.id}/toggle-execution`, {
        is_executed: !routine.is_executed,
      });
      setRoutines(prev => prev.map(r => r.id === routine.id ? res.data : r));
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado de la rutina');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendRoutineComment = async (routineId) => {
    const text = newCommentText[routineId]?.trim();
    if (!text) return;
    setSendingCommentRoutineId(routineId);

    try {
      const res = await api.post(`/routines/${routineId}/comments`, { content: text });
      setRoutineComments(prev => ({
        ...prev,
        [routineId]: [...(prev[routineId] || []), res.data]
      }));
      setNewCommentText(prev => ({ ...prev, [routineId]: '' }));
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('No se pudo enviar el comentario.');
    } finally {
      setSendingCommentRoutineId(null);
    }
  };

  const getWeekDays = (offset = 0) => {
    const curr = new Date();
    const dayOfWeek = curr.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = new Date().toDateString() === d.toDateString();
      const dateStr = d.toISOString().split('T')[0];

      const daysRoutines = routines.filter(r => {
        const rDate = new Date(r.scheduled_at).toISOString().split('T')[0];
        return rDate === dateStr;
      });

      days.push({
        dateObj: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('es-CL', { month: 'short' }),
        isToday,
        routines: daysRoutines
      });
    }

    return days;
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            Mi Plan de Entrenamiento
          </h1>
          <p className="view-subtitle">
            Interactive Workout Logger: Registra tus cargas serie por serie, consulta cadencias (tempo) y chatea con tu Coach
          </p>
        </div>
      </div>

      {/* Mode Switcher: List vs Weekly Calendar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: viewMode === 'list' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: viewMode === 'list' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <LayoutList size={16} />
            Vista Lista ({routines.length})
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: viewMode === 'calendar' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: viewMode === 'calendar' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <CalendarDays size={16} />
            Calendario Semanal
          </button>
        </div>

        {viewMode === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Semana anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentWeekOffset(0)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: currentWeekOffset === 0 ? 'rgba(110, 136, 66, 0.25)' : 'rgba(255,255,255,0.06)',
                border: currentWeekOffset === 0 ? '1px solid rgba(137, 168, 84, 0.5)' : '1px solid var(--md-sys-color-outline-variant)',
                color: currentWeekOffset === 0 ? '#DEEAC1' : '#FFF',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Semana Actual
            </button>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Semana siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Weekly Calendar Grid (Alumno) */}
      {viewMode === 'calendar' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {getWeekDays(currentWeekOffset).map((day) => (
            <div
              key={day.dateStr}
              style={{
                backgroundColor: day.isToday ? 'rgba(110, 136, 66, 0.15)' : 'var(--md-sys-color-surface-variant)',
                borderRadius: '16px',
                border: day.isToday ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid var(--md-sys-color-outline-variant)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '240px',
                boxShadow: day.isToday ? '0 0 16px rgba(110, 136, 66, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: day.isToday ? 'var(--md-sys-color-primary-light)' : '#FFF' }}>
                    {day.dayName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    {day.dayNumber} {day.monthName}
                  </span>
                </div>
                {day.isToday && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(110, 136, 66, 0.3)',
                    color: '#DEEAC1',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(137, 168, 84, 0.5)'
                  }}>
                    HOY
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {day.routines.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--md-sys-color-outline)', fontSize: '12px' }}>
                    Descanso
                  </div>
                ) : (
                  day.routines.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setExpandedRoutines(prev => ({ ...prev, [r.id]: true }));
                        setViewMode('list');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: r.is_executed ? 'rgba(110, 136, 66, 0.25)' : 'rgba(0,0,0,0.35)',
                        border: r.is_executed ? '1px solid rgba(137, 168, 84, 0.5)' : '1px solid var(--md-sys-color-outline-variant)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {r.is_executed ? (
                          <CheckCircle2 size={13} color="var(--md-sys-color-secondary)" />
                        ) : (
                          <Circle size={13} color="var(--md-sys-color-outline)" />
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--md-sys-color-primary-light)', display: 'block' }}>
                        {r.routine_exercises?.length || 0} ejercicios · {r.is_executed ? 'Completada' : 'Toca para entrenar'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Routine Cards List (Visible in List Mode) */}
      {viewMode === 'list' && (
        loading ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-tertiary)' }}>
              Cargando tus rutinas personalizadas...
            </div>
          ) : routines.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 20px',
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '24px',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <Dumbbell size={52} color="var(--md-sys-color-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF' }}>Aún no tienes rutinas programadas</h3>
              <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '6px' }}>
                Tu Coach de Mottus Gym te asignará una sesión muy pronto. ¡Mantente atento!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {routines.map((routine) => {
            const isExpanded = !!expandedRoutines[routine.id];
            const dateObj = new Date(routine.scheduled_at);
            const dateFormatted = dateObj.toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const commentsList = routineComments[routine.id] || routine.comments || [];

            // Calculate completed sets progress
            let totalSets = 0;
            let completedSets = 0;
            routine.routine_exercises.forEach((re) => {
              for (let s = 1; s <= re.series; s++) {
                totalSets++;
                if (localLogs[`${re.id}_${s}`]?.is_completed) {
                  completedSets++;
                }
              }
            });
            const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

            return (
              <div
                key={routine.id}
                className="md-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  borderColor: routine.is_executed ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-outline-variant)',
                  backgroundColor: routine.is_executed ? 'rgba(20, 26, 20, 0.95)' : 'var(--md-sys-color-surface)'
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Calendar size={16} color="var(--md-sys-color-tertiary)" />
                      <span style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', textTransform: 'capitalize' }}>
                        {dateFormatted}
                      </span>
                      {routine.is_executed && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(110, 136, 66, 0.3)',
                          color: '#DEEAC1',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          ✔ Sesión Completada
                        </span>
                      )}
                      {routine.is_reviewed_by_coach && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(137, 168, 84, 0.25)',
                          color: '#DEEAC1',
                          border: '1px solid rgba(137, 168, 84, 0.5)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          ✔ V°B° Coach Revisado
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>
                      {routine.title}
                    </h2>
                    {routine.coach && (
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Coach: <strong>{routine.coach.name || 'Coach Mottus'}</strong>
                      </span>
                    )}

                    {/* Completion bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', maxWidth: '320px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#89A854', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#DEEAC1', fontWeight: 700 }}>
                        {completedSets}/{totalSets} series ({progressPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleToggleExecution(routine)}
                      disabled={updatingId === routine.id}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: routine.is_executed
                          ? 'rgba(141, 168, 88, 0.15)'
                          : 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                        border: routine.is_executed
                          ? '1px solid rgba(141, 168, 88, 0.4)'
                          : '1px solid rgba(137, 168, 84, 0.4)',
                        color: routine.is_executed ? 'var(--md-sys-color-primary-light)' : '#FFF',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: routine.is_executed ? 'none' : '0 4px 14px rgba(110, 136, 66, 0.4)'
                      }}
                    >
                      <CheckCircle size={16} />
                      {updatingId === routine.id
                        ? 'Actualizando...'
                        : routine.is_executed
                        ? 'Completada ✔'
                        : 'Marcar Ejecutada'}
                    </button>

                    <button
                      onClick={() => toggleExpand(routine.id)}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--md-sys-color-surface-variant)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        color: '#FFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={isExpanded ? 'Contraer rutina' : 'Expandir serie por serie'}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {routine.notes && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface)'
                  }}>
                    <strong>Indicación General del Coach:</strong> {routine.notes}
                  </div>
                )}

                {/* Exercises & Interactive Workout Logger */}
                {isExpanded && (() => {
                  const warmupExercises = routine.routine_exercises.filter(e => e.block_section === 'warmup');
                  const mainExercises = routine.routine_exercises.filter(e => !e.block_section || e.block_section === 'main');
                  const cooldownExercises = routine.routine_exercises.filter(e => e.block_section === 'cooldown');

                  const renderExerciseCard = (item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--md-sys-color-surface-variant)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                      {/* Exercise Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {item.superset_group && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '5px',
                                backgroundColor: 'rgba(110, 136, 66, 0.4)',
                                color: '#DEEAC1',
                                border: '1px solid rgba(137, 168, 84, 0.6)'
                              }}>
                                Superserie {item.superset_group}
                              </span>
                            )}
                            {item.workout_format && item.workout_format !== 'regular' && (
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                backgroundColor: 'rgba(234, 88, 12, 0.2)',
                                color: '#FDBA74',
                                border: '1px solid rgba(234, 88, 12, 0.4)'
                              }}>
                                {item.workout_format}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-sys-color-secondary)', textTransform: 'uppercase' }}>
                              {item.exercise?.category?.name || 'Ejercicio'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginTop: '4px', marginBottom: '2px' }}>
                            {item.exercise?.name}
                          </h4>

                          {/* TrueCoach In-situ Last Performance */}
                          {item.last_performance && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: 'rgba(217, 119, 6, 0.15)',
                              border: '1px solid rgba(217, 119, 6, 0.4)',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: '#FCD34D',
                              fontWeight: 600,
                              marginTop: '2px'
                            }}>
                              <Sparkles size={12} />
                              <span>Marca anterior: {item.last_performance}</span>
                            </div>
                          )}
                        </div>

                        {item.exercise && (
                          <button
                            onClick={() => setVideoExercise(item.exercise)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(110, 136, 66, 0.2)',
                              border: '1px solid rgba(137, 168, 84, 0.4)',
                              color: '#FFF',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Play size={14} />
                            Video de Técnica
                          </button>
                        )}
                      </div>

                      {/* Coach prescription banner */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px 14px',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}>
                        <span><strong>Prescripción:</strong> {item.series} Series x {item.repetitions}</span>
                        {item.target_weight && <span><strong>Peso Sugerido:</strong> {item.target_weight} kg</span>}
                        {item.target_rpe && <span><strong>RPE Obj:</strong> {item.target_rpe}</span>}
                        {item.tempo && <span><strong>Tempo/Cadencia:</strong> {item.tempo}</span>}
                        {item.rest_seconds && <span><strong>Descanso:</strong> {item.rest_seconds}s</span>}
                        {item.coach_notes && (
                          <div style={{ width: '100%', color: 'var(--md-sys-color-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>
                            💡 Indicación Coach: {item.coach_notes}
                          </div>
                        )}
                      </div>

                      {/* Interactive Series Table (Set by Set) */}
                      <div className="scroll-touch-container" style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="workout-logger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--md-sys-color-tertiary)' }}>
                              <th style={{ padding: '8px 4px', width: '36px' }}>#</th>
                              <th style={{ padding: '8px 4px' }}>Objetivo</th>
                              <th style={{ padding: '8px 4px', minWidth: '72px' }}>Peso (kg)</th>
                              <th style={{ padding: '8px 4px', minWidth: '65px' }}>Reps</th>
                              <th style={{ padding: '8px 4px', minWidth: '55px' }}>RPE</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '48px' }}>Hecho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: item.series }).map((_, sIdx) => {
                              const setNum = sIdx + 1;
                              const key = `${item.id}_${setNum}`;
                              const log = localLogs[key] || {};
                              const isDone = !!log.is_completed;

                              return (
                                <tr 
                                  key={setNum}
                                  style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    backgroundColor: isDone ? 'rgba(110, 136, 66, 0.12)' : 'transparent'
                                  }}
                                >
                                  <td style={{ padding: '8px', fontWeight: 800, color: isDone ? '#DEEAC1' : '#FFF' }}>
                                    #{setNum}
                                  </td>

                                  <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                                    {item.repetitions} {item.target_weight ? `@ ${item.target_weight}kg` : ''}
                                  </td>

                                  <td style={{ padding: '8px' }}>
                                    <input
                                      type="number"
                                      step="0.5"
                                      placeholder="kg"
                                      value={log.actual_weight ?? ''}
                                      onChange={(e) => handleLogChange(item.id, setNum, 'actual_weight', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                        border: '1px solid var(--md-sys-color-outline-variant)',
                                        color: '#FFF',
                                        fontSize: '12.5px'
                                      }}
                                    />
                                  </td>

                                  <td style={{ padding: '8px' }}>
                                    <input
                                      type="number"
                                      placeholder="reps"
                                      value={log.actual_reps ?? ''}
                                      onChange={(e) => handleLogChange(item.id, setNum, 'actual_reps', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                        border: '1px solid var(--md-sys-color-outline-variant)',
                                        color: '#FFF',
                                        fontSize: '12.5px'
                                      }}
                                    />
                                  </td>

                                  <td style={{ padding: '8px' }}>
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="1"
                                      max="10"
                                      placeholder="RPE"
                                      value={log.actual_rpe ?? ''}
                                      onChange={(e) => handleLogChange(item.id, setNum, 'actual_rpe', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                        border: '1px solid var(--md-sys-color-outline-variant)',
                                        color: '#FFF',
                                        fontSize: '12.5px'
                                      }}
                                    />
                                  </td>

                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      onChange={(e) => handleLogChange(item.id, setNum, 'is_completed', e.target.checked, item.rest_seconds, item.exercise?.name)}
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        accentColor: 'var(--md-sys-color-primary)',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Student note per exercise */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)', whiteSpace: 'nowrap' }}>
                          Mi Feedback / Link Video:
                        </span>
                        <input
                          type="text"
                          placeholder="Ej: Sentí molestia en hombro / Link Drive técnica"
                          value={localLogs[`${item.id}_1`]?.student_notes || ''}
                          onChange={(e) => {
                            handleLogChange(item.id, 1, 'student_notes', e.target.value);
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            color: '#FFF',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>
                  );

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Bloque 1: Calentamiento & Movilidad (Warm-up) */}
                      {(routine.warmup_notes || warmupExercises.length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D' }}>
                            <Flame size={18} />
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              1. Calentamiento & Movilidad (Warm-up)
                            </h3>
                          </div>
                          {routine.warmup_notes && (
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(217, 119, 6, 0.12)',
                              border: '1px solid rgba(217, 119, 6, 0.3)',
                              color: '#FEF3C7',
                              fontSize: '13px',
                              lineHeight: 1.45
                            }}>
                              <strong>Indicaciones de Calentamiento:</strong> {routine.warmup_notes}
                            </div>
                          )}
                          {warmupExercises.map((ex, exIdx) => renderExerciseCard(ex, exIdx))}
                        </div>
                      )}

                      {/* Bloque 2: Entrenamiento Principal (Workout) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#89A854' }}>
                          <Dumbbell size={18} />
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            2. Entrenamiento Principal ({mainExercises.length} Ejercicios)
                          </h3>
                        </div>
                        {mainExercises.map((ex, exIdx) => renderExerciseCard(ex, exIdx))}
                      </div>

                      {/* Bloque 3: Vuelta a la Calma & Estiramiento (Cool-down) */}
                      {(routine.cooldown_notes || cooldownExercises.length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#67E8F9' }}>
                            <Sparkles size={18} />
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              3. Vuelta a la Calma & Estiramiento (Cool-down)
                            </h3>
                          </div>
                          {routine.cooldown_notes && (
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(6, 182, 212, 0.12)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              color: '#CFFAFE',
                              fontSize: '13px',
                              lineHeight: 1.45
                            }}>
                              <strong>Indicaciones de Vuelta a la Calma:</strong> {routine.cooldown_notes}
                            </div>
                          )}
                          {cooldownExercises.map((ex, exIdx) => renderExerciseCard(ex, exIdx))}
                        </div>
                      )}

                      {/* Save Sets Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                        {saveSuccessRoutineId === routine.id && (
                          <span style={{ fontSize: '13px', color: '#DEEAC1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={16} /> ¡Series guardadas exitosamente!
                          </span>
                        )}

                        <button
                          onClick={() => handleSaveRoutineLogs(routine)}
                          disabled={savingLogsRoutineId === routine.id}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--md-sys-color-primary)',
                            border: 'none',
                            color: '#FFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
                          }}
                        >
                          <Save size={16} />
                          {savingLogsRoutineId === routine.id ? 'Guardando Series...' : 'Guardar Progreso de Series'}
                        </button>
                      </div>

                      {/* Routine Comments Section */}
                      <div style={{
                        marginTop: '16px',
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <MessageSquare size={16} color="var(--md-sys-color-secondary)" />
                          Conversación & Dudas con tu Coach
                        </h4>

                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          {commentsList.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                              ¿Tienes dudas o quieres reportar cómo te sentiste en esta sesión? Escribe abajo.
                            </span>
                          ) : (
                            commentsList.map((c) => {
                              const isMine = c.author_type === 'student';
                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                    maxWidth: '82%',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: isMine ? 'rgba(110, 136, 66, 0.25)' : 'rgba(255,255,255,0.06)',
                                    border: isMine ? '1px solid rgba(137, 168, 84, 0.4)' : '1px solid rgba(255,255,255,0.08)'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '10.5px', marginBottom: '3px' }}>
                                    <strong style={{ color: isMine ? '#DEEAC1' : 'var(--md-sys-color-secondary)' }}>
                                      {isMine ? 'Tú (Alumno)' : c.author_name}
                                    </strong>
                                    <span style={{ color: 'var(--md-sys-color-outline)' }}>
                                      {new Date(c.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '12.5px', color: '#FFF', margin: 0 }}>
                                    {c.content}
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Comment Input */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Escribe un mensaje para tu Coach..."
                            value={newCommentText[routine.id] || ''}
                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [routine.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendRoutineComment(routine.id);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              border: '1px solid var(--md-sys-color-outline-variant)',
                              color: '#FFF',
                              fontSize: '12.5px'
                            }}
                          />
                          <button
                            type="button"
                            disabled={sendingCommentRoutineId === routine.id || !(newCommentText[routine.id]?.trim())}
                            onClick={() => handleSendRoutineComment(routine.id)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--md-sys-color-primary)',
                              border: 'none',
                              color: '#FFF',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Send size={14} />
                            {sendingCommentRoutineId === routine.id ? '...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      ))}

      {/* Floating Rest Timer Widget (TrueCoach Rest Timer) */}
      {restTimer.active && (
        <div className="floating-rest-timer" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: 'rgba(20, 26, 21, 0.95)',
          border: '1px solid rgba(137, 168, 84, 0.6)',
          borderRadius: '18px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
          padding: '12px 18px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: restTimer.remainingSeconds <= 5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(110, 136, 66, 0.3)',
            border: restTimer.remainingSeconds <= 5 ? '2px solid #EF4444' : '2px solid #89A854',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Timer size={20} color={restTimer.remainingSeconds <= 5 ? '#EF4444' : '#DEEAC1'} />
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--md-sys-color-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Descanso · {restTimer.exerciseName}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: restTimer.remainingSeconds <= 5 ? '#EF4444' : '#FFF', fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(restTimer.remainingSeconds / 60)}:{(restTimer.remainingSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setRestTimer(prev => ({
                ...prev,
                remainingSeconds: prev.remainingSeconds + 15,
                totalSeconds: Math.max(prev.totalSeconds, prev.remainingSeconds + 15)
              }))}
              title="+15 segundos"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#DEEAC1',
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              +15s
            </button>

            <button
              onClick={() => setRestTimer(prev => ({
                ...prev,
                remainingSeconds: Math.max(0, prev.remainingSeconds - 15)
              }))}
              title="-15 segundos"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#DEEAC1',
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              -15s
            </button>

            <button
              onClick={() => setRestTimer(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              title={restTimer.isPaused ? "Reanudar" : "Pausar"}
              style={{
                background: 'rgba(110, 136, 66, 0.25)',
                border: '1px solid rgba(137, 168, 84, 0.4)',
                borderRadius: '8px',
                color: '#FFF',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {restTimer.isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>

            <button
              onClick={() => setRestTimer(prev => ({ ...prev, active: false }))}
              title="Saltar descanso"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--md-sys-color-outline)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '4px'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      <VideoModal
        isOpen={!!videoExercise}
        exercise={videoExercise}
        onClose={() => setVideoExercise(null)}
      />
    </div>
  );
};
