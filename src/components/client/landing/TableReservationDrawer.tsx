import type { ClubTable, EventTablePricing, ClubEvent, Reservation } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { esTableZone } from '../../../lib/esLabels';
import { Crown, QrCode } from 'lucide-react';

const genreLabels: Record<string, string> = {
  'Reggaetón Old School & Tech-Latin': 'Reggaetón clásico y Tech-Latin',
  'Melodic Techno & House Party': 'Techno melódico y fiesta House',
  'Afro-House & Deep Tech': 'Afro-House y Deep Tech',
  'Tech House & Club Anthems': 'Tech House y éxitos del club',
};

interface Props {
  selectedTable: ClubTable | null;
  selectedPricing: EventTablePricing | null;
  totalTablesCount: number;
  activeEvent?: ClubEvent;
  whatsappUrl?: string;
  onProceedToHold: () => void;
  clientReservation?: Reservation | null;
  onOpenPass?: () => void;
}

export const TableReservationDrawer = ({
  selectedTable,
  selectedPricing,
  totalTablesCount,
  activeEvent,
  whatsappUrl,
  onProceedToHold,
  clientReservation,
  onOpenPass,
}: Props) => {
  const isTableAvailable = selectedPricing?.status === 'AVAILABLE';
  const eventGenre = activeEvent?.genre
    ? genreLabels[activeEvent.genre] ?? activeEvent.genre
    : 'DJ en vivo';

  return (
    <section style={{
      flexShrink: 0,
      background: 'rgba(14, 14, 21, 0.96)',
      borderTop: '1px solid rgba(229, 181, 79, 0.25)',
      padding: selectedTable ? '14px 16px 16px' : '14px 16px 20px',
      borderRadius: '24px 24px 0 0',
      boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(20px)',
      zIndex: 30,
      animation: selectedTable ? 'slide-up-drawer 0.3s ease-out' : undefined,
    }}>
      {/* Drag pill indicator */}
      <div style={{
        width: '36px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '9999px',
        margin: '0 auto 12px',
      }} />

      {selectedTable && selectedPricing ? (
        <>
          {/* Selected Table Metadata */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-high)',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}>
                  Mesa {selectedTable.table_code}
                </h2>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 500,
                  color: 'var(--brand-gold)',
                  background: 'rgba(229, 195, 120, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(229, 195, 120, 0.2)',
                }}>
                  {esTableZone(selectedTable.zone)}
                </span>
              </div>
              <p style={{
                fontSize: '0.68rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '3px',
              }}>
                Capacidad máx: <strong style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>{selectedTable.capacity} personas</strong> • Acceso prioritario
              </p>
            </div>
            {/* Price */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', display: 'block', lineHeight: 1.2 }}>
                Consumo mín.
              </span>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-high)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontFamily: 'var(--font-display)',
              }}>
                {formatUsd(selectedPricing.min_spend)}
              </span>
            </div>
          </div>

          {/* Bottle credit notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '8px 10px',
            marginBottom: '12px',
            fontSize: '0.68rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>100% canjeable en botellas &amp; shishas</span>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--brand-gold)', fontWeight: 500 }}>
              Selección premium
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* WhatsApp concierge */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                style={{
                  width: '44px',
                  height: '44px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-whatsapp, #25D366)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="20" height="20" fill="var(--brand-whatsapp, #25D366)" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.53 1.77.781 2.796.781 3.182 0 5.768-2.587 5.768-5.766 0-3.18-2.586-5.767-5.768-5.767zm9.969 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-5.181 1.359 1.385-5.056c-.886-1.488-1.385-3.228-1.385-5.065 0-5.519 4.481-10 10-10s10 4.481 10 10z" />
                </svg>
              </a>
            )}

            {/* Primary CTA */}
            {isTableAvailable ? (
              <button
                onClick={onProceedToHold}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--gold-hover) 0%, var(--gold) 55%, var(--brand-gold-dark) 100%)',
                  color: 'var(--bg-void)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  boxShadow: '0 4px 18px rgba(229, 181, 79, 0.35)',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <span>Reservar Mesa</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'rgba(0,0,0,0.9)' }}>
                  {formatUsd(selectedPricing.deposit_required)}
                  <span style={{ fontSize: '0.55rem', fontWeight: 400, color: 'rgba(0,0,0,0.6)', textTransform: 'lowercase' }}>depósito</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ) : (
              <div style={{
                flex: 1,
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 500,
              }}>
                {selectedPricing.status === 'HELD' ? 'Mesa en proceso de reserva' : 'Mesa ocupada'}
              </div>
            )}
          </div>
        </>
      ) : clientReservation ? (
        /* Estado VIP: cliente tiene mesa reservada activa */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.15) 0%, rgba(26, 27, 38, 0.95) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.45)',
          borderRadius: '16px',
          padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(229, 181, 79, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(229, 181, 79, 0.2)',
              border: '1.5px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Crown size={20} color="var(--gold)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Tu Mesa Reservada
                </span>
                <span style={{
                  fontSize: '0.55rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: clientReservation.status === 'CHECKED_IN' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(229, 181, 79, 0.25)',
                  color: clientReservation.status === 'CHECKED_IN' ? 'var(--state-success)' : 'var(--gold)',
                  fontWeight: 800
                }}>
                  {clientReservation.status === 'CHECKED_IN' ? 'DENTRO' : 'CONFIRMADA'}
                </span>
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-high)', margin: '2px 0 0' }}>
                Mesa {clientReservation.table_code} • {clientReservation.guest_count} Personas
              </h3>
            </div>
          </div>

          {onOpenPass && (
            <button
              type="button"
              onClick={onOpenPass}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, var(--gold-hover) 0%, var(--gold) 100%)',
                border: 'none',
                color: 'var(--bg-void)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(229, 181, 79, 0.3)'
              }}
            >
              <QrCode size={14} />
              <span>Ver Pase VIP</span>
            </button>
          )}
        </div>
      ) : (
        /* Empty state — no table selected */
        <div style={{
          textAlign: 'center',
          padding: '4px 0',
        }}>
          <p style={{
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 500,
          }}>
            {totalTablesCount > 0
              ? 'Toca una mesa en el plano para ver precios y reservar'
              : 'Plano de reservas en preparación'}
          </p>
          <p style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.25)',
            marginTop: '4px',
          }}>
            {totalTablesCount > 0
              ? `${totalTablesCount} mesas disponibles • ${eventGenre}`
              : `Próximamente disponible • ${eventGenre}`}
          </p>
        </div>
      )}
    </section>
  );
};
