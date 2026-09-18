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
  UserCheck
} from 'lucide-react';
import api from '../services/api';

export const AnalyticsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

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

  useEffect(() => {
    fetchStats();
  }, []);

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

      {loading ? (
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
      )}
    </div>
  );
};
