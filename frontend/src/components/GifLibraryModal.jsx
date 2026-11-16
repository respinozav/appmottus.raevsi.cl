import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Dumbbell, Sparkles, Film } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

export const GifLibraryModal = ({ isOpen, onClose, onSelect, currentGifUrl }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [visibleCount, setVisibleCount] = useState(36);

  useEffect(() => {
    setVisibleCount(36);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchGifs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/exercises/library-gifs');
        setExercises(res.data.exercises || []);
      } catch (err) {
        console.error('Error al cargar catálogo de GIFs:', err);
        setError('No se pudo cargar la biblioteca de GIFs. Por favor reintenta.');
      } finally {
        setLoading(false);
      }
    };

    fetchGifs();
  }, [isOpen]);

  // Filtrado local instantáneo para máxima velocidad
  const filteredList = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCat =
        selectedCategory === 'Todos' ||
        ex.bodyPart?.toLowerCase() === selectedCategory.toLowerCase();

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        ex.name?.toLowerCase().includes(term) ||
        ex.muscle?.toLowerCase().includes(term) ||
        ex.equipment?.toLowerCase().includes(term);

      return matchCat && matchSearch;
    });
  }, [exercises, selectedCategory, searchTerm]);

  const displayedList = useMemo(() => {
    return filteredList.slice(0, visibleCount);
  }, [filteredList, visibleCount]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 5, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="responsive-modal-box"
        style={{
          width: '100%',
          maxWidth: '920px',
          height: '90vh',
          maxHeight: '840px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-elevation-3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-variant)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--md-sys-color-secondary)',
                  backgroundColor: 'var(--md-sys-color-secondary-container)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                Biblioteca Gratuita
              </span>
              <span style={{ fontSize: '12px', color: '#DEEAC1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} color="#89A854" /> 1,300+ Demostraciones en Bucle
              </span>
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface)',
                marginTop: '4px'
              }}
            >
              Seleccionar GIF Animado de Técnica
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="var(--md-sys-color-outline)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Buscar por ejercicio (ej. Press banca, Sentadilla, Curl, Polea, Dominadas)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 42px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: '#FFF',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: isActive ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isActive ? 'rgba(110, 136, 66, 0.35)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--md-sys-color-tertiary)' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(110, 136, 66, 0.2)',
                  borderTopColor: 'var(--md-sys-color-primary-light)',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              Cargando catálogo de animaciones 3D...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#FFB4AB' }}>{error}</div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              No se encontraron ejercicios con ese criterio. Prueba con otra búsqueda o selecciona "Todos".
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px'
              }}
            >
              {displayedList.map((item) => {
                const isCurrent = currentGifUrl === item.gifUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="md-card"
                    style={{
                      cursor: 'pointer',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: isCurrent
                        ? '2px solid var(--md-sys-color-primary-light)'
                        : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: isCurrent ? 'rgba(110, 136, 66, 0.12)' : 'var(--md-sys-color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(137, 168, 84, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = isCurrent
                        ? 'var(--md-sys-color-primary-light)'
                        : 'var(--md-sys-color-outline-variant)';
                    }}
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      style={{
                        position: 'relative',
                        paddingTop: '65%',
                        backgroundColor: '#0A0E0B',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={item.gifUrl}
                        alt={item.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const currentSrc = e.currentTarget.src;
                          if (currentSrc.includes('cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB')) {
                            e.currentTarget.src = currentSrc.replace(
                              'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0',
                              'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main'
                            );
                          } else {
                            // Ocultar si falla también el fallback de github raw para evitar el ícono roto
                            e.currentTarget.style.opacity = '0';
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '4px',
                          transition: 'opacity 0.2s ease'
                        }}
                      />
                      {isCurrent && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'var(--md-sys-color-primary)',
                            color: '#FFF',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#DEEAC1',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.bodyPart}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: '#FFF',
                          marginBottom: '4px',
                          lineHeight: 1.3
                        }}
                      >
                        {item.name}
                      </h4>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--md-sys-color-tertiary)',
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Dumbbell size={12} />
                        <span>{item.equipment || 'General'}</span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{item.muscle}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {visibleCount < filteredList.length && !loading && !error && (
            <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 36)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(110, 136, 66, 0.25)',
                  border: '1px solid rgba(137, 168, 84, 0.45)',
                  color: '#DEEAC1',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.4)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(110, 136, 66, 0.25)')}
              >
                <Sparkles size={14} color="#89A854" />
                Cargar más animaciones ({filteredList.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'var(--md-sys-color-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)'
          }}
        >
          <span>
            Mostrando {Math.min(visibleCount, filteredList.length)} de {filteredList.length} animaciones disponibles
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#FFF',
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
