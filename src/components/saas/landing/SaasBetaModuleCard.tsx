import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Lightbulb,
  Activity,
  ShieldCheck,
  Crown,
  Radio,
} from 'lucide-react';
import { SpotlightCard, TelemetryBadge } from '../../common/ui';
import {
  type BetaModule,
  type BetaModulePreview,
} from './betaModules.data';

/* ═════════════════════════════════════════════════════════════════════════
   NIGHTFLOW VIP — BENTO DE CONSOLA (Módulos Beta)
   Tarjeta HUD compartida entre la sección inline del landing y el modal de
   bienvenida. Estética de panel de instrumentos: canal MOD-NN, etiqueta de
   dominio, telemetría en JetBrains Mono y micro-preview del módulo.
   Los datos canónicos viven en betaModules.data.ts.
   ═════════════════════════════════════════════════════════════════════════ */

/* ── Micro-previews de módulos (DOM + CSS puro, sin dependencias) ───────── */

const FloorplanPreview: React.FC = () => (
  <div className="beta-prev-floor">
    <div className="beta-floor-radar__grid" aria-hidden="true" />
    <div className="beta-floor-radar__sweep" aria-hidden="true" />

    {/* Stage / Cabina DJ Header */}
    <div className="beta-floor-stage">
      <div className="beta-floor-stage__badge">
        <Activity size={10} className="beta-floor-stage__pulse" />
        <span>STAGE // CABINA DJ · 128 BPM</span>
      </div>
      <div className="beta-floor-stage__eq" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>

    {/* Palcos VIP Perimetrales */}
    <div className="beta-floor-booth beta-floor-booth--vip1">
      <div className="beta-floor-booth__tag">VIP-01 · PALCO PRESIDENCIAL</div>
      <div className="beta-floor-booth__metrics">
        <span className="beta-floor-pill beta-floor-pill--vip">RESERVADO</span>
        <b className="beta-floor-spend">$3,850 SPEND</b>
      </div>
    </div>

    <div className="beta-floor-booth beta-floor-booth--vip2">
      <div className="beta-floor-booth__tag">VIP-02 · PALCO ULTRA</div>
      <div className="beta-floor-booth__metrics">
        <span className="beta-floor-pill beta-floor-pill--hold">HOLD 11:24</span>
        <b className="beta-floor-spend">$1,500 MIN</b>
      </div>
    </div>

    <div className="beta-floor-booth beta-floor-booth--vip3">
      <div className="beta-floor-booth__tag">VIP-03 · PALCO OESTE</div>
      <div className="beta-floor-booth__metrics">
        <span className="beta-floor-pill beta-floor-pill--occ">CONSUMIENDO</span>
        <b className="beta-floor-spend">$2,140 SPEND</b>
      </div>
    </div>

    {/* Pista Central con Mesas Cocktail */}
    <div className="beta-floor-dancefloor">
      <span className="beta-floor-table beta-floor-table--t1" title="Mesa T-01: Ocupada">
        <em>T-01</em>
      </span>
      <span className="beta-floor-table beta-floor-table--t2" title="Mesa T-02: Ocupada">
        <em>T-02</em>
      </span>
      <span className="beta-floor-table beta-floor-table--t3 beta-floor-table--free" title="Mesa T-03: Libre">
        <em>T-03</em>
      </span>
      <span className="beta-floor-table beta-floor-table--t4" title="Mesa T-04: Ocupada">
        <em>T-04</em>
      </span>
    </div>

    {/* Barra Principal & Coctelería */}
    <div className="beta-floor-bar">
      <span className="beta-floor-bar__label">BARRA PRINCIPAL 360°</span>
      <span className="beta-floor-bar__sync">SYNC: 12 TICKETS</span>
    </div>

    {/* Telemetría Inferior HUD */}
    <div className="beta-floor-hud-bar">
      <span className="beta-floor-hud-item">
        <em>HOLD</em> <b>12M CLOUD TASKS</b>
      </span>
      <span className="beta-floor-hud-item beta-floor-hud-item--live">
        <em>AFORO SALA</em> <b>214/300 · 71.3%</b>
      </span>
    </div>
  </div>
);

const ScannerPreview: React.FC = () => (
  <div className="beta-prev-scan">
    <div className="beta-scan-hud-top">
      <span>OPTICAL RETICLE // KMS Ed25519</span>
      <span className="beta-scan-speed">0.04s SPEED</span>
    </div>

    <div className="beta-scan-frame" aria-hidden="true">
      <span className="beta-scan-corner beta-scan-corner--tl" />
      <span className="beta-scan-corner beta-scan-corner--tr" />
      <span className="beta-scan-corner beta-scan-corner--bl" />
      <span className="beta-scan-corner beta-scan-corner--br" />
      <div className="beta-scan-crosshair" />
      <div className="beta-scan-qr">
        <span className="beta-scan-qr-finder beta-scan-qr-finder--tl" />
        <span className="beta-scan-qr-finder beta-scan-qr-finder--tr" />
        <span className="beta-scan-qr-finder beta-scan-qr-finder--bl" />
        <div className="beta-scan-qr-matrix" />
      </div>
      <div className="beta-scan-laser" />
    </div>

    <div className="beta-scan-hud-bottom">
      <div className="beta-scan-verdict">
        <ShieldCheck size={11} />
        <b>STATUS: VALID CHECK-IN</b>
      </div>
      <div className="beta-scan-hash">JTI: tk_9821_ok · BUFFER: 0 PEND</div>
    </div>
  </div>
);

const BlackCardPreview: React.FC = () => (
  <div className="beta-prev-card">
    <div className="beta-bcard">
      <div className="beta-bcard__top">
        <div className="beta-bcard__brand">
          <Crown size={12} className="beta-bcard__crown" />
          <span className="beta-bcard__mono">NIGHTFLOW</span>
        </div>
        <Radio size={12} className="beta-bcard__nfc" />
      </div>

      <div className="beta-bcard__body">
        <span className="beta-bcard__eyebrow">TITULAR EXCLUSIVO //</span>
        <h4 className="beta-bcard__holder-name">VALENTINA M.</h4>
        <div className="beta-bcard__tier">
          <span className="beta-bcard__tier-dot" />
          <span>BLACK FOUNDER VIP</span>
        </div>
      </div>

      <div className="beta-bcard__auth">
        <div className="beta-bcard__rot-info">
          <span className="beta-bcard__rot-dot" />
          <span>ROTACIÓN 00:26s</span>
        </div>
        <div className="beta-bcard__enclave">
          <ShieldCheck size={11} />
          <span>PASSKEY ENCLAVE</span>
        </div>
      </div>
    </div>
  </div>
);

const TicketPreview: React.FC = () => (
  <div className="beta-prev-ticket">
    <div className="beta-ticket-head">
      <div>
        <span className="beta-ticket-title">COMANDA VIP N.º 042</span>
        <span className="beta-ticket-meta">PALCO VIP-02 · CAPITÁN MARCOS</span>
      </div>
      <span className="beta-ticket-time">01:42 AM</span>
    </div>

    <div className="beta-ticket-body">
      <div className="beta-ticket-item">
        <div className="beta-ticket-item__info">
          <b>Dom Pérignon Luminous × 2</b>
          <span>BARRA PRINCIPAL</span>
        </div>
        <span className="beta-ticket-item__price">$960</span>
        <span className="beta-ticket-tag beta-ticket-tag--done">SERVIDO</span>
      </div>

      <div className="beta-ticket-item">
        <div className="beta-ticket-item__info">
          <b>Don Julio 1942 Añejo × 1</b>
          <span>BARRA PRINCIPAL</span>
        </div>
        <span className="beta-ticket-item__price">$420</span>
        <span className="beta-ticket-tag beta-ticket-tag--prep">EN CAMINO</span>
      </div>

      <div className="beta-ticket-item">
        <div className="beta-ticket-item__info">
          <b>Hookah Ice Menta × 1</b>
          <span>ESTACIÓN SHISHA</span>
        </div>
        <span className="beta-ticket-item__price">$65</span>
        <span className="beta-ticket-tag beta-ticket-tag--prep">PREPARANDO</span>
      </div>
    </div>

    <div className="beta-ticket-spend-progress">
      <div className="beta-ticket-spend-header">
        <span>CONSUMO MÍNIMO: $1,445 / $1,500</span>
        <b>96.3%</b>
      </div>
      <div className="beta-ticket-spend-track">
        <div className="beta-ticket-spend-fill" style={{ width: '96.3%' }} />
      </div>
    </div>

    <div className="beta-ticket-footer">
      <span>SYNC BARRA // LATENCIA 14ms</span>
      <b>TOTAL: $1,445</b>
    </div>
  </div>
);

const BlueprintPreview: React.FC = () => (
  <div className="beta-prev-blue">
    <div className="beta-blue-grid" aria-hidden="true" />
    <div className="beta-blue-ruler-h" aria-hidden="true">
      <span>0m</span>
      <span>6m</span>
      <span>12m</span>
      <span>18m</span>
      <span>24m</span>
    </div>

    {/* Stage DJ */}
    <div className="beta-blue-zone beta-blue-zone--dj">
      <span>CABINA DJ & SOUND RIG (18m²)</span>
    </div>

    {/* Palcos VIP Elevados */}
    <div className="beta-blue-zone beta-blue-zone--vip">
      <span>SUITES PALCOS VIP (+40cm)</span>
    </div>

    {/* Barra Isla 360 */}
    <div className="beta-blue-zone beta-blue-zone--bar">
      <span>BARRA ISLA 360°</span>
    </div>

    {/* Pista Central */}
    <div className="beta-blue-zone beta-blue-zone--floor">
      <span>PISTA PRINCIPAL</span>
    </div>

    {/* Cotas Métricas */}
    <div className="beta-blue-dim beta-blue-dim--w">
      <span>← 24.80 M →</span>
    </div>
    <div className="beta-blue-dim beta-blue-dim--h">
      <span>↑ 16.50 M ↓</span>
    </div>

    {/* Cursor CAD Activo */}
    <div className="beta-blue-cursor">
      <div className="beta-blue-cursor__reticle" />
      <span className="beta-blue-cursor__coords">CAD X: 18.42m · Y: 11.20m</span>
    </div>
  </div>
);

const BetaModulePreviewView: React.FC<{ preview: BetaModulePreview }> = ({ preview }) => {
  switch (preview) {
    case 'floorplan':
      return <FloorplanPreview />;
    case 'scanner':
      return <ScannerPreview />;
    case 'blackcard':
      return <BlackCardPreview />;
    case 'ticket':
      return <TicketPreview />;
    case 'blueprint':
      return <BlueprintPreview />;
  }
};

/* ── Tarjeta de módulo (Bento de Consola) ───────────────────────────────── */

export interface BetaModuleCardProps {
  mod: BetaModule;
  onSuggest: (moduleName: string) => void;
  onNavigate?: () => void;
}

export const BetaModuleCard: React.FC<BetaModuleCardProps> = ({ mod, onSuggest, onNavigate }) => {
  const IconComp = mod.icon;
  const isHero = mod.id === 'floor-ops';

  return (
    <SpotlightCard className={`beta-mod beta-mod--${mod.domain}${isHero ? ' beta-mod--hero' : ''}`}>
      <div className="beta-mod__rail">
        <span className="beta-mod__channel">{mod.channel}</span>
        <span className={`beta-mod__tag beta-mod__tag--${mod.domain}`}>
          <span className="beta-mod__tag-dot" />
          <span>{mod.roleTag}</span>
        </span>
      </div>

      <div className="beta-mod__main">
        <div className="beta-mod__visual" aria-hidden="true">
          <BetaModulePreviewView preview={mod.preview} />
        </div>

        <div className="beta-mod__body">
          <div className="beta-mod__head">
            <span className="beta-mod__icon">
              <IconComp size={17} />
            </span>
            <h3 className="beta-mod__title">{mod.name}</h3>
          </div>
          <p className="beta-mod__desc">{mod.desc}</p>
          <ul className="beta-mod__features">
            {mod.features.map((feat) => (
              <li key={feat}>
                <span className="beta-mod__mark" aria-hidden="true" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="beta-mod__spec">
        <TelemetryBadge status={mod.badgeStatus} label={mod.badge} />
        {mod.spec.map((s) => (
          <span key={s.label} className="beta-mod__spec-cell">
            <em>{s.label}</em>
            <b>{s.value}</b>
          </span>
        ))}
      </div>

      <div className="beta-mod__actions">
        <Link
          to={mod.primaryLink}
          onClick={onNavigate}
          className="beta-mod__cta"
        >
          <span>{mod.primaryLabel}</span>
          <ArrowRight size={13} />
        </Link>
        <button
          type="button"
          onClick={() => onSuggest(mod.name)}
          className="beta-mod__suggest"
          title={`Dejar sugerencia sobre ${mod.name}`}
        >
          <Lightbulb size={12} />
          <span>Sugerir</span>
        </button>
      </div>
    </SpotlightCard>
  );
};

export default BetaModuleCard;
