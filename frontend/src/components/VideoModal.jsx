import React, { useEffect } from 'react';
import { X, Play } from 'lucide-react';

export const VideoModal = ({ isOpen, onClose, exercise }) => {
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
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(exercise.youtube_url || '');

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 5, 0.85)',
        backdropFilter: 'blur(12px)',
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
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-variant)'
        }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--md-sys-color-secondary)',
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              padding: '4px 10px',
              borderRadius: '12px'
            }}>
              {exercise.category ? exercise.category.name : 'Técnica de Ejercicio'}
            </span>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--md-sys-color-on-surface)',
              marginTop: '6px'
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
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Embed Player */}
        <div style={{
          position: 'relative',
          paddingTop: '56.25%', // 16:9 aspect ratio
          backgroundColor: '#000'
        }}>
          {videoId ? (
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
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              URL de video no compatible
            </div>
          )}
        </div>

        {/* Footer / Description */}
        {exercise.description && (
          <div style={{ padding: '20px 24px', backgroundColor: 'var(--md-sys-color-surface)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-tertiary)', marginBottom: '4px' }}>
              Instrucciones y Ejecución:
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
              {exercise.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
