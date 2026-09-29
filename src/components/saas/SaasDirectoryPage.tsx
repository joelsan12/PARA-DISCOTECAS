import { useMemo, useState } from 'react';
import { ArrowRight, Building2, Check, ChevronDown, Clock3, Heart, MapPin, Search, Sparkles, UsersRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BusinessDirectoryEntry } from '../../types/saas';
import type { VenueType } from '../../types/domain';
import { getCities, searchBusinesses, VENUE_TYPE_OPTIONS } from '../../lib/businessDirectory';
import { useBusinessDirectory } from '../../lib/useBusinessDirectory';
import { FavoriteButton, SaasAmbient, SaasFooter, SaasHeader, SaasSectionKicker, VenueTypeBadge } from './saas-ui';
import { useFavorites } from './useFavorites';

function DirectoryCard({ business }: { business: BusinessDirectoryEntry }) {
  return (
    <article className="saas-directory-card">
      <div className="saas-directory-card__media">
        <Link to={`/negocio/${business.slug}`} aria-label={`Ver ${business.name}`}>
          <img src={business.banner} alt={`Ambiente de ${business.name}`} loading="lazy" />
        </Link>
        <div className="saas-directory-card__media-top">
          <VenueTypeBadge venueType={business.venueType} />
          <FavoriteButton business={business} />
        </div>
        <div className="saas-directory-card__media-bottom">
          <span className="saas-directory-card__city"><MapPin size={12} /> {business.city}</span>
          {business.verified && <span className="saas-verified"><Check size={12} /> Verificado</span>}
        </div>
      </div>
      <div className="saas-directory-card__body">
        <div>
          <p className="saas-card-index">NIGHTFLOW / {business.id.slice(0, 8).toUpperCase()}</p>
          <h2><Link to={`/negocio/${business.slug}`}>{business.name}</Link></h2>
          <p className="saas-directory-card__tagline">{business.tagline}</p>
        </div>
        <div className="saas-directory-card__footer">
          <span className="saas-card-meta"><Clock3 size={13} /> Acceso con invitación</span>
          <Link className="saas-card-link" to={`/negocio/${business.slug}`} aria-label={`Explorar ${business.name}`}>
            Explorar <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SaasDirectoryPage() {
  const [query, setQuery] = useState('');
  const [venueType, setVenueType] = useState<VenueType | 'ALL'>('ALL');
  const [city, setCity] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { favorites } = useFavorites();
  const { entries, loading } = useBusinessDirectory();
  const cityOptions = useMemo(() => getCities(entries), [entries]);
  const results = useMemo(() => {
    const matched = searchBusinesses(query, venueType, entries, city);
    if (!onlyFavorites) return matched;
    return matched.filter((business) => favorites.some((favorite) => favorite.businessId === business.id));
  }, [city, entries, favorites, onlyFavorites, query, venueType]);

  const resetFilters = () => {
    setQuery('');
    setVenueType('ALL');
    setCity('');
    setOnlyFavorites(false);
  };

  return (
    <div className="saas-app saas-directory-app">
      <SaasAmbient />
      <SaasHeader />
      <main>
        <section className="saas-directory-hero">
          <div className="saas-container saas-directory-hero__grid">
            <div className="saas-directory-hero__copy">
              <SaasSectionKicker>La agenda que se siente distinta</SaasSectionKicker>
              <h1>Encuentra tu próxima <em>escena.</em></h1>
              <p>Un directorio privado de espacios verificados, donde cada noche tiene su propio ritual, su propia música y su lugar para ti.</p>
              <div className="saas-hero-signals">
                <span><span className="saas-signal-dot" /> {favorites.length} favoritos guardados</span>
                <span><UsersRound size={14} /> Acceso por invitación</span>
              </div>
            </div>
            <div className="saas-directory-hero__artifact" aria-hidden="true">
              <div className="saas-artifact__top"><span>NF / 01</span><span>CURATED NIGHTS</span></div>
              <div className="saas-artifact__circle"><span>NF</span></div>
              <div className="saas-artifact__bottom"><span>QUITO</span><span>GUAYAQUIL</span><span>DESDE 2026</span></div>
            </div>
          </div>
        </section>

        <section className="saas-directory-search-section">
          <div className="saas-container">
            <form className="saas-directory-search" onSubmit={(event) => event.preventDefault()}>
              <div className="saas-search-field saas-search-field--wide">
                <Search size={18} />
                <label htmlFor="saas-business-search">Buscar por nombre o ciudad</label>
                <input
                  id="saas-business-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej. Sensorial, Quito, rooftop..."
                />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}
              </div>
              <div className="saas-search-field saas-search-field--select">
                <Building2 size={17} />
                <label htmlFor="saas-business-type">Tipo de experiencia</label>
                <select id="saas-business-type" value={venueType} onChange={(event) => setVenueType(event.target.value as VenueType | 'ALL')}>
                  <option value="ALL">Todos los tipos</option>
                  {VENUE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <ChevronDown className="saas-select-chevron" size={15} />
              </div>
              <div className="saas-search-field saas-search-field--select">
                <MapPin size={17} />
                <label htmlFor="saas-business-city">Ciudad</label>
                <select id="saas-business-city" value={city} onChange={(event) => setCity(event.target.value)}>
                  <option value="">Todas las ciudades</option>
                  {cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ChevronDown className="saas-select-chevron" size={15} />
              </div>
              <button className="saas-button saas-button--gold saas-search-submit" type="submit">
                <span>Explorar</span><ArrowRight size={16} />
              </button>
            </form>
            <div className="saas-directory-tools">
              <div className="saas-filter-pills" aria-label="Filtros de directorio">
                <button className={!onlyFavorites ? 'is-active' : ''} type="button" onClick={() => setOnlyFavorites(false)}>Todos los venues</button>
                <button className={onlyFavorites ? 'is-active' : ''} type="button" onClick={() => setOnlyFavorites(true)}>
                  <span className="saas-pill-heart"><Heart size={12} /></span> Favoritos <b>{favorites.length}</b>
                </button>
              </div>
              <span className="saas-results-count">
                {loading && entries.length === 0
                  ? 'Cargando venues…'
                  : `${results.length} ${results.length === 1 ? 'lugar' : 'lugares'} disponibles`}
              </span>
            </div>
          </div>
        </section>

        <section className="saas-directory-results saas-container">
          {results.length > 0 ? (
            <div className="saas-directory-grid">
              {results.map((business) => <DirectoryCard key={business.id} business={business} />)}
            </div>
          ) : (
            <div className="saas-empty-state">
              <div className="saas-empty-state__icon"><Search size={22} /></div>
              <h2>No encontramos esa escena.</h2>
              <p>Prueba con otra ciudad, nombre o tipo de experiencia.</p>
              <button className="saas-button saas-button--outline" type="button" onClick={resetFilters}>Restablecer filtros</button>
            </div>
          )}
        </section>

        {/* Mis Favoritos dedicados */}
        <section className="saas-directory-favorites saas-container">
          <div className="saas-container__inner">
            <div className="saas-section-header">
              <Heart size={20} /> Mis Favoritos
              <span className="saas-badge">
                {favorites.length} {favorites.length === 1 ? 'lugar' : 'lugares'}
              </span>
            </div>
            {favorites.length > 0 ? (
              <div className="saas-directory-grid">
                {favorites.map((fav) => {
                  const business = entries.find((b) => b.id === fav.businessId);
                  return business ? (
                    <DirectoryCard key={business.id} business={business} />
                  ) : null;
                })}
              </div>
            ) : (
              <div className="saas-empty-state saas-empty-state--favorites">
                <div className="saas-empty-state__icon"><Heart size={22} /></div>
                <h2>Aún no tienes favoritos</h2>
                <p>Guarda tus venues favoritos usando el botón <Heart size={12} /> de cada ficha y aparecerán aquí.</p>
              </div>
            )}
          </div>
        </section>

        <section className="saas-directory-note saas-container">
          <div className="saas-note-mark"><Sparkles size={18} /></div>
          <div>
            <span className="saas-note-label">Una membresía, muchas noches</span>
            <h2>Tu acceso no debería sentirse como una lista.</h2>
          </div>
          <p>Guarda tus venues favoritos en este dispositivo y vuelve a ellos cuando quieras. Sin ruido, sin formalidades, solo la próxima experiencia que vas a elegir.</p>
        </section>
      </main>
      <SaasFooter />
    </div>
  );
}

export default SaasDirectoryPage;
