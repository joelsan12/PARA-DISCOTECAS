import React, { useState } from 'react';
import { Sparkles, X, Code, ShieldCheck, Zap } from 'lucide-react';
import type { Club, ClubProposal } from '../../types';

interface ImplementCustomFeatureModalProps {
  isOpen: boolean;
  club: Club | null;
  proposal: ClubProposal | null;
  onImplement: (
    clubId: string,
    featureData: { name: string; key: string; description: string; notes?: string },
    proposalId?: string
  ) => void;
  onClose: () => void;
}

export const ImplementCustomFeatureModal: React.FC<ImplementCustomFeatureModalProps> = ({
  isOpen,
  club,
  proposal,
  onImplement,
  onClose,
}) => {
  if (!isOpen || !club) return null;

  return (
    <ImplementCustomFeatureDialog
      key={`${club.id}-${proposal?.id || 'new'}`}
      club={club}
      proposal={proposal}
      onImplement={onImplement}
      onClose={onClose}
    />
  );
};

interface DialogProps {
  club: Club;
  proposal: ClubProposal | null;
  onImplement: (
    clubId: string,
    featureData: { name: string; key: string; description: string; notes?: string },
    proposalId?: string
  ) => void;
  onClose: () => void;
}

const ImplementCustomFeatureDialog: React.FC<DialogProps> = ({
  club,
  proposal,
  onImplement,
  onClose,
}) => {
  const initialName = proposal?.title || '';
  const initialKey = proposal?.title
    ? proposal.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24)
    : '';
  const initialDesc = proposal?.proposed_benefit || proposal?.description || '';

  const [name, setName] = useState(initialName);
  const [key, setKey] = useState(initialKey);
  const [description, setDescription] = useState(initialDesc);
  const [notes, setNotes] = useState('Implementado y validado en sandbox para este establecimiento.');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para el módulo personalizado.');
      return;
    }
    if (!key.trim()) {
      setError('Por favor indica una clave identificadora (ej: CUSTOM_SPLIT_PAY).');
      return;
    }

    onImplement(
      club.id,
      {
        name: name.trim(),
        key: key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        description: description.trim(),
        notes: notes.trim(),
      },
      proposal?.id
    );
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content glass-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          border: '1px solid var(--border-focus, rgba(229, 181, 79, 0.4))',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(229, 181, 79, 0.12)',
          overflow: 'hidden',
          animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(229, 181, 79, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.15)',
                border: '1px solid rgba(229, 181, 79, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold, #e5b54f)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                Implementar Beneficio Exclusivo
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Se activará única y exclusivamente para <strong>{club.name}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Proposal Origin Banner if applicable */}
          {proposal && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.06)',
                border: '1px solid rgba(229, 181, 79, 0.25)',
                marginBottom: '18px',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--gold, #e5b54f)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Propuesta Enviada por el Cliente
              </span>
              <p style={{ margin: '0 0 4px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high, #ffffff)' }}>
                {proposal.title}
              </p>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {proposal.description}
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: 'var(--state-danger, #f87171)',
                fontSize: '0.78rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Feature Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Nombre del Módulo o Beneficio Exclusivo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: División de Cuentas VIP (Split Bill)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            {/* Feature Key */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Clave de Activación (Feature Flag Exclusiva)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={key}
                  onChange={e => setKey(e.target.value.toUpperCase())}
                  placeholder="CUSTOM_SPLIT_PAY_VIP"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--gold, #e5b54f)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  required
                />
                <Code
                  size={15}
                  color="var(--gold, #e5b54f)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Solo afectará al documento de esta discoteca. Las demás no tendrán acceso.
              </span>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Descripción del Beneficio para el Cliente
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detalla cómo opera la mejora o el acuerdo comercial especial..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Dev Notes / Config */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Notas Técnicas del Desarrollador (Respuesta visible al cliente)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Habilitado con webhook dedicado y soporte en consola."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-high, #ffffff)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Guarantee Pill */}
          <div
            style={{
              marginTop: '20px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={16} color="var(--state-success, #10b981)" />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>
              <strong>Aislamiento estricto:</strong> Ningún otro negocio podrá ver ni usar este módulo.
            </span>
          </div>

          {/* Buttons */}
          <div
            style={{
              marginTop: '22px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-high, #ffffff)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(229, 181, 79, 0.6)',
                background: 'var(--grad-gold)',
                color: 'var(--bg-void, #08080c)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(229, 181, 79, 0.25)',
              }}
            >
              <Zap size={14} />
              Implementar y Activar solo para {club.name}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
