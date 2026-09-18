import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, CheckCircle2, Circle, Play, Trash2, Dumbbell, Sparkles } from 'lucide-react';
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
  const [selectedExercises, setSelectedExercises] = useState([]); // Array of { exercise_id, series, repetitions, rest_seconds }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Video Preview Modal
  const [videoExercise, setVideoExercise] = useState(null);

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
        { exercise_id: exerciseId, series: 4, repetitions: '10-12 reps', rest_seconds: 60 }
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

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (selectedExercises.length === 0) {
      setSaveError('Debes seleccionar al menos un ejercicio para la rutina.');
      return;
    }
    setSaving(true);
    setSaveError('');

    try {
      await api.post('/routines/', {
        student_id: selectedStudent,
        user_id: selectedStudent,
        title,
        scheduled_at: new Date(scheduledAt).toISOString(),
        notes,
        exercises: selectedExercises
      });
      setShowModal(false);
      setSelectedExercises([]);
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
        alert('Error al eliminar la rutina');
      }
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
            Planifica sesiones de entrenamiento personalizadas para cada alumno
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
            Crear y Asignar Rutina
          </button>
        </div>
      </div>

      {/* Routine Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-tertiary)' }}>
          Cargando rutinas...
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
            Haz clic en "Crear y Asignar Rutina" para planificar el primer entrenamiento.
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
                    Ejercicios ({routine.routine_exercises.length})
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
                        <span style={{ color: '#FFF', fontWeight: 600 }}>
                          {item.exercise?.name || 'Ejercicio'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                            {item.series}x {item.repetitions}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create & Assign Routine */}
      {showModal && (
        <div style={modalBackdropStyle} onClick={() => setShowModal(false)}>
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
              Crear & Asignar Nueva Rutina
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', marginBottom: '20px' }}>
              Selecciona al alumno, la fecha/hora y los ejercicios a incluir.
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

            <form onSubmit={handleCreateRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  <label style={labelStyle}>Fecha y Hora Programada *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Instrucciones Generales / Notas</label>
                  <input
                    type="text"
                    placeholder="Ej: Calentamiento 5 min de trote suave"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Exercises Picker */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Selecciona Ejercicios ({selectedExercises.length} seleccionados) *
                  </label>
                </div>

                <div style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: '16px',
                  padding: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {exercises.map((ex) => {
                    const isSelected = selectedExercises.some(e => e.exercise_id === ex.id);
                    const currentDetail = selectedExercises.find(e => e.exercise_id === ex.id);

                    return (
                      <div
                        key={ex.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(110, 136, 66, 0.25)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(137, 168, 84, 0.5)' : '1px solid transparent',
                          boxShadow: isSelected ? '0 0 12px rgba(110, 136, 66, 0.2)' : 'none',
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
                          <div style={{ display: 'flex', gap: '12px', paddingLeft: '28px', paddingTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Series:</span>
                              <input
                                type="number"
                                min="1"
                                value={currentDetail.series}
                                onChange={(e) => handleUpdateDetail(ex.id, 'series', parseInt(e.target.value) || 1)}
                                style={{ width: '55px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Reps:</span>
                              <input
                                type="text"
                                value={currentDetail.repetitions}
                                onChange={(e) => handleUpdateDetail(ex.id, 'repetitions', e.target.value)}
                                style={{ width: '90px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Descanso (s):</span>
                              <input
                                type="number"
                                step="10"
                                value={currentDetail.rest_seconds}
                                onChange={(e) => handleUpdateDetail(ex.id, 'rest_seconds', parseInt(e.target.value) || 30)}
                                style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--md-sys-color-outline-variant)', color: '#FFF', fontSize: '12px' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Cancel buttons */}
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
                  {saving ? 'Guardando...' : 'Asignar Rutina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Video Modal */}
      <VideoModal
        isOpen={!!videoExercise}
        exercise={videoExercise}
        onClose={() => setVideoExercise(null)}
      />
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
  backgroundColor: 'var(--md-sys-color-surface)',
  borderRadius: '24px',
  border: '1px solid var(--md-sys-color-outline-variant)',
  padding: '28px 24px',
  boxShadow: 'var(--md-elevation-3)'
};
