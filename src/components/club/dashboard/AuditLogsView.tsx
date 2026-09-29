import type { AuditLog } from '../../../types';
import { formatUsd } from '../../../lib/formatUsd';
import { formatEcuadorPhone, isValidEcuadorMobile } from '../../../lib/formatEcuador';
import {
  esAuditAction,
  esClubStatus,
  esLayout,
  esPlan,
  esRole,
  esTableStatus,
  esTableZone,
  esVenueType,
} from '../../../lib/esLabels';

const localAuditActionLabels: Record<string, string> = {
  CUSTOM_FLOORPLAN_REQUESTED: 'Solicitud de plano a medida',
  PLAN_CHANGED: 'Plan modificado',
};

const auditDetailReplacements: Array<[RegExp, string]> = [
  [/\bCLUB_ADMIN\b/g, esRole('CLUB_ADMIN')],
  [/\bDOOR_CHECKIN\b/g, esRole('DOOR_CHECKIN')],
  [/\bSUPER_ADMIN\b/g, esRole('SUPER_ADMIN')],
  [/\bBASIC\b/g, esPlan('basic')],
  [/\bPRO\b/g, esPlan('pro')],
  [/\bENTERPRISE\b/g, esPlan('enterprise')],
  [/\bACTIVE\b/g, esClubStatus('active')],
  [/\bSUSPENDED\b/g, esClubStatus('suspended')],
  [/\bTRIAL\b/g, esClubStatus('trial')],
  [/\bAVAILABLE\b/g, esTableStatus('AVAILABLE')],
  [/\bHELD\b/g, esTableStatus('HELD')],
  [/\bCONFIRMED\b/g, esTableStatus('CONFIRMED')],
  [/\bCHECKED_IN\b/g, esTableStatus('CHECKED_IN')],
  [/\bEXPIRED\b/g, esTableStatus('EXPIRED')],
  [/\bhorseshoe_vip\b/g, esLayout('horseshoe_vip')],
  [/\bu_amphitheater\b/g, esLayout('u_amphitheater')],
  [/\bdowntown_suites\b/g, esLayout('downtown_suites')],
  [/\bcustom_open\b/g, esLayout('custom_open')],
  [/\bVIP Stage\b/g, esTableZone('VIP Stage')],
  [/\bDance Floor\b/g, esTableZone('Dance Floor')],
  [/\bDJ Booth\b/g, esTableZone('DJ Booth')],
  [/\bTerrace Lounge\b/g, esTableZone('Terrace Lounge')],
  [/\bNIGHTCLUB\b/g, esVenueType('NIGHTCLUB')],
  [/\bROOFTOP\b/g, esVenueType('ROOFTOP')],
  [/\bDiamond VIP\b/g, 'Diamante VIP'],
  [/\bGold VIP\b/g, 'Oro VIP'],
  [/\bBlack Diamond\b/g, 'Diamante Negro'],
];

const formatAuditAction = (action: string) => localAuditActionLabels[action] ?? esAuditAction(action);

const formatAuditDetails = (details: string) => {
  let formattedDetails = details.replace(
    /(?:USD\s*|\$\s*)(\d+(?:[.,]\d{1,2})?)/gi,
    (_match, amount: string) => formatUsd(Number(amount.replace(',', '.'))),
  );

  formattedDetails = formattedDetails.replace(/\+\d[\d\s-]{7,}\d/g, phone => (
    isValidEcuadorMobile(phone) ? formatEcuadorPhone(phone) : 'teléfono no válido'
  ));

  for (const [pattern, label] of auditDetailReplacements) {
    formattedDetails = formattedDetails.replace(pattern, label);
  }

  return formattedDetails;
};

interface Props {
  auditLogs: AuditLog[];
}

export const AuditLogsView = ({ auditLogs }: Props) => {
  return (
    <div className="glass-card" style={{ padding: '22px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
        Registro Inmutable de Eventos del Sistema
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
        {auditLogs.map(log => (
          <div
            key={log.id}
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent)' }}>
                {formatAuditAction(log.action)}
              </span>
              <span style={{ color: '#e2e8f0', marginLeft: '10px' }}>{formatAuditDetails(log.details)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {new Date(log.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Guayaquil' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
