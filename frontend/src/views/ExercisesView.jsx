import React, { useState, useEffect } from 'react';
import { 
  Play, Plus, Search, Filter, Dumbbell, Trash2, Video, 
  Pencil, Check, X, Power, FolderCog, AlertCircle, CheckCircle2, XCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
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

  // Modal / Management Categories
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryMsg, setCategoryMsg] = useState({ type: '', text: '' });

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
      
      const activeCats = catRes.data.filter(c => c.is_active);
      if (activeCats.length > 0 && !newExercise.category_id) {
        setNewExercise(prev => ({ ...prev, category_id: activeCats[0].id }));
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

  // Manejo de Ejercicios
  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/exercises/', newExercise);
      setShowCreateModal(false);
      const activeCats = categories.filter(c => c.is_active);
      setNewExercise({ 
        name: '', 
        category_id: activeCats[0]?.id || '', 
        youtube_url: '', 
        description: '' 
      });
      fetchData();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Error al crear el ejercicio.');
    } finally {
      setCreating(false);
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

  // Manejo de Categorías
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      is_active: true
    });
    setCategoryMsg({ type: '', text: '' });
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      is_active: cat.is_active
    });
    setCategoryMsg({ type: '', text: '' });
    setCategoryFormOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSavingCategory(true);
    setCategoryMsg({ type: '', text: '' });

    const cleanName = categoryForm.name.trim();
    if (!cleanName) {
      setCategoryMsg({ type: 'error', text: 'El nombre de la categoría es obligatorio.' });
      setSavingCategory(false);
      return;
    }

    try {
      if (editingCategory) {
        // Actualizar categoría existente
        const res = await api.put(`/categories/${editingCategory.id}`, {
          name: cleanName,
          description: categoryForm.description.trim() || null,
          is_active: categoryForm.is_active
        });
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.data : c));
        setCategoryMsg({ type: 'success', text: `Categoría "${res.data.name}" actualizada con éxito.` });
      } else {
        // Crear nueva categoría
        const res = await api.post('/categories/', {
          name: cleanName,
          description: categoryForm.description.trim() || null,
          is_active: categoryForm.is_active
        });
        setCategories(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setCategoryMsg({ type: 'success', text: `Categoría "${res.data.name}" creada con éxito.` });
      }

      setCategoryFormOpen(false);
      setEditingCategory(null);
      // Refrescar también ejercicios para asegurar nombres de categoría sincronizados
      const exRes = await api.get('/exercises/');
      setExercises(exRes.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setCategoryMsg({ 
        type: 'error', 
        text: typeof detail === 'string' ? detail : 'Error al guardar la categoría.' 
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategoryStatus = async (cat, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/categories/${cat.id}/toggle-status`);
      setCategories(prev => prev.map(c => c.id === cat.id ? res.data : c));
      
      // Si la categoría desactivada era la seleccionada en el formulario de nuevo ejercicio, cambiarla
      if (!res.data.is_active && newExercise.category_id === cat.id) {
        const remainingActive = categories.filter(c => c.id !== cat.id && c.is_active);
        if (remainingActive.length > 0) {
          setNewExercise(prev => ({ ...prev, category_id: remainingActive[0].id }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al alternar el estado de la categoría.');
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

  // Contar ejercicios por categoría
  const getExerciseCountByCategory = (catId) => {
    return exercises.filter(e => e.category_id === catId).length;
  };

  return (
    <div className="view-container">
      {/* Header & Actions */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            Parrilla de Ejercicios
          </h1>
          <p className="view-subtitle">
            Catálogo multimedia con demostraciones en video para los alumnos
          </p>
        </div>

        {isCoachOrAdmin && (
          <div className="view-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowCategoryManagerModal(true);
                setCategoryFormOpen(false);
                setEditingCategory(null);
                setCategoryMsg({ type: '', text: '' });
              }}
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
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(110, 136, 66, 0.5)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)'}
            >
              <FolderCog size={17} color="#DEEAC1" />
              Gestionar Categorías
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
        <div className="scroll-touch-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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
              color: selectedCategory === 'all' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            Todas ({exercises.length})
          </button>
          {categories.map((cat) => {
            const hasExercises = getExerciseCountByCategory(cat.id) > 0;
            // Si la categoría está inactiva y no tiene ejercicios, la ocultamos en los filtros públicos
            if (!cat.is_active && !hasExercises && !isCoachOrAdmin) return null;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: cat.is_active ? 'none' : '1px dashed rgba(255, 180, 171, 0.4)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedCategory === cat.id ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-surface-variant)',
                  color: selectedCategory === cat.id ? '#FFF' : cat.is_active ? 'var(--md-sys-color-on-surface-variant)' : 'rgba(255, 180, 171, 0.8)',
                  opacity: cat.is_active ? 1 : 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {cat.name}
                {!cat.is_active && (
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--md-sys-color-error)' }}>
                    (Deshabilitada)
                  </span>
                )}
              </button>
            );
          })}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {filteredExercises.map((exercise) => {
            const thumbUrl = getYouTubeThumbnail(exercise.youtube_url);
            const categoryObj = categories.find(c => c.id === exercise.category_id);
            const isCatActive = categoryObj ? categoryObj.is_active : true;

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
                    backgroundColor: isCatActive ? 'rgba(20, 26, 20, 0.85)' : 'rgba(40, 20, 20, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: isCatActive ? 'var(--md-sys-color-secondary)' : '#FFB4AB',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: isCatActive ? '1px solid var(--md-sys-color-outline-variant)' : '1px solid rgba(255, 180, 171, 0.4)'
                  }}>
                    {exercise.category?.name || 'General'}
                    {!isCatActive && ' (Archivada)'}
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
          <div className="responsive-modal-box" style={{ ...modalBoxStyle, width: '100%', maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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
                <label style={labelStyle}>Categoría Muscular *</label>
                <select
                  value={newExercise.category_id}
                  onChange={(e) => setNewExercise({ ...newExercise, category_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  {categories.filter(c => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  Solo se listan las categorías activas en el sistema.
                </span>
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

      {/* Modal: GESTIÓN INTEGRAL DE CATEGORÍAS (Crear, Editar, Habilitar/Deshabilitar) */}
      {showCategoryManagerModal && (
        <div style={modalBackdropStyle} onClick={() => setShowCategoryManagerModal(false)}>
          <div 
            className="responsive-modal-box" 
            style={{ 
              ...modalBoxStyle, 
              width: '100%', 
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(110, 136, 66, 0.2)',
                  border: '1px solid rgba(137, 168, 84, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderCog size={20} color="#DEEAC1" />
                </div>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#FFF' }}>
                    Gestión de Categorías Musculares
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                    Crea, edita y habilita o deshabilita categorías sin romper ejercicios existentes
                  </p>
                </div>
              </div>

              {!categoryFormOpen && (
                <button
                  onClick={handleOpenNewCategory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(110, 136, 66, 0.4)'
                  }}
                >
                  <Plus size={15} />
                  Nueva Categoría
                </button>
              )}
            </div>

            {/* Mensajes de Alerta/Éxito */}
            {categoryMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: categoryMsg.type === 'error' ? 'rgba(255, 180, 171, 0.15)' : 'rgba(110, 136, 66, 0.2)',
                border: categoryMsg.type === 'error' ? '1px solid rgba(255, 180, 171, 0.3)' : '1px solid rgba(137, 168, 84, 0.4)',
                color: categoryMsg.type === 'error' ? 'var(--md-sys-color-error)' : '#DEEAC1'
              }}>
                {categoryMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{categoryMsg.text}</span>
              </div>
            )}

            {/* Formulario de Creación / Edición */}
            {categoryFormOpen && (
              <form 
                onSubmit={handleSaveCategory}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(110, 136, 66, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#DEEAC1' }}>
                    {editingCategory ? `Editar Categoría: "${editingCategory.name}"` : 'Crear Nueva Categoría'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFormOpen(false);
                      setEditingCategory(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>Nombre de la Categoría *</label>
                  <input
                    type="text"
                    placeholder="Ej: Glúteos y Cadera"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Descripción / Músculos Principales</label>
                  <textarea
                    rows="2"
                    placeholder="Ej: Músculos extensores y abductores de cadera..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="cat_is_active"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    style={{ width: '17px', height: '17px', accentColor: '#89A854', cursor: 'pointer' }}
                  />
                  <label htmlFor="cat_is_active" style={{ fontSize: '13px', color: '#FFF', cursor: 'pointer' }}>
                    Categoría Activa (Visible al prescribir y crear nuevos ejercicios)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFormOpen(false);
                      setEditingCategory(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingCategory}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: savingCategory ? 'not-allowed' : 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {savingCategory ? 'Guardando...' : editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}
                  </button>
                </div>
              </form>
            )}

            {/* Listado de Categorías Existentes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Categorías en el Sistema ({categories.length})
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-tertiary)' }}>
                  {categories.filter(c => c.is_active).length} activas · {categories.filter(c => !c.is_active).length} deshabilitadas
                </span>
              </div>

              {categories.map((cat) => {
                const exCount = getExerciseCountByCategory(cat.id);
                const isEditingThis = editingCategory?.id === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="category-item-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      backgroundColor: isEditingThis 
                        ? 'rgba(110, 136, 66, 0.15)' 
                        : cat.is_active ? 'var(--md-sys-color-surface-variant)' : 'rgba(25, 20, 20, 0.6)',
                      border: isEditingThis 
                        ? '1px solid rgba(137, 168, 84, 0.6)' 
                        : cat.is_active ? '1px solid var(--md-sys-color-outline-variant)' : '1px dashed rgba(255, 180, 171, 0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Información de la Categoría */}
                    <div style={{ flex: 1, minWidth: 0, marginRight: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '14.5px', 
                          fontWeight: 700, 
                          color: cat.is_active ? '#FFF' : 'rgba(255, 255, 255, 0.6)' 
                        }}>
                          {cat.name}
                        </span>
                        
                        {/* Badge de Estado */}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: cat.is_active ? 'rgba(110, 136, 66, 0.25)' : 'rgba(255, 180, 171, 0.15)',
                          border: cat.is_active ? '1px solid rgba(137, 168, 84, 0.4)' : '1px solid rgba(255, 180, 171, 0.3)',
                          color: cat.is_active ? '#DEEAC1' : 'var(--md-sys-color-error)'
                        }}>
                          {cat.is_active ? 'Activa' : 'Deshabilitada'}
                        </span>

                        {/* Contador de ejercicios vinculados */}
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--md-sys-color-tertiary)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 6px',
                          borderRadius: '6px'
                        }}>
                          {exCount} ej.
                        </span>
                      </div>

                      {cat.description && (
                        <p style={{ 
                          fontSize: '12px', 
                          color: cat.is_active ? 'var(--md-sys-color-on-surface-variant)' : 'rgba(255, 255, 255, 0.4)', 
                          marginTop: '3px',
                          lineHeight: 1.4
                        }}>
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Acciones de la Categoría */}
                    <div className="category-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Botón Editar */}
                      <button
                        onClick={() => handleEditCategory(cat)}
                        title="Editar nombre y descripción"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          color: 'var(--md-sys-color-on-surface)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)';
                          e.currentTarget.style.color = '#DEEAC1';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.color = 'var(--md-sys-color-on-surface)';
                        }}
                      >
                        <Pencil size={13} />
                        Editar
                      </button>

                      {/* Botón Alternar Estado (Habilitar / Deshabilitar) */}
                      <button
                        onClick={(e) => handleToggleCategoryStatus(cat, e)}
                        title={cat.is_active ? "Deshabilitar categoría (no afectará ejercicios históricos)" : "Habilitar categoría"}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: cat.is_active ? 'rgba(255, 180, 171, 0.12)' : 'rgba(110, 136, 66, 0.2)',
                          border: cat.is_active ? '1px solid rgba(255, 180, 171, 0.25)' : '1px solid rgba(137, 168, 84, 0.4)',
                          color: cat.is_active ? 'var(--md-sys-color-error)' : '#DEEAC1',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '0.85';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <Power size={13} />
                        {cat.is_active ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer del Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setShowCategoryManagerModal(false)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  color: '#FFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Cerrar
              </button>
            </div>
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
