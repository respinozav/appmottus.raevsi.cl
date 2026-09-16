import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Play, Dumbbell, Sparkles, User, Timer } from 'lucide-react';
import api from '../services/api';
import { VideoModal } from '../components/VideoModal';

export const MyRoutinesView = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [videoExercise, setVideoExercise] = useState(null);

  const fetchMyRoutines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/routines/my-routines');
      setRoutines(res.data);
    } catch (err) {
      console.error('Error cargando rutinas del alumno:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRoutines();
  }, []);

  const handleToggleExecution = async (routine) => {
    setUpdatingId(routine.id);
    try {
      await api.patch(`/routines/${routine.id}/toggle-execution`, {
        is_executed: !routine.is_executed,
      });
      fetchMyRoutines();
    } catch (err) {
      alert('Error al actualizar el estado de la rutina');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFF' }}>
          Mi Plan de Entrenamiento
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
          Revisa tus rutinas programadas, consulta los videos de técnica y marca tu progreso diario
        </p>
      </div>

      {loading ? (
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
            const dateObj = new Date(routine.scheduled_at);
            const dateFormatted = dateObj.toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={routine.id}
                className="md-card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  borderColor: routine.is_executed ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-outline-variant)',
                  backgroundColor: routine.is_executed ? 'rgba(20, 26, 20, 0.95)' : 'var(--md-sys-color-surface)'
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Calendar size={16} color="var(--md-sys-color-tertiary)" />
                      <span style={{ fontSize: '13px', color: 'var(--md-sys-color-tertiary)', textTransform: 'capitalize' }}>
                        {dateFormatted}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF' }}>
                      {routine.title}
                    </h2>
                    {routine.coach && (
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Asignado por: <strong>{routine.coach.name || 'Coach Mottus'}</strong>
                      </span>
                    )}
                  </div>

                  {/* Primary Action Button: Toggle Execution */}
                  <button
                    onClick={() => handleToggleExecution(routine)}
                    disabled={updatingId === routine.id}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: routine.is_executed
                        ? 'rgba(141, 168, 88, 0.15)'
                        : 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                      border: routine.is_executed
                        ? '1px solid rgba(141, 168, 88, 0.4)'
                        : '1px solid rgba(137, 168, 84, 0.4)',
                      color: routine.is_executed ? 'var(--md-sys-color-primary-light)' : '#FFF',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: routine.is_executed ? 'none' : '0 4px 16px rgba(110, 136, 66, 0.4)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle size={18} />
                    {updatingId === routine.id
                      ? 'Actualizando...'
                      : routine.is_executed
                      ? 'Completada ✔ (Hacer clic para desmarcar)'
                      : 'Marcar como Ejecutada'}
                  </button>
                </div>

                {routine.notes && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface)'
                  }}>
                    <strong>Indicación del Coach:</strong> {routine.notes}
                  </div>
                )}

                {/* Exercises in Routine */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-sys-color-tertiary)', marginBottom: '12px' }}>
                    Secuencia de Ejercicios ({routine.routine_exercises.length})
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {routine.routine_exercises.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          backgroundColor: 'var(--md-sys-color-surface-variant)',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-sys-color-secondary)', textTransform: 'uppercase' }}>
                              {item.exercise?.category?.name || 'Ejercicio'}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)', fontWeight: 700 }}>
                              #{idx + 1}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
                            {item.exercise?.name}
                          </h4>
                        </div>

                        {/* Series, Reps & Rest Details */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: '#FFF', fontWeight: 600 }}>
                            {item.series} Series
                          </span>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: '#FFF', fontWeight: 600 }}>
                            {item.repetitions}
                          </span>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: 'var(--md-sys-color-tertiary)' }}>
                            {item.rest_seconds}s descanso
                          </span>
                        </div>

                        {/* Video technique button */}
                        {item.exercise && (
                          <button
                            onClick={() => setVideoExercise(item.exercise)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(110, 136, 66, 0.2)',
                              border: '1px solid rgba(137, 168, 84, 0.4)',
                              color: '#FFF',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)';
                              e.currentTarget.style.boxShadow = '0 0 12px rgba(110, 136, 66, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.2)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <Play size={14} />
                            Ver Video de Técnica
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Video Modal */}
      <VideoModal
        isOpen={!!videoExercise}
        exercise={videoExercise}
        onClose={() => setVideoExercise(null)}
      />
    </div>
  );
};
