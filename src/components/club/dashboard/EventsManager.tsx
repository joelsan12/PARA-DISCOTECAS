import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Music,
  Clock,
  DollarSign,
  User,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Radio
} from 'lucide-react';
import { useClubStore } from '../../../store/clubStore';
import type { Club, ClubEvent } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { upsertBusinessEventRemote } from '../../../services/firebaseService';

interface Props {
  activeClub: Club;
}

interface EventFormData {
  id?: string;
  title: string;
  subtitle: string;
  date: string;
  day_label: string;
  door_time: string;
  cover_price: number;
  dj_guest: string;
  genre: string;
  flyer_url: string;
  is_published: boolean;
}

const DEFAULT_FORM_DATA: EventFormData = {
  title: '',
  subtitle: '',
  date: new Date().toISOString().split('T')[0],
  day_label: '',
  door_time: '22:00',
  cover_price: 20,
  dj_guest: '',
  genre: 'Crossover / Reggaeton / Open Format',
  flyer_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
  is_published: true
};

export const EventsManager = ({ activeClub }: Props) => {
  const store = useClubStore();
  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData(DEFAULT_FORM_DATA);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: ClubEvent) => {
    setEditingEvent(event);
    setFormData({
      id: event.id,
      title: event.title,
      subtitle: event.subtitle || '',
      date: event.date,
      day_label: event.day_label || '',
      door_time: event.door_time || '22:00',
      cover_price: event.cover_price || 0,
      dj_guest: event.dj_guest || '',
      genre: event.genre || '',
      flyer_url: event.flyer_url || '',
      is_published: event.is_published
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (event: ClubEvent) => {
    try {
      setIsSaving(true);
      await upsertBusinessEventRemote({
        businessId: activeClub.id,
        eventId: event.id,
        title: event.title,
        subtitle: event.subtitle,
        date: event.date,
        day_label: event.day_label,
        door_time: event.door_time,
        cover_price: event.cover_price,
        dj_guest: event.dj_guest,
        genre: event.genre,
        flyer_url: event.flyer_url,
        is_published: !event.is_published
      });
    } catch (err: unknown) {
      console.error('Error al cambiar visibilidad del evento:', err);
      alert('No se pudo cambiar el estado del evento. Revisa tu conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.title.trim()) {
      setErrorMessage('El título del evento es obligatorio');
      return;
    }
    if (!formData.date.trim()) {
      setErrorMessage('La fecha del evento es obligatoria');
      return;
    }

    try {
      setIsSaving(true);
      // Auto-generar day_label si se dejó vacío
      let dayLabel = formData.day_label.trim();
      if (!dayLabel && formData.date) {
        try {
          const [y, m, d] = formData.date.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
          dayLabel = dateObj.toLocaleDateString('es-EC', options);
          dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
        } catch {
          dayLabel = formData.date;
        }
      }

      const result = await upsertBusinessEventRemote({
        businessId: activeClub.id,
        eventId: editingEvent ? editingEvent.id : undefined,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        date: formData.date,
        day_label: dayLabel,
        door_time: formData.door_time,
        cover_price: Number(formData.cover_price) || 0,
        dj_guest: formData.dj_guest.trim(),
        genre: formData.genre.trim(),
        flyer_url: formData.flyer_url.trim(),
        is_published: formData.is_published
      });

      if (result.success) {
        setSuccessMessage(editingEvent ? 'Evento actualizado exitosamente' : '¡Evento creado y publicado en cartelera!');
        if (!store.activeEventId) {
          store.setActiveEvent(result.eventId);
        }
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1200);
      }
    } catch (err: unknown) {
      console.error('Error guardando evento:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el evento en la nube';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Header con Resumen y Botón de Creación */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(229, 181, 79, 0.12)',
              border: '1px solid rgba(229, 181, 79, 0.3)',
              color: 'var(--brand-gold)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              <CalendarDays size={12} /> Cartelera en Vivo
            </span>
          </div>
          <h2 className="font-brand" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Programación y Eventos Oficiales
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', margin: '4px 0 0' }}>
            Los eventos publicados aparecen automáticamente en tu portal para clientes y habilitan la venta y reserva de mesas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="admin-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            background: 'linear-gradient(135deg, #e5b54f 0%, #c99833 100%)',
            color: '#08080c',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(229, 181, 79, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      {/* 2. Empty State VIP cuando no hay eventos */}
      {clubEvents.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '56px 32px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(16, 17, 26, 0.95) 0%, rgba(10, 11, 16, 0.98) 100%)',
            border: '1px solid rgba(229, 181, 79, 0.25)',
            borderRadius: '18px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(229, 181, 79, 0.12)',
              border: '1px solid rgba(229, 181, 79, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--brand-gold)',
              boxShadow: '0 0 25px rgba(229, 181, 79, 0.15)'
            }}
          >
            <CalendarDays size={32} />
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--brand-gold)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '8px'
            }}
          >
            Cartelera Lista para Inaugurar
          </span>

          <h3
            className="font-brand"
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '10px'
            }}
          >
            Aún no has creado eventos en {activeClub.name}
          </h3>

          <p
            style={{
              color: 'var(--text-dim)',
              fontSize: '0.9rem',
              maxWidth: '520px',
              margin: '0 auto 28px',
              lineHeight: 1.6
            }}
          >
            Crea tu primer evento para activar la fecha, definir el DJ invitado, fijar el valor de cover y permitir que tus clientes reserven mesas en tiempo real.
          </p>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="admin-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.92rem',
              background: 'linear-gradient(135deg, #e5b54f 0%, #c99833 100%)',
              color: '#08080c',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(229, 181, 79, 0.3)'
            }}
          >
            <Sparkles size={18} /> Publicar Mi Primer Evento
          </button>
        </div>
      ) : (
        /* 3. Grid de Eventos Registrados */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {clubEvents.map((evt) => {
            const isActiveInConsole = store.activeEventId === evt.id;

            return (
              <div
                key={evt.id}
                className="glass-card"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(18, 19, 28, 0.95) 0%, rgba(10, 11, 16, 0.98) 100%)',
                  border: isActiveInConsole
                    ? '1.5px solid var(--brand-gold)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActiveInConsole
                    ? '0 8px 30px rgba(229, 181, 79, 0.18)'
                    : '0 4px 20px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Banner / Flyer Header */}
                <div style={{
                  position: 'relative',
                  height: '140px',
                  background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(10,11,16,0.95) 100%), url(${evt.flyer_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200'}) center/cover`
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    {evt.is_published ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                      }}>
                        <Eye size={10} /> PUBLICADO
                      </span>
                    ) : (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(234, 179, 8, 0.9)',
                        color: '#08080c',
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <EyeOff size={10} /> BORRADOR
                      </span>
                    )}

                    {isActiveInConsole && (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(229, 181, 79, 0.9)',
                        color: '#08080c',
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Radio size={10} /> EN CONSOLA
                      </span>
                    )}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '14px',
                    right: '14px'
                  }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--brand-gold)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block'
                    }}>
                      {evt.day_label || evt.date}
                    </span>
                    <h3 style={{
                      margin: '2px 0 0',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#fff',
                      lineHeight: 1.2
                    }}>
                      {evt.title}
                    </h3>
                  </div>
                </div>

                {/* Body Card */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evt.subtitle && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {evt.subtitle}
                    </p>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.76rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                      <Clock size={12} color="var(--brand-gold)" />
                      <span>Puerta: <strong style={{ color: '#fff' }}>{evt.door_time}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                      <DollarSign size={12} color="var(--brand-gold)" />
                      <span>Cover: <strong style={{ color: '#10b981' }}>{formatUsd(evt.cover_price)}</strong></span>
                    </div>

                    {evt.dj_guest && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', gridColumn: 'span 2' }}>
                        <User size={12} color="var(--brand-gold)" />
                        <span>DJ: <strong style={{ color: '#fff' }}>{evt.dj_guest}</strong></span>
                      </div>
                    )}

                    {evt.genre && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', gridColumn: 'span 2' }}>
                        <Music size={12} color="var(--brand-gold)" />
                        <span>Género: <strong style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{evt.genre}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <button
                      type="button"
                      onClick={() => store.setActiveEvent(evt.id)}
                      disabled={isActiveInConsole}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: isActiveInConsole ? 'rgba(229, 181, 79, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isActiveInConsole ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.8)',
                        border: isActiveInConsole ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: isActiveInConsole ? 'default' : 'pointer'
                      }}
                    >
                      {isActiveInConsole ? '✓ Seleccionado' : 'Operar en Consola'}
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(evt)}
                        title={evt.is_published ? 'Ocultar del portal' : 'Publicar en el portal'}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: evt.is_published ? '#10b981' : '#eab308',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {evt.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(evt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: 'rgba(229, 181, 79, 0.12)',
                          color: 'var(--brand-gold)',
                          border: '1px solid rgba(229, 181, 79, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal Crear / Editar Evento */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 4, 7, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, rgba(20, 21, 30, 0.98) 0%, rgba(12, 13, 20, 0.99) 100%)',
              border: '1px solid rgba(229, 181, 79, 0.3)',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--brand-gold)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  {editingEvent ? 'Edición de Evento' : 'Nueva Fecha en Cartelera'}
                </span>
                <h3 className="font-brand" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>
                  {editingEvent ? editingEvent.title : 'Crear Evento Oficial'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej. Black & Gold VIP Night"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Subtítulo / Temática
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ej. Edición especial con barra libre de cortesía"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Fecha del Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.86rem',
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    value={formData.door_time}
                    onChange={e => setFormData({ ...formData, door_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.86rem',
                      colorScheme: 'dark'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Precio Cover General (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.cover_price}
                    onChange={e => setFormData({ ...formData, cover_price: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    DJ Invitado / Artista
                  </label>
                  <input
                    type="text"
                    value={formData.dj_guest}
                    onChange={e => setFormData({ ...formData, dj_guest: e.target.value })}
                    placeholder="Ej. DJ Martin"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Género Musical
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={e => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="Ej. Reggaeton, Tech House, Urban Pop"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  URL del Flyer / Imagen Promocional
                </label>
                <input
                  type="url"
                  value={formData.flyer_url}
                  onChange={e => setFormData({ ...formData, flyer_url: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(229, 181, 79, 0.08)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                marginTop: '4px'
              }}>
                <input
                  type="checkbox"
                  id="event_is_published"
                  checked={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-gold)', cursor: 'pointer' }}
                />
                <label htmlFor="event_is_published" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  Publicar evento inmediatamente en la página pública del club
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #e5b54f 0%, #c99833 100%)',
                    color: '#08080c',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(229, 181, 79, 0.3)',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Guardando en la nube...' : (editingEvent ? 'Guardar Cambios' : 'Publicar Evento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
