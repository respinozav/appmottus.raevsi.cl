import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Circle, 
  Play, 
  Trash2, 
  Dumbbell, 
  MessageSquare, 
  Activity, 
  Send
} from 'lucide-react';
import api from '../services/api';
import { VideoModal } from '../components/VideoModal';

export const RoutinesView = () => {
  const [routines, setRoutines] = useState([]);
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Create Routine
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('Rutina Fuerza & Hipertrofia');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]); // Array of prescription objects
  const [duplicateDates, setDuplicateDates] = useState([]); // Array of ISO strings
  const [extraDateInput, setExtraDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Video Preview Modal
  const [videoExercise, setVideoExercise] = useState(null);

  // Inspection Modal (Student Results & Coach Feedback)
  const [inspectRoutine, setInspectRoutine] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, eRes] = await Promise.all([
        api.get('/routines/coach-routines'),
        api.get('/users/students'),
        api.get('/exercises/')
      ]);
      setRoutines(rRes.data);
      setStudents(sRes.data);
      setExercises(eRes.data);
      if (sRes.data.length > 0 && !selectedStudent) {
        setSelectedStudent(sRes.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando rutinas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Default scheduled time to tomorrow 09:00
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
    setScheduledAt(now.toISOString().slice(0, 16));
  }, []);

  const handleToggleExerciseSelection = (exerciseId) => {
    const exists = selectedExercises.find(e => e.exercise_id === exerciseId);
    if (exists) {
      setSelectedExercises(selectedExercises.filter(e => e.exercise_id !== exerciseId));
    } else {
      setSelectedExercises([
        ...selectedExercises,
        { 
          exercise_id: exerciseId, 
          series: 4, 
          repetitions: '10-12 reps', 
          rest_seconds: 60,
          superset_group: '',
          target_weight: '',
          target_rpe: '',
          tempo: '3-0-1-0',
          coach_notes: ''
        }
      ]);
    }
  };

  const handleUpdateDetail = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(e => {
      if (e.exercise_id === exerciseId) {
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const handleAddDuplicateDate = () => {
    if (extraDateInput && !duplicateDates.includes(extraDateInput)) {
      setDuplicateDates([...duplicateDates, extraDateInput]);
      setExtraDateInput('');
    }
  };

  const handleRemoveDuplicateDate = (dateToRemove) => {
    setDuplicateDates(duplicateDates.filter(d => d !== dateToRemove));
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (selectedExercises.length === 0) {
      setSaveError('Debes seleccionar al menos un ejercicio para la rutina.');
      return;
    }
    setSaving(true);
    setSaveError('');

    try {
      const formattedExercises = selectedExercises.map((ex, idx) => ({
        exercise_id: ex.exercise_id,
        series: parseInt(ex.series) || 3,
        repetitions: ex.repetitions || '12 reps',
        rest_seconds: parseInt(ex.rest_seconds) || 60,
        order_index: idx + 1,
        superset_group: ex.superset_group ? ex.superset_group.trim().toUpperCase() : null,
        target_weight: ex.target_weight ? parseFloat(ex.target_weight) : null,
        target_rpe: ex.target_rpe ? parseFloat(ex.target_rpe) : null,
        tempo: ex.tempo ? ex.tempo.trim() : null,
        coach_notes: ex.coach_notes ? ex.coach_notes.trim() : null
      }));

      const payload = {
        student_id: selectedStudent,
        user_id: selectedStudent,
        title,
        scheduled_at: new Date(scheduledAt).toISOString(),
        notes,
        exercises: formattedExercises,
        duplicate_to_dates: duplicateDates.length > 0 ? duplicateDates.map(d => new Date(d).toISOString()) : null
      };

      await api.post('/routines/', payload);
      setShowModal(false);
      setSelectedExercises([]);
      setDuplicateDates([]);
      setNotes('');
      fetchData();
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Error al asignar la rutina.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta rutina asignada?')) {
      try {
        await api.delete(`/routines/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error al eliminar la rutina:', err);
        alert('Error al eliminar la rutina');
      }
    }
  };

  const handleOpenInspectModal = async (routine) => {
    setInspectRoutine(routine);
    setLoadingComments(true);
    try {
      const res = await api.get(`/routines/${routine.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Error cargando comentarios:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !inspectRoutine) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/routines/${inspectRoutine.id}/comments`, {
        content: newComment.trim()
      });
      setComments([...comments, res.data]);
      setNewComment('');
      // Refresh current routine in background
      const updatedRes = await api.get(`/routines/${inspectRoutine.id}`);
      setInspectRoutine(updatedRes.data);
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('Error al enviar el mensaje.');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            Rutinas Asignadas por el Coach
          </h1>
          <p className="view-subtitle">
            Planifica sesiones con prescripción avanzada (superseries, tempo, RPE) y analiza resultados serie por serie
          </p>
        </div>

        <div className="view-actions">
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
            Crear & Asignar Rutina
          </button>
        </div>
      </div>

      {/* Routine Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-tertiary)' }}>
          Cargando rutinas del coach...
        </div>
      ) : routines.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <Dumbbell size={48} color="var(--md-sys-color-outline)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', color: '#FFF' }}>No hay rutinas creadas aún</h3>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
            Haz clic en "Crear & Asignar Rutina" para planificar el primer entrenamiento con prescripción avanzada.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {routines.map((routine) => {
            const dateObj = new Date(routine.scheduled_at);
            const dateFormatted = dateObj.toLocaleDateString('es-CL', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={routine.id}
                className="md-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderColor: routine.is_executed ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-outline-variant)'
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        backgroundColor: routine.is_executed ? 'rgba(112, 130, 56, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        color: routine.is_executed ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {routine.is_executed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        {routine.is_executed ? 'Ejecutada por el Alumno' : 'Pendiente de Ejecución'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                      {routine.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    title="Eliminar rutina"
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
                </div>

                {/* Student & Date Info */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface)' }}>
                    <User size={15} color="var(--md-sys-color-secondary)" />
                    <strong>Alumno:</strong> {routine.student?.name || routine.user?.name || routine.student?.rut || routine.user?.rut}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <Calendar size={15} color="var(--md-sys-color-tertiary)" />
                    <strong>Programada:</strong> {dateFormatted}
                  </div>
                </div>

                {/* Routine Exercises Preview */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-tertiary)', marginBottom: '8px' }}>
                    Prescripción ({routine.routine_exercises.length} Ejercicios)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {routine.routine_exercises.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.superset_group && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(110, 136, 66, 0.35)',
                              color: '#DEEAC1',
                              border: '1px solid rgba(137, 168, 84, 0.5)'
                            }}>
                              {item.superset_group}
                            </span>
                          )}
                          <span style={{ color: '#FFF', fontWeight: 600 }}>
                            {item.exercise?.name || 'Ejercicio'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                            {item.series}x {item.repetitions}
                            {item.target_weight && ` @ ${item.target_weight}kg`}
                          </span>
                          {item.exercise && (
                            <button
                              onClick={() => setVideoExercise(item.exercise)}
                              title="Ver técnica en video"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--md-sys-color-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Play size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {routine.notes && (
                  <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '10px' }}>
                    Nota: {routine.notes}
                  </p>
                )}

                {/* Inspect Results & Feedback Button */}
                <button
                  onClick={() => handleOpenInspectModal(routine)}
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(110, 136, 66, 0.18)',
                    border: '1px solid rgba(137, 168, 84, 0.4)',
                    color: '#DEEAC1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.18)'}
                >
                  <Activity size={16} />
                  Inspeccionar Series & Feedback
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create & Assign Routine with TrueCoach features */}
      {showModal && (
        <div style={modalBackdropStyle} onClick={() => setShowModal(false)}>
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '840px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF', marginBottom: '6px' }}>
              Workout Builder Pro (TrueCoach)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', marginBottom: '18px' }}>
              Prescribe ejercicios con superseries, tempo, RPE y programación periódica
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

            <form onSubmit={handleCreateRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="responsive-grid-2col" style={{ gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Título de la Rutina *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Alumno Asignado *</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    style={inputStyle}
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name ? `${s.name} (${s.rut})` : `RUT: ${s.rut}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="responsive-grid-2col" style={{ gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Fecha y Hora Principal *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Instrucciones Generales de la Sesión</label>
                  <input
                    type="text"
                    placeholder="Ej: Calentamiento 5m de movilidad de cadera"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Duplicate to other dates (Weekly recurring) */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--md-sys-color-outline-variant)'
              }}>
                <label style={{ ...labelStyle, marginBottom: '6px' }}>
                  Programación Múltiple / Clonar en Fechas Adicionales (Opcional)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="datetime-local"
                    value={extraDateInput}
                    onChange={(e) => setExtraDateInput(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDuplicateDate}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(110, 136, 66, 0.25)',
                      border: '1px solid rgba(137, 168, 84, 0.4)',
                      color: '#DEEAC1',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir Fecha
                  </button>
                </div>

                {duplicateDates.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {duplicateDates.map((d) => (
                      <span
                        key={d}
                        style={{
                          fontSize: '11.5px',
                          backgroundColor: 'rgba(110, 136, 66, 0.2)',
                          color: '#DEEAC1',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {new Date(d).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        <button
                          type="button"
                          onClick={() => handleRemoveDuplicateDate(d)}
                          style={{ background: 'none', border: 'none', color: '#FFB4AB', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercises Picker */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>
                  Selecciona y Prescribe Ejercicios ({selectedExercises.length} seleccionados) *
                </label>

                <div style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: '16px',
                  padding: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {exercises.map((ex) => {
                    const isSelected = selectedExercises.some(e => e.exercise_id === ex.id);
                    const currentDetail = selectedExercises.find(e => e.exercise_id === ex.id);

                    return (
                      <div
                        key={ex.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(110, 136, 66, 0.2)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(137, 168, 84, 0.5)' : '1px solid transparent',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleExerciseSelection(ex.id)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--md-sys-color-primary)' }}
                            />
                            <span style={{ fontWeight: 600, color: '#FFF', fontSize: '14px' }}>
                              {ex.name}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-secondary)', backgroundColor: 'rgba(112, 130, 56, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                              {ex.category?.name}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setVideoExercise(ex)}
                            title="Previsualizar video de YouTube"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--md-sys-color-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <Play size={14} />
                            Ver Video
                          </button>
                        </div>

                        {isSelected && currentDetail && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '28px', paddingTop: '6px' }}>
                            {/* Row 1: Series, Reps, Rest, Superset */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Series:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={currentDetail.series}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'series', parseInt(e.target.value) || 1)}
                                  style={{ width: '52px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Reps:</span>
                                <input
                                  type="text"
                                  value={currentDetail.repetitions}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'repetitions', e.target.value)}
                                  style={{ width: '85px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Descanso(s):</span>
                                <input
                                  type="number"
                                  step="10"
                                  value={currentDetail.rest_seconds}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'rest_seconds', parseInt(e.target.value) || 30)}
                                  style={{ width: '60px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: '#DEEAC1', fontWeight: 600 }}>Superserie:</span>
                                <input
                                  type="text"
                                  placeholder="Ej: A1"
                                  value={currentDetail.superset_group || ''}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'superset_group', e.target.value)}
                                  style={{ width: '50px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(110, 136, 66, 0.3)', border: '1px solid rgba(137, 168, 84, 0.6)', color: '#FFF', fontSize: '12px', fontWeight: 700 }}
                                />
                              </div>
                            </div>

                            {/* Row 2: Target Weight, Target RPE, Tempo, Notes */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Peso Obj(kg):</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  placeholder="ej. 80"
                                  value={currentDetail.target_weight || ''}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'target_weight', e.target.value)}
                                  style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>RPE Obj:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="1"
                                  max="10"
                                  placeholder="8.5"
                                  value={currentDetail.target_rpe || ''}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'target_rpe', e.target.value)}
                                  style={{ width: '50px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tempo:</span>
                                <input
                                  type="text"
                                  placeholder="3-0-1-0"
                                  value={currentDetail.tempo || ''}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'tempo', e.target.value)}
                                  style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: '180px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>Notas:</span>
                                <input
                                  type="text"
                                  placeholder="Indicación técnica específica"
                                  value={currentDetail.coach_notes || ''}
                                  onChange={(e) => handleUpdateDetail(ex.id, 'coach_notes', e.target.value)}
                                  style={{ flex: 1, padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    border: 'none',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 2px 10px rgba(110, 136, 66, 0.4)'
                  }}
                >
                  {saving ? 'Guardando...' : 'Asignar Rutina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspection & Feedback (Coach View of Student Results) */}
      {inspectRoutine && (
        <div style={modalBackdropStyle} onClick={() => setInspectRoutine(null)}>
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: inspectRoutine.is_executed ? 'rgba(112, 130, 56, 0.3)' : 'rgba(255, 183, 77, 0.15)',
                    color: inspectRoutine.is_executed ? '#DEEAC1' : '#FFB74D',
                    border: '1px solid rgba(137, 168, 84, 0.4)'
                  }}>
                    {inspectRoutine.is_executed ? '✔ Rutina Completada' : '⏳ Pendiente'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)' }}>
                    Alumno: <strong>{inspectRoutine.student?.name || inspectRoutine.user?.name}</strong>
                  </span>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF' }}>
                  {inspectRoutine.title}
                </h2>
              </div>

              <button
                onClick={() => setInspectRoutine(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Exercises & Logs Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--md-sys-color-primary-light)" />
                Desglose Serie por Serie Registrado por el Alumno
              </h3>

              {inspectRoutine.routine_exercises.map((reItem, idx) => {
                const logs = reItem.exercise_logs || [];
                return (
                  <div
                    key={reItem.id || idx}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--md-sys-color-surface-variant)',
                      border: '1px solid var(--md-sys-color-outline-variant)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {reItem.superset_group && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(110, 136, 66, 0.4)',
                            color: '#DEEAC1'
                          }}>
                            {reItem.superset_group}
                          </span>
                        )}
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>
                          {reItem.exercise?.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                        Prescripción: {reItem.series} series x {reItem.repetitions}
                        {reItem.target_weight && ` @ ${reItem.target_weight}kg`}
                        {reItem.tempo && ` | Tempo ${reItem.tempo}`}
                      </span>
                    </div>

                    {reItem.coach_notes && (
                      <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', marginBottom: '10px' }}>
                        Nota Coach: {reItem.coach_notes}
                      </div>
                    )}

                    {/* Table of sets */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--md-sys-color-tertiary)' }}>
                            <th style={{ padding: '6px 8px' }}>Serie</th>
                            <th style={{ padding: '6px 8px' }}>Peso Real</th>
                            <th style={{ padding: '6px 8px' }}>Reps Reales</th>
                            <th style={{ padding: '6px 8px' }}>RPE Real</th>
                            <th style={{ padding: '6px 8px' }}>Estado</th>
                            <th style={{ padding: '6px 8px' }}>Notas Alumno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: reItem.series }).map((_, sIdx) => {
                            const setNum = sIdx + 1;
                            const log = logs.find(l => l.set_number === setNum);
                            return (
                              <tr key={setNum} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '8px', fontWeight: 700, color: '#FFF' }}>
                                  #{setNum}
                                </td>
                                <td style={{ padding: '8px', color: log?.actual_weight ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)' }}>
                                  {log?.actual_weight ? `${log.actual_weight} kg` : '-'}
                                </td>
                                <td style={{ padding: '8px', color: log?.actual_reps ? '#FFF' : 'var(--md-sys-color-on-surface-variant)' }}>
                                  {log?.actual_reps ? `${log.actual_reps} reps` : '-'}
                                </td>
                                <td style={{ padding: '8px', color: log?.actual_rpe ? '#FFB74D' : 'var(--md-sys-color-on-surface-variant)' }}>
                                  {log?.actual_rpe ? log.actual_rpe : '-'}
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: log?.is_completed ? 'rgba(112, 130, 56, 0.3)' : 'rgba(255,255,255,0.05)',
                                    color: log?.is_completed ? '#DEEAC1' : 'var(--md-sys-color-tertiary)'
                                  }}>
                                    {log?.is_completed ? 'Completada ✔' : 'Pendiente'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                                  {log?.student_notes || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Routine Comments / Chat Thread */}
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 20, 16, 0.9)',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MessageSquare size={18} color="var(--md-sys-color-secondary)" />
                Feedback & Conversación de la Sesión
              </h3>

              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '14px',
                paddingRight: '6px'
              }}>
                {loadingComments ? (
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>Cargando conversación...</span>
                ) : comments.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                    No hay comentarios en esta sesión todavía. Escribe el primer mensaje abajo.
                  </span>
                ) : (
                  comments.map((c) => {
                    const isCoachMsg = c.author_type === 'coach';
                    return (
                      <div
                        key={c.id}
                        style={{
                          alignSelf: isCoachMsg ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: isCoachMsg ? 'rgba(110, 136, 66, 0.25)' : 'rgba(255,255,255,0.06)',
                          border: isCoachMsg ? '1px solid rgba(137, 168, 84, 0.4)' : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px', fontSize: '11px' }}>
                          <strong style={{ color: isCoachMsg ? '#DEEAC1' : 'var(--md-sys-color-secondary)' }}>
                            {c.author_name} ({isCoachMsg ? 'Coach' : 'Alumno'})
                          </strong>
                          <span style={{ color: 'var(--md-sys-color-outline)' }}>
                            {new Date(c.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#FFF', margin: 0 }}>
                          {c.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form to send new comment */}
              <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Escribe tu feedback o respuesta para el alumno..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    border: 'none',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={15} />
                  {sendingComment ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
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

// Internal styles
const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(5, 8, 5, 0.85)',
  backdropFilter: 'blur(12px)',
  padding: '16px',
  animation: 'fadeIn 0.2s ease-out'
};

const modalBoxStyle = {
  backgroundColor: 'var(--md-sys-color-surface)',
  borderRadius: '24px',
  border: '1px solid var(--md-sys-color-outline-variant)',
  padding: '28px',
  boxShadow: 'var(--md-elevation-3)'
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
  padding: '10px 14px',
  borderRadius: '10px',
  backgroundColor: 'var(--md-sys-color-surface-variant)',
  border: '1px solid var(--md-sys-color-outline-variant)',
  color: '#FFF',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box'
};
