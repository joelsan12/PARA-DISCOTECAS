import { type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { ArrowUpRight, Heart, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import '../../styles/saas.css';
import { Link } from 'react-router-dom';
import type { BusinessDirectoryEntry, FavoriteBusiness } from '../../types/saas';
import { getBusinessTypeShortLabel } from '../../lib/businessDirectory';
import { useFavorites } from './useFavorites';
import { NightflowLogoMark } from '../common/NightflowLogo';

interface SaasLogoProps {
  compact?: boolean;
}

export function SaasLogo({ compact = false }: SaasLogoProps) {
  return (
    <Link className={`saas-logo${compact ? ' saas-logo--compact' : ''}`} to="/" aria-label="Nightflow, directorio de experiencias">
      <NightflowLogoMark size={compact ? 28 : 34} theme="gold" />
      <span className="saas-logo__copy">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <strong>NIGHTFLOW</strong>
          <span className="saas-logo__vip-badge">VIP</span>
        </span>
        <small>PRIVATE HOSPITALITY NETWORK</small>
      </span>
    </Link>
  );
}

interface SaasHeaderProps {
  business?: BusinessDirectoryEntry;
  backTo?: string;
  minimal?: boolean;
}

export function SaasHeader({ business, backTo, minimal = false }: SaasHeaderProps) {
  return (
    <header className="saas-header">
      <SaasLogo />
      <nav className="saas-header__nav" aria-label="Navegación principal">
        {!minimal && <Link to="/">Directorio</Link>}
        {business && <Link to={`/negocio/${business.slug}`}>El venue</Link>}
        {business && <Link className="saas-header__access" to={`/negocio/${business.slug}/acceso`}>Acceder <ArrowUpRight size={14} /></Link>}
        {!business && !minimal && backTo && <Link className="saas-header__access" to={backTo}>Mi acceso <ArrowUpRight size={14} /></Link>}
      </nav>
    </header>
  );
}

interface FavoriteButtonProps {
  business: BusinessDirectoryEntry | FavoriteBusiness;
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({ business, className = '', showLabel = false }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const businessId = 'id' in business ? business.id : business.businessId;
  const active = isFavorite(businessId);
  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(business);
  };

  return (
    <button
      className={`saas-favorite${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Quitar ${business.name} de favoritos` : `Guardar ${business.name} en favoritos`}
    >
      <Heart size={17} fill={active ? 'currentColor' : 'none'} />
      {showLabel && <span>{active ? 'Guardado' : 'Guardar'}</span>}
    </button>
  );
}

export function VenueTypeBadge({ venueType }: { venueType: BusinessDirectoryEntry['venueType'] }) {
  return <span className="saas-venue-badge">{getBusinessTypeShortLabel(venueType)}</span>;
}

export function BusinessMark({ business, size = 'default' }: { business: BusinessDirectoryEntry; size?: 'default' | 'large' }) {
  const style = {
    '--saas-brand-primary': business.primaryColor,
    '--saas-brand-accent': business.accentColor
  } as CSSProperties;

  return (
    <div className={`saas-business-mark saas-business-mark--${size}`} style={style}>
      <div className="saas-business-mark__halo" />
      <img src={business.logo} alt={`Logo de ${business.name}`} />
      <span className="saas-business-mark__name">{business.name}</span>
    </div>
  );
}

export function SaasAmbient() {
  return (
    <div className="saas-ambient" aria-hidden="true">
      <span className="saas-ambient__orb saas-ambient__orb--one" />
      <span className="saas-ambient__orb saas-ambient__orb--two" />
      <span className="saas-ambient__grid" />
      <span className="saas-ambient__line saas-ambient__line--one" />
      <span className="saas-ambient__line saas-ambient__line--two" />
    </div>
  );
}

export function SaasFooter() {
  return (
    <footer className="saas-footer">
      <span>© {new Date().getFullYear()} Nightflow</span>
      <span className="saas-footer__rule" />
      <span>Accesos exclusivos, sin distracciones.</span>
      <span className="saas-footer__security"><ShieldCheck size={13} /> Entorno protegido</span>
    </footer>
  );
}

export function SaasSectionKicker({ children }: { children: string }) {
  return <span className="saas-kicker"><Sparkles size={12} /> {children}</span>;
}

export function SaasSecureNote() {
  return (
    <div className="saas-secure-note">
      <LockKeyhole size={14} />
      <span>Tu acceso pertenece únicamente a este venue.</span>
    </div>
  );
}
