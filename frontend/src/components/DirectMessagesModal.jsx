import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, Search, RefreshCw, CheckCheck, Check } from 'lucide-react';
import api from '../services/api';

export const DirectMessagesModal = ({ isOpen, onClose, user, initialStudentId = null, onMessagesRead = () => {} }) => {
  const isStudent = user?.role === 'user';
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar lista de alumnos si el usuario es Coach/Admin
  useEffect(() => {
    if (!isOpen) return;

    if (!isStudent) {
      api.get('/users/students')
        .then(res => {
          setStudents(res.data || []);
          if (initialStudentId) {
            const found = res.data.find(s => s.id === initialStudentId);
            if (found) setSelectedStudent(found);
            else if (res.data.length > 0) setSelectedStudent(res.data[0]);
          } else if (res.data.length > 0) {
            setSelectedStudent(prev => prev || res.data[0]);
          }
        })
        .catch(err => console.error('Error cargando alumnos para chat:', err));
    } else {
      // El alumno chatea consigo mismo como ID de estudiante
      setSelectedStudent(user);
    }
  }, [isOpen, isStudent, initialStudentId, user]);

  // Cargar mensajes cuando cambia el alumno seleccionado o al abrir
  const fetchMessages = async (silent = false) => {
    const studentId = isStudent ? user?.id : selectedStudent?.id;
    if (!studentId) return;

    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.get(`/users/messages/${studentId}`);
      setMessages(res.data || []);
      onMessagesRead();
    } catch (err) {
      console.error('Error al obtener mensajes:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen && (selectedStudent || isStudent)) {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(true), 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedStudent, isStudent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    const studentId = isStudent ? user?.id : selectedStudent?.id;
    if (!text || !studentId || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/users/messages/${studentId}`, { content: text });
      setMessages(prev => [...prev, res.data]);
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert('Error enviando mensaje: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.rut || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(5, 8, 6, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: isStudent ? '560px' : '900px',
        height: '85vh',
        maxHeight: '720px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(110, 136, 66, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(110, 136, 66, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(20, 26, 21, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(110, 136, 66, 0.3)'
            }}>
              <MessageSquare size={18} color="#FFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
                {isStudent ? 'Mensaje Directo con tu Coach' : 'Inbox de Alumnos (TrueCoach Chat)'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isStudent ? 'Feedback, dudas sobre ejercicios y seguimiento personalizado' : 'Conversación privada 1 a 1'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#FFF',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Alumnos (solo Coach/Admin) */}
          {!isStudent && (
            <div style={{
              width: '280px',
              borderRight: '1px solid rgba(110, 136, 66, 0.15)',
              background: 'rgba(15, 20, 16, 0.85)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(110, 136, 66, 0.15)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(110, 136, 66, 0.2)'
                }}>
                  <Search size={14} color="var(--md-sys-color-on-surface-variant)" />
                  <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFF',
                      fontSize: '12px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                {filteredStudents.map(st => {
                  const isSelected = selectedStudent?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid rgba(110, 136, 66, 0.5)' : '1px solid transparent',
                        background: isSelected ? 'rgba(110, 136, 66, 0.2)' : 'transparent',
                        color: isSelected ? '#DEEAC1' : 'var(--md-sys-color-on-surface-variant)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '4px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(110, 136, 66, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={15} color="#DEEAC1" />
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#FFF' }}>
                          {st.name || st.rut}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--md-sys-color-outline)' }}>
                          {st.rut}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10, 14, 11, 0.95)' }}>
            {/* Conversation Active Header */}
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid rgba(110, 136, 66, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(18, 24, 19, 0.6)'
            }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFF' }}>
                  {isStudent ? 'Coach Mottus' : (selectedStudent?.name || selectedStudent?.rut || 'Seleccione un alumno')}
                </span>
                {!isStudent && selectedStudent && (
                  <span style={{ fontSize: '11px', color: 'var(--md-sys-color-tertiary)', marginLeft: '8px' }}>
                    RUT: {selectedStudent.rut}
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchMessages(false)}
                title="Actualizar chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Messages Scrollable List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loadingMessages && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Cargando conversación...
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  margin: 'auto',
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  maxWidth: '300px'
                }}>
                  <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    No hay mensajes en este canal todavía. ¡Inicia la conversación para dar o recibir feedback!
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = isStudent ? msg.sender_role === 'student' : msg.sender_role === 'coach';
                  const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        backgroundColor: isMine ? 'rgba(110, 136, 66, 0.45)' : 'rgba(255, 255, 255, 0.08)',
                        border: isMine ? '1px solid rgba(137, 168, 84, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFF',
                        fontSize: '13.5px',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {msg.content}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '3px',
                        fontSize: '10.5px',
                        color: 'var(--md-sys-color-outline)'
                      }}>
                        <span>{dateStr}</span>
                        {isMine && (
                          msg.is_read ? <CheckCheck size={12} color="#89A854" /> : <Check size={12} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Bar */}
            <form onSubmit={handleSendMessage} style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(110, 136, 66, 0.2)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              background: 'rgba(18, 24, 19, 0.8)'
            }}>
              <input
                type="text"
                placeholder={isStudent ? "Escribe un mensaje a tu coach..." : "Escribe un mensaje al alumno..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending || (!isStudent && !selectedStudent)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(110, 136, 66, 0.3)',
                  color: '#FFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending || (!isStudent && !selectedStudent)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6E8842 0%, #4D602E 100%)',
                  color: '#FFF',
                  cursor: (!inputText.trim() || sending) ? 'not-allowed' : 'pointer',
                  opacity: (!inputText.trim() || sending) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 10px rgba(110, 136, 66, 0.3)'
                }}
              >
                <Send size={15} />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

