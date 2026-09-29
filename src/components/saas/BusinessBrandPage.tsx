import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Fingerprint, MapPin, MessageCircle, Music2, Navigation, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { BusinessDirectoryEntry } from '../../types/saas';
import { findBusinessBySlug } from '../../lib/businessDirectory';
import { useBusinessDirectory } from '../../lib/useBusinessDirectory';
import { subscribeToBusinessAuth, type BusinessAuthUser } from '../../lib/businessAuth';
import { FavoriteButton, SaasAmbient, SaasFooter, SaasHeader, SaasSectionKicker, VenueTypeBadge } from './saas-ui';

function BusinessNotFound() {
  return (
    <div className="saas-app saas-simple-page">
      <SaasAmbient />
      <SaasHeader />
      <main className="saas-container saas-simple-page__content">
        <span className="saas-404-code">404 / VENUE</span>
        <h1>Este acceso no está en la agenda.</h1>
        <p>El venue que buscas no existe o todavía no está disponible en el directorio.</p>
        <Link className="saas-button saas-button--gold" to="/"><ArrowLeft size={16} /> Volver al directorio</Link>
      </main>
      <SaasFooter />
    </div>
  );
}

function BrandHero({ business, entryPath, hasSession }: { business: BusinessDirectoryEntry; entryPath: string; hasSession: boolean }) {
  const themeStyle = {
    '--saas-brand-primary': business.primaryColor,
    '--saas-brand-accent': business.accentColor
  } as CSSProperties;

  return (
    <section className="saas-brand-hero" style={themeStyle}>
      <div className="saas-brand-hero__backdrop" style={{ backgroundImage: `url(${business.banner})` }} />
      <div className="saas-brand-hero__veil" />
      <div className="saas-container saas-brand-hero__content">
        <Link className="saas-back-link" to="/"><ArrowLeft size={15} /> Volver al directorio</Link>
        <div className="saas-brand-hero__main">
          <div className="saas-brand-hero__identity">
            <div className="saas-brand-hero__logo-wrap"><img src={business.logo} alt={`Logo de ${business.name}`} /></div>
            <div className="saas-brand-hero__labels">
              <span className="saas-brand-overline">NIGHTFLOW / VERIFIED VENUE</span>
              <div className="saas-brand-labels__row">
                <VenueTypeBadge venueType={business.venueType} />
                {business.verified && <span className="saas-verified saas-verified--light"><Check size={12} /> Verificado</span>}
                {business.status === 'trial' && <span className="saas-trial-badge">PRÓRROGA PRIVADA</span>}
              </div>
            </div>
          </div>
          <h1>{business.name}</h1>
          <p className="saas-brand-hero__tagline">{business.tagline}</p>
          <div className="saas-brand-hero__location"><MapPin size={15} /> {business.city}<span /> <Navigation size={14} /> Entrega de experiencia local</div>
          <div className="saas-brand-hero__actions">
            <Link className="saas-button saas-button--gold" to={entryPath}>{hasSession ? 'Entrar a mi espacio' : 'Entrar al venue'} <ArrowRight size={16} /></Link>
            <FavoriteButton business={business} showLabel />
          </div>
        </div>
        <div className="saas-brand-hero__rail">
          <span className="saas-rail-label">THE NIGHT EDIT</span>
          <span className="saas-rail-line" />
          <span className="saas-rail-index">01 <i /> 03</span>
        </div>
      </div>
    </section>
  );
}

export function BusinessBrandPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { entries } = useBusinessDirectory();
  const business = useMemo(() => findBusinessBySlug(entries, slug), [slug, entries]);
  const [sessionUser, setSessionUser] = useState<BusinessAuthUser | null>(null);

  useEffect(() => subscribeToBusinessAuth(setSessionUser), []);

  if (!business) return <BusinessNotFound />;

  const hasSession = Boolean(sessionUser);
  const entryPath = hasSession ? `/negocio/${business.slug}/app` : `/negocio/${business.slug}/acceso`;

  return (
    <div className="saas-app saas-business-app">
      <SaasAmbient />
      <SaasHeader business={business} />
      <main>
        <BrandHero business={business} entryPath={entryPath} hasSession={hasSession} />
        <section className="saas-brand-intro saas-container">
          <div className="saas-brand-intro__heading">
            <SaasSectionKicker>Una noche, bien guardada</SaasSectionKicker>
            <h2>La experiencia empieza <em>antes</em> de llegar.</h2>
          </div>
          <div className="saas-brand-intro__copy">
            <p>Guarda este lugar en tu directorio personal y accede a su experiencia cuando la noche tenga otra energía. Tu membresía vive aquí, sin formalidades.</p>
            <p>Un espacio cuidado para moverte sin fila, para llegar sin explicar y para que el tiempo que compartas se sienta completamente tuyo.</p>
          </div>
        </section>
        <section className="saas-brand-feature-grid saas-container">
          <article className="saas-feature-card saas-feature-card--wide">
            <div className="saas-feature-card__icon"><Fingerprint size={20} /></div>
            <span className="saas-feature-card__number">01 / 03</span>
            <h3>Tu pase, a tu ritmo</h3>
            <p>Una identidad de acceso lista para acompañarte en cada visita, con reingreso de {business.reentryMinutes} minutos.</p>
            <div className="saas-feature-card__line" />
            <span className="saas-feature-card__caption"><ShieldCheck size={13} /> Acceso protegido</span>
          </article>
          <article className="saas-feature-card">
            <div className="saas-feature-card__icon"><Music2 size={20} /></div>
            <span className="saas-feature-card__number">02 / 03</span>
            <h3>La agenda se siente distinta</h3>
            <p>Descubre el carácter de {business.name} y reserva tu lugar cuando la música y la ciudad estén alineadas.</p>
            <div className="saas-feature-card__line" />
            <span className="saas-feature-card__caption"><CalendarDays size={13} /> Curado para ti</span>
          </article>
          <article className="saas-feature-card">
            <div className="saas-feature-card__icon"><MessageCircle size={20} /></div>
            <span className="saas-feature-card__number">03 / 03</span>
            <h3>Sin fricción, sin ruido</h3>
            <p>Tu acceso es privado y local a este venue. Sin selectores, sin perfiles ajenos, sin distracciones.</p>
            <div className="saas-feature-card__line" />
            <span className="saas-feature-card__caption"><Clock3 size={13} /> Listo cuando llegues</span>
          </article>
        </section>
        <section className="saas-brand-cta saas-container">
          <div className="saas-brand-cta__orb" />
          <div>
            <span className="saas-kicker"><Sparkles size={12} /> Listo cuando tú lo estés</span>
            <h2>Guarda tu lugar en <em>{business.name}.</em></h2>
            <p>Accede a tu experiencia y mantén tus favoritos cerca, en este dispositivo.</p>
          </div>
          <Link className="saas-button saas-button--gold" to={entryPath}>{hasSession ? 'Abrir mi espacio' : 'Crear mi acceso'} <ArrowRight size={16} /></Link>
        </section>
      </main>
      <SaasFooter />
    </div>
  );
}

export default BusinessBrandPage;
