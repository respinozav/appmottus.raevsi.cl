import React, { useState, useEffect } from 'react';
import { Play, Plus, Search, Filter, Dumbbell, Trash2, Video } from 'lucide-react';
import api from '../services/api';
import { VideoModal } from '../components/VideoModal';
import { useAuth } from '../context/AuthContext';

export const ExercisesView = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Video
  const [activeVideoExercise, setActiveVideoExercise] = useState(null);

  // Modal Create Exercise
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category_id: '',
    youtube_url: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal Create Category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const isCoachOrAdmin = user?.role === 'coach' || user?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exRes, catRes] = await Promise.all([
        api.get('/exercises/'),
        api.get('/categories/')
      ]);
      setExercises(exRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !newExercise.category_id) {
        setNewExercise(prev => ({ ...prev, category_id: catRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error cargando ejercicios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/exercises/', newExercise);
      setShowCreateModal(false);
      setNewExercise({ name: '', category_id: categories[0]?.id || '', youtube_url: '', description: '' });
      fetchData();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Error al crear el ejercicio.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories/', { name: newCategoryName, description: newCategoryDesc });
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al crear la categoría.');
    }
  };

  const handleDeleteExercise = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este ejercicio?')) {
      try {
        await api.delete(`/exercises/${id}`);
        fetchData();
      } catch (err) {
        alert('Error al eliminar el ejercicio');
      }
    }
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesCategory = selectedCategory === 'all' || ex.category_id === selectedCategory;
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Extract thumbnail from YouTube URL
  const getYouTubeThumbnail = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url?.match(regex);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Actions */}
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
            Parrilla de Ejercicios
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-tertiary)', marginTop: '4px' }}>
            Catálogo multimedia con demostraciones en video para los alumnos
          </p>
        </div>

        {isCoachOrAdmin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowCategoryModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '14px',
                backgroundColor: 'var(--md-sys-color-surface-variant)',
                color: 'var(--md-sys-color-on-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <Plus size={16} />
              Nueva Categoría
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6E8842 0%, #586E33 100%)',
                color: '#FFF',
                border: '1px solid rgba(137, 168, 84, 0.4)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 4px 16px rgba(110, 136, 66, 0.4)'
              }}
            >
              <Plus size={18} />
              Agregar Ejercicio
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '28px',
        padding: '16px 20px',
        backgroundColor: 'var(--md-sys-color-surface)',
        borderRadius: '20px',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        {/* Search */}
        <div style={{
          flex: '1',
          minWidth: '240px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          padding: '10px 16px',
          borderRadius: '12px'
        }}>
          <Search size={18} color="var(--md-sys-color-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por nombre o técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFF',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: selectedCategory === 'all' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-surface-variant)',
              color: selectedCategory === 'all' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)'
            }}
          >
            Todas ({exercises.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: selectedCategory === cat.id ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-surface-variant)',
                color: selectedCategory === cat.id ? '#FFF' : 'var(--md-sys-color-on-surface-variant)'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Exercises */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--md-sys-color-tertiary)' }}>
          Cargando catálogo de ejercicios...
        </div>
      ) : filteredExercises.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <Dumbbell size={48} color="var(--md-sys-color-outline)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', color: '#FFF' }}>No se encontraron ejercicios</h3>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
            Prueba ajustando los filtros o registra un nuevo ejercicio con video de YouTube.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '24px'
        }}>
          {filteredExercises.map((exercise) => {
            const thumbUrl = getYouTubeThumbnail(exercise.youtube_url);
            return (
              <div
                key={exercise.id}
                className="md-card"
                onClick={() => setActiveVideoExercise(exercise)}
                style={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Thumbnail with Play Hover Overlay */}
                <div style={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundColor: '#192218',
                  overflow: 'hidden'
                }}>
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={exercise.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Video size={36} color="var(--md-sys-color-secondary)" />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(110, 136, 66, 0.95) 0%, rgba(88, 110, 51, 0.95) 100%)',
                      border: '1px solid rgba(137, 168, 84, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(110, 136, 66, 0.6)'
                    }}>
                      <Play size={20} color="#FFF" style={{ marginLeft: '3px' }} />
                    </div>
                  </div>

                  {/* Category Pill Tag */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(20, 26, 20, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--md-sys-color-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    {exercise.category?.name || 'General'}
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
                      {exercise.name}
                    </h3>
                    {isCoachOrAdmin && (
                      <button
                        onClick={(e) => handleDeleteExercise(exercise.id, e)}
                        title="Eliminar ejercicio"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--md-sys-color-outline)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--md-sys-color-error)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--md-sys-color-outline)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    marginTop: 'auto'
                  }}>
                    {exercise.description || 'Haz clic para reproducir la técnica y demostración en video.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Interactive Video Modal */}
      <VideoModal
        isOpen={!!activeVideoExercise}
        exercise={activeVideoExercise}
        onClose={() => setActiveVideoExercise(null)}
      />

      {/* Modal: Create Exercise */}
      {showCreateModal && (
        <div style={modalBackdropStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginBottom: '16px' }}>
              Registrar Nuevo Ejercicio
            </h2>

            {createError && (
              <p style={{ color: 'var(--md-sys-color-error)', fontSize: '13px', marginBottom: '12px' }}>
                {createError}
              </p>
            )}

            <form onSubmit={handleCreateExercise} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select
                  value={newExercise.category_id}
                  onChange={(e) => setNewExercise({ ...newExercise, category_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nombre del Ejercicio *</label>
                <input
                  type="text"
                  placeholder="Ej: Press de Banca Plano con Barra"
                  required
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>URL de YouTube *</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                  required
                  value={newExercise.youtube_url}
                  onChange={(e) => setNewExercise({ ...newExercise, youtube_url: e.target.value })}
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  El video se reproducirá en un modal flotante dentro de la app.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Breve Descripción / Puntos Clave</label>
                <textarea
                  rows="3"
                  placeholder="Indicaciones de postura, agarre o respiración..."
                  value={newExercise.description}
                  onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creating ? 'Guardando...' : 'Guardar Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {showCategoryModal && (
        <div style={modalBackdropStyle} onClick={() => setShowCategoryModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginBottom: '16px' }}>
              Nueva Categoría de Ejercicios
            </h2>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre de la Categoría *</label>
                <input
                  type="text"
                  placeholder="Ej: Glúteos y Cadera"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  rows="3"
                  placeholder="Grupos musculares involucrados..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
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
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Crear Categoría
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
  maxWidth: '520px',
  backgroundColor: 'var(--md-sys-color-surface)',
  borderRadius: '24px',
  border: '1px solid var(--md-sys-color-outline-variant)',
  padding: '28px 24px',
  boxShadow: 'var(--md-elevation-3)'
};
