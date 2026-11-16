import React, { useState, useEffect } from 'react';
import { X, Play, Film, ExternalLink } from 'lucide-react';

export const VideoModal = ({ isOpen, onClose, exercise, initialTab = 'youtube' }) => {
  const [activeMediaTab, setActiveMediaTab] = useState(initialTab);

  useEffect(() => {
    if (exercise?.gif_url && !exercise?.youtube_url) {
      setActiveMediaTab('gif');
    } else if (initialTab) {
      setActiveMediaTab(initialTab);
    } else {
      setActiveMediaTab('youtube');
    }
  }, [exercise, initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !exercise) return null;

  // Extract YouTube ID for embed
  const extractVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(exercise.youtube_url || '');
  const hasBoth = Boolean(exercise.youtube_url && exercise.gif_url);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
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
        style={{
          width: '100%',
          maxWidth: '860px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: '24px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-elevation-3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-variant)'
        }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--md-sys-color-secondary)',
                backgroundColor: 'var(--md-sys-color-secondary-container)',
                padding: '3px 8px',
                borderRadius: '8px'
              }}>
                {exercise.category ? exercise.category.name : 'Técnica de Ejercicio'}
              </span>
              {exercise.gif_url && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#DEEAC1',
                  backgroundColor: 'rgba(110, 136, 66, 0.3)',
                  border: '1px solid rgba(137, 168, 84, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  GIF 3D Disponible
                </span>
              )}
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--md-sys-color-on-surface)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {exercise.name}
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
              justifyContent: 'center',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher si dispone de ambos (YouTube y GIF) */}
        {hasBoth && (
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={() => setActiveMediaTab('youtube')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: activeMediaTab === 'youtube' ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid transparent',
                backgroundColor: activeMediaTab === 'youtube' ? 'rgba(110, 136, 66, 0.3)' : 'transparent',
                color: activeMediaTab === 'youtube' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: activeMediaTab === 'youtube' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={16} color={activeMediaTab === 'youtube' ? '#DEEAC1' : 'currentColor'} />
              <span>Video Completo (YouTube)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMediaTab('gif')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: activeMediaTab === 'gif' ? '1px solid rgba(137, 168, 84, 0.6)' : '1px solid transparent',
                backgroundColor: activeMediaTab === 'gif' ? 'rgba(110, 136, 66, 0.3)' : 'transparent',
                color: activeMediaTab === 'gif' ? '#FFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: activeMediaTab === 'gif' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Film size={16} color={activeMediaTab === 'gif' ? '#DEEAC1' : 'currentColor'} />
              <span>Técnica en Bucle (GIF 3D)</span>
            </button>
          </div>
        )}

        {/* Media Player Display */}
        <div style={{
          position: 'relative',
          backgroundColor: '#090D0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '340px',
          maxHeight: '520px',
          overflow: 'hidden'
        }}>
          {activeMediaTab === 'gif' && exercise.gif_url ? (
            <div style={{
              width: '100%',
              height: '100%',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              position: 'relative'
            }}>
              <img
                src={exercise.gif_url}
                alt={exercise.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc.includes('cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB')) {
                    e.currentTarget.src = currentSrc.replace(
                      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0',
                      'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main'
                    );
                  }
                }}
                style={{
                  maxHeight: '440px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(110, 136, 66, 0.25)'
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: '22px',
                backgroundColor: 'rgba(13, 17, 14, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(110, 136, 66, 0.3)',
                color: '#DEEAC1',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em'
              }}>
                Loop continuo de ejecución
              </span>
            </div>
          ) : videoId ? (
            <div style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9
              backgroundColor: '#000'
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={exercise.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : exercise.gif_url ? (
            /* Fallback si no hay videoId pero hay gif */
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <img
                src={exercise.gif_url}
                alt={exercise.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc.includes('cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB')) {
                    e.currentTarget.src = currentSrc.replace(
                      'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0',
                      'https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main'
                    );
                  }
                }}
                style={{ maxHeight: '400px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }}
              />
            </div>
          ) : (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: '14px'
            }}>
              No se encontró un video ni GIF compatible para este ejercicio.
            </div>
          )}
        </div>

        {/* Footer / Description */}
        {exercise.description && (
          <div style={{
            padding: '16px 22px',
            backgroundColor: 'var(--md-sys-color-surface)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            overflowY: 'auto',
            maxHeight: '140px'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-sys-color-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instrucciones y Claves de Técnica:
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5 }}>
              {exercise.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
