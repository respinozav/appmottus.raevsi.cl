import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Search, 
  Calendar, 
  Scale, 
  ChevronRight,
  Sparkles,
  UserCheck,
  Activity,
  MessageSquare,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export const AnalyticsView = () => {
  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance' | 'activity'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Activity Feed States
  const [feedItems, setFeedItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'routine_completed' | 'routine_comment' | 'habit_logged'
  const [reviewingId, setReviewingId] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/coach-compliance');
      setStats(res.data);
    } catch (err) {
      console.error('Error al cargar analítica del coach:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await api.get('/analytics/activity-feed');
      setFeedItems(res.data || []);
    } catch (err) {
      console.error('Error al cargar feed de actividad:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchActivityFeed();
  }, []);

  const handleMarkReviewed = async (routineId) => {
    setReviewingId(routineId);
    try {
      await api.patch(`/routines/${routineId}/mark-reviewed`);
      setFeedItems(prev => prev.map(item => {
        if (item.reference_id === routineId && item.event_type === 'routine_completed') {
          return { ...item, is_reviewed: true };
        }
        return item;
      }));
    } catch (err) {
      alert('Error al marcar como revisada: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReviewingId(null);
    }
  };

  const filteredStudents = stats?.students_summary.filter(s => {
    const q = searchFilter.toLowerCase();
    return (s.name && s.name.toLowerCase().includes(q)) || (s.rut && s.rut.toLowerCase().includes(q));
  }) || [];

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            Historial y Estadísticas de Cumplimiento
          </h1>
          <p className="view-subtitle">
            Monitorea la tasa de ejecución de entrenamientos y la adherencia individual de cada alumno
          </p>
        </div>
      </div>

      {/* Sub-Tabs: Estadísticas vs Feed de Actividad (TrueCoach Live Feed) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <button
            onClick={() => setActiveTab('compliance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'compliance' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'compliance' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} />
            Métricas de Cumplimiento
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'activity' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'activity' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={16} />
            Feed de Actividad en Vivo ({feedItems.length})
          </button>
        </div>

        {activeTab === 'activity' && (
          <button
            onClick={fetchActivityFeed}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(110, 136, 66, 0.2)',
              border: '1px solid rgba(137, 168, 84, 0.4)',
              color: '#DEEAC1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Actualizar Feed
          </button>
        )}
      </div>

      {activeTab === 'compliance' ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-tertiary)' }}>
            Generando reporte de cumplimiento...
          </div>
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-error)' }}>
            Error al cargar los datos estadísticos.
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
          <div className="responsive-kpi-grid" style={{ marginBottom: '32px' }}>
            {/* Tasa Cumplimiento Global */}
            <div className="md-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
                  Tasa Global de Cumplimiento
                </span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
                  <TrendingUp size={18} color="var(--md-sys-color-secondary)" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: stats.overall_compliance_rate >= 75 ? '#81C784' : stats.overall_compliance_rate >= 50 ? '#FFB74D' : '#E57373' }}>
                  {stats.overall_compliance_rate}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stats.overall_compliance_rate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6E8842, #89A854)',
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            {/* Rutinas Ejecutadas */}
            <div className="md-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
                  Rutinas Ejecutadas
                </span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(112, 130, 56, 0.25)' }}>
                  <CheckCircle2 size={18} color="var(--md-sys-color-secondary)" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#FFF' }}>
                  {stats.executed_routines}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  de {stats.total_routines} asignadas
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Completadas y registradas por los alumnos
              </span>
            </div>

            {/* Rutinas Pendientes */}
            <div className="md-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
                  Rutinas Pendientes
                </span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255, 183, 77, 0.15)' }}>
                  <Clock size={18} color="#FFB74D" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#FFB74D' }}>
                  {stats.pending_routines}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  en espera
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Por ejecutar en próximos entrenamientos
              </span>
            </div>

            {/* Alumnos Activos */}
            <div className="md-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)' }}>
                  Alumnos con Plan Activo
                </span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(110, 136, 66, 0.2)' }}>
                  <Users size={18} color="var(--md-sys-color-secondary)" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#FFF' }}>
                  {stats.active_students_with_routines}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  de {stats.total_students} registrados
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Con rutinas vigentes asignadas
              </span>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="md-card" style={{ padding: '26px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="var(--md-sys-color-primary-light)" />
                  Actividad de Rutinas (Últimos 14 Días)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                  Comparación entre rutinas programadas y rutinas completadas
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#6E8842' }} />
                  <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Ejecutadas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Programadas</span>
                </div>
              </div>
            </div>

            {/* Render Timeline Bars */}
            <div className="scroll-touch-container">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '8px', alignItems: 'end', height: '150px', paddingTop: '20px', minWidth: '500px' }}>
                {stats.timeline.map((point) => {
                  const maxVal = Math.max(...stats.timeline.map(p => Math.max(p.scheduled, p.executed)), 5);
                  const schedHeight = Math.max((point.scheduled / maxVal) * 100, 4);
                  const execHeight = Math.max((point.executed / maxVal) * 100, 4);
                  const dayLabel = new Date(point.date + 'T12:00:00Z').toLocaleDateString('es-CL', { weekday: 'narrow', day: 'numeric' });

                  return (
                    <div key={point.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100%' }}>
                        {/* Scheduled Bar */}
                        <div
                          title={`Programadas: ${point.scheduled}`}
                          style={{
                            width: '12px',
                            height: `${schedHeight}%`,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s'
                          }}
                        />
                        {/* Executed Bar */}
                        <div
                          title={`Ejecutadas: ${point.executed}`}
                          style={{
                            width: '12px',
                            height: `${execHeight}%`,
                            backgroundColor: '#89A854',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: point.executed > 0 ? '0 0 8px rgba(137, 168, 84, 0.4)' : 'none',
                            transition: 'height 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--md-sys-color-tertiary)', whiteSpace: 'nowrap' }}>
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Student Adherence Table */}
          <div className="md-card" style={{ padding: '26px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                  Ranking de Adherencia por Alumno
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--md-sys-color-tertiary)' }}>
                  Porcentaje de cumplimiento y último registro de peso de cada alumno
                </span>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                <Search size={16} color="var(--md-sys-color-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filtrar por nombre o RUT..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: '#FFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div className="scroll-touch-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'left', color: 'var(--md-sys-color-tertiary)' }}>
                    <th style={{ padding: '12px' }}>Alumno</th>
                    <th style={{ padding: '12px' }}>RUT</th>
                    <th style={{ padding: '12px' }}>Rutinas Asignadas</th>
                    <th style={{ padding: '12px' }}>Ejecutadas</th>
                    <th style={{ padding: '12px' }}>Cumplimiento</th>
                    <th style={{ padding: '12px' }}>Último Peso</th>
                    <th style={{ padding: '12px' }}>Última Sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        No se encontraron alumnos con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const rate = s.compliance_rate;
                      const rateColor = rate >= 80 ? '#81C784' : rate >= 50 ? '#FFB74D' : rate > 0 ? '#E57373' : 'var(--md-sys-color-tertiary)';

                      return (
                        <tr key={s.student_id || s.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px', color: '#FFF', fontWeight: 600 }}>
                            {s.name || 'Sin nombre'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--md-sys-color-tertiary)', fontFamily: 'monospace' }}>
                            {s.rut}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface)' }}>
                            {s.total_routines}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--md-sys-color-secondary)', fontWeight: 700 }}>
                            {s.executed_routines}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: rateColor, minWidth: '42px' }}>
                                {s.total_routines > 0 ? `${rate}%` : 'N/A'}
                              </span>
                              {s.total_routines > 0 && (
                                <div style={{ width: '60px', height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${rate}%`, height: '100%', backgroundColor: rateColor }} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#FFF' }}>
                            {s.last_weight ? `${s.last_weight} kg` : '--'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                            {s.last_executed_at ? new Date(s.last_executed_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : 'Sin actividad'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
        )
      ) : (
        /* Live Activity Feed View (TrueCoach Activity Feed) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Todos (${feedItems.length})` },
              { id: 'routine_completed', label: 'Rutinas Completadas' },
              { id: 'routine_comment', label: 'Comentarios de Alumnos' },
              { id: 'habit_logged', label: 'Registro de Hábitos' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFeedFilter(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: feedFilter === f.id ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: feedFilter === f.id ? 'rgba(110, 136, 66, 0.3)' : 'rgba(255,255,255,0.03)',
                  color: feedFilter === f.id ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingFeed ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-tertiary)' }}>
              Cargando actividad en vivo...
            </div>
          ) : feedItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '20px',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <Activity size={40} color="var(--md-sys-color-secondary)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF' }}>Sin actividad reciente</h3>
              <p style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
                Los entrenamientos completados, comentarios de feedback y registros de hábitos de tus alumnos aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedItems
                .filter(item => feedFilter === 'all' || item.event_type === feedFilter)
                .map(item => {
                  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '';

                  const isRoutine = item.event_type === 'routine_completed';
                  const isComment = item.event_type === 'routine_comment';
                  const isHabit = item.event_type === 'habit_logged';

                  return (
                    <div
                      key={item.id}
                      className="md-card"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px',
                        borderLeft: isRoutine
                          ? '4px solid #89A854'
                          : isComment
                          ? '4px solid #38BDF8'
                          : '4px solid #F59E0B'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: isRoutine
                            ? 'rgba(110, 136, 66, 0.25)'
                            : isComment
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isRoutine && <CheckCircle2 size={20} color="#89A854" />}
                          {isComment && <MessageSquare size={20} color="#38BDF8" />}
                          {isHabit && <Flame size={20} color="#F59E0B" />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFF' }}>
                              {item.student_name}
                            </span>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isRoutine ? 'rgba(110, 136, 66, 0.2)' : isComment ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: isRoutine ? '#DEEAC1' : isComment ? '#BAE6FD' : '#FDE68A'
                            }}>
                              {isRoutine ? 'Entrenamiento' : isComment ? 'Comentario' : 'Hábitos'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)' }}>
                              {dateStr}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#DEEAC1', fontWeight: 600, marginTop: '2px' }}>
                            {item.title}
                          </div>

                          {item.description && (
                            <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action / Review Status */}
                      {isRoutine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.is_reviewed ? (
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#DEEAC1',
                              backgroundColor: 'rgba(110, 136, 66, 0.25)',
                              border: '1px solid rgba(137, 168, 84, 0.5)',
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              ✔ Revisada
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkReviewed(item.reference_id)}
                              disabled={reviewingId === item.reference_id}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
                                color: '#FFF',
                                border: '1px solid rgba(137, 168, 84, 0.4)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <Check size={14} />
                              {reviewingId === item.reference_id ? 'Guardando...' : 'Dar V°B° / Revisar'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
