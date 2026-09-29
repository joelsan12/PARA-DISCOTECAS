import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, AtSign, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, MessageCircle, Phone, Send, ShieldCheck, Smartphone, Sparkles, UserRound, Wifi } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CustomerAuthMethod } from '../../types/saas';
import { findBusinessBySlug } from '../../lib/businessDirectory';
import { useBusinessDirectory } from '../../lib/useBusinessDirectory';
import {
  BUSINESS_DEMO_ENABLED,
  BusinessAuthError,
  completeBusinessOtp,
  getPendingBusinessOtp,
  isBusinessAuthConfigured,
  registerBusinessCustomerWithPassword,
  signInBusinessCustomerWithPassword,
  signOutBusinessCustomer,
  startBusinessOtp,
  subscribeToBusinessAuth,
  type BusinessAuthResult,
  type BusinessAuthUser,
  type BusinessOtpMethod
} from '../../lib/businessAuth';
import { ensureBusinessCustomerProfile } from '../../lib/businessCustomer';
import { useClubStore } from '../../store/clubStore';
import { BusinessMark, SaasAmbient, SaasFooter, SaasHeader, SaasSecureNote } from './saas-ui';

const authMethods = [
  { value: 'password' as const, label: 'Correo + contraseña', detail: 'Tu acceso habitual', icon: LockKeyhole },
  { value: 'email_otp' as const, label: 'Correo OTP', detail: 'Un clic y adentro', icon: Mail },
  { value: 'whatsapp_otp' as const, label: 'WhatsApp OTP', detail: 'Código en tu chat', icon: MessageCircle },
  { value: 'sms_otp' as const, label: 'SMS OTP', detail: 'Código por texto', icon: Smartphone }
];

const errorMessage = (error: unknown): string => {
  const message = error instanceof BusinessAuthError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'No pudimos completar el acceso. Inténtalo nuevamente.';
  if (message.toLowerCase().includes('internal') || message.includes('[0]')) {
    return 'El servicio de acceso no está disponible en este momento. Inténtalo nuevamente en unos minutos.';
  }
  return message;
};

function AccessNotFound() {
  return (
    <div className="saas-app saas-simple-page">
      <SaasAmbient />
      <SaasHeader />
      <main className="saas-container saas-simple-page__content">
        <span className="saas-404-code">404 / ACCESO</span>
        <h1>Este acceso no está disponible.</h1>
        <p>El venue solicitado no existe o ya no está disponible en Nightflow.</p>
        <Link className="saas-button saas-button--gold" to="/"><ArrowLeft size={16} /> Volver al directorio</Link>
      </main>
      <SaasFooter />
    </div>
  );
}

export function BusinessAccessPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { entries } = useBusinessDirectory();
  const business = useMemo(() => findBusinessBySlug(entries, slug), [slug, entries]);
  const navigate = useNavigate();
  const store = useClubStore();
  const initialPendingOtp = useMemo(() => business ? getPendingBusinessOtp(business.id) : null, [business]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<CustomerAuthMethod>(() => initialPendingOtp ? 'email_otp' : 'password');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'identifier' | 'code'>(() => initialPendingOtp ? 'code' : 'identifier');
  const [challenge, setChallenge] = useState<Awaited<ReturnType<typeof startBusinessOtp>> | null>(initialPendingOtp);
  const [user, setUser] = useState<BusinessAuthUser | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const ensuredUid = useRef('');
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => subscribeToBusinessAuth((nextUser) => setUser(nextUser)), []);

  useEffect(() => {
    if (!user || !business || ensuredUid.current === user.uid) return;
    ensuredUid.current = user.uid;
    void ensureBusinessCustomerProfile(business.id, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone
    }).catch(() => undefined);
  }, [business, user]);

  useEffect(() => () => {
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
  }, []);

  if (!business) return <AccessNotFound />;

  const isPhoneMethod = method === 'whatsapp_otp' || method === 'sms_otp';
  const isFirebaseReady = isBusinessAuthConfigured();
  const isEmailLinkMethod = method === 'email_otp' && challenge?.transport === 'firebase';
  const isEmailCodeMethod = method === 'email_otp' && challenge?.transport !== 'firebase';
  const authAvailable = isFirebaseReady || BUSINESS_DEMO_ENABLED;
  const availableMethods = authMethods.filter((option) => business.authMethods.includes(option.value));
  const destination = isPhoneMethod ? phone : email;
  const selectedMethod = authMethods.find((option) => option.value === method) ?? authMethods[0];

  const resetOtpFlow = () => {
    setChallenge(null);
    setCode('');
    setStep('identifier');
    setError('');
    setSubmitState('idle');
  };

  const handleModeChange = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError('');
    setSubmitState('idle');
    resetOtpFlow();
  };

  const handleMethodChange = (nextMethod: CustomerAuthMethod) => {
    setMethod(nextMethod);
    setError('');
    resetOtpFlow();
    if (nextMethod === 'email_otp' && business) {
      const pending = getPendingBusinessOtp(business.id);
      if (pending) {
        setChallenge(pending);
        setStep('code');
      }
    }
  };

  const ensureProfile = async (authUser: BusinessAuthUser) => {
    const profile = await ensureBusinessCustomerProfile(business.id, {
      uid: authUser.uid,
      displayName: authUser.displayName,
      email: authUser.email,
      phone: authUser.phone
    });
    if (!profile && !BUSINESS_DEMO_ENABLED) {
      throw new BusinessAuthError('No pudimos asegurar tu perfil de cliente.', 'business-auth/profile-unavailable');
    }
    ensuredUid.current = authUser.uid;
  };

  const finishAuthentication = async (result: BusinessAuthResult) => {
    setSubmitState('loading');
    setError('');
    try {
      await ensureProfile(result.user);
      setUser(result.user);
      store.setBusinessPortalSession(business.id, {
        id: result.user.uid,
        name: result.user.displayName || result.user.email?.split('@')[0] || 'Invitado Nightflow',
        phone: result.user.phone || '',
        ...(result.user.email ? { email: result.user.email } : {}),
        auth_provider: result.method === 'whatsapp_otp'
          ? 'whatsapp'
          : result.method === 'password'
            ? 'password'
            : result.method === 'email_otp'
              ? 'email_otp'
              : result.method === 'sms_otp'
                ? 'sms_otp'
                : 'phone_otp',
        tier: 'SILVER',
        created_at: result.user.createdAt
      });
      setSubmitState('success');
      redirectTimer.current = window.setTimeout(() => {
        navigate(`/negocio/${business.slug}/app`, { replace: true });
      }, 500);
    } catch (profileError) {
      setSubmitState('idle');
      setError(errorMessage(profileError));
    }
  };

  const requestOtp = async () => {
    if (!authAvailable) {
      setError('Configura Firebase para habilitar el acceso de clientes.');
      return;
    }
    const identifier = isPhoneMethod ? phone : email;
    setSubmitState('loading');
    setError('');
    try {
      const nextChallenge = await startBusinessOtp({
        businessId: business.id,
        identifier,
        method: method as BusinessOtpMethod,
        returnPath: `/negocio/${business.slug}/acceso`
      });
      setChallenge(nextChallenge);
      setCode('');
      setStep('code');
      setSubmitState('idle');
    } catch (otpError) {
      setSubmitState('idle');
      setError(errorMessage(otpError));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authAvailable) {
      setError('Configura Firebase para habilitar el acceso de clientes.');
      return;
    }
    setError('');
    if (mode === 'register' && displayName.trim().length < 2) {
      setError('Ingresa tu nombre para completar el registro.');
      return;
    }
    if (method === 'password') {
      if (!email.trim() || !email.includes('@')) {
        setError('Ingresa un correo electrónico válido.');
        return;
      }
      if (password.length < 6) {
        setError('Usa una contraseña de al menos 6 caracteres.');
        return;
      }
      setSubmitState('loading');
      try {
        const result = mode === 'login'
          ? await signInBusinessCustomerWithPassword(email, password)
          : await registerBusinessCustomerWithPassword({ displayName, email, password });
        await finishAuthentication(result);
      } catch (authError) {
        setSubmitState('idle');
        setError(errorMessage(authError));
      }
      return;
    }
    if (step === 'identifier') {
      if (!destination.trim()) {
        setError(isPhoneMethod ? 'Ingresa tu número de teléfono.' : 'Ingresa tu correo electrónico.');
        return;
      }
      await requestOtp();
      return;
    }
    if (!challenge) {
      setError('Solicita un nuevo código para continuar.');
      setStep('identifier');
      return;
    }
    if (!isEmailLinkMethod && !/^\d{6}$/.test(code.replace(/\s/g, ''))) {
      setError('Ingresa el código de 6 dígitos.');
      return;
    }
    setSubmitState('loading');
    try {
      const result = await completeBusinessOtp({
        businessId: business.id,
        challengeId: challenge.challengeId,
        code: isEmailLinkMethod ? '000000' : code,
        displayName: mode === 'register' ? displayName : undefined
      });
      await finishAuthentication(result);
    } catch (authError) {
      setSubmitState('idle');
      setError(errorMessage(authError));
    }
  };

  const handleSignOut = async () => {
    setSubmitState('loading');
    try {
      await signOutBusinessCustomer();
      ensuredUid.current = '';
      setUser(null);
      store.clearBusinessPortalSession();
      store.logoutClient();
      setSubmitState('idle');
    } catch {
      setSubmitState('idle');
      setError('No pudimos cerrar la sesión.');
    }
  };

  const methodDescription = step === 'code'
    ? isEmailLinkMethod
      ? `Abre el enlace que enviamos a ${destination || 'tu correo'} y vuelve a esta pantalla.`
      : `Ingresa el código que enviamos a ${destination || 'tu contacto'}.`
    : selectedMethod.detail;

  return (
    <div className="saas-app saas-access-app">
      <SaasAmbient />
      <SaasHeader business={business} backTo={`/negocio/${business.slug}`} />
      <main className="saas-container saas-access-layout">
        <section className="saas-access-intro">
          <Link className="saas-back-link" to={`/negocio/${business.slug}`}><ArrowLeft size={15} /> Volver a {business.name}</Link>
          <div className="saas-access-intro__brand">
            <BusinessMark business={business} size="large" />
            <div>
              <span className="saas-brand-overline">MEMBRESÍA / {business.city.toUpperCase()}</span>
              <h1>Tu lugar en<br /><em>{business.name}</em></h1>
              <p>Una identidad de acceso simple para que la noche empiece antes de que cruces la puerta.</p>
            </div>
          </div>
          <div className="saas-access-intro__promise">
            <div><ShieldCheck size={16} /><span><strong>Privado por diseño</strong>Tu perfil queda asociado solo a este venue.</span></div>
            <div><Sparkles size={16} /><span><strong>Guardado en este dispositivo</strong>Tus favoritos son locales y tus datos no se comparten.</span></div>
          </div>
          <div className="saas-access-intro__footer"><span>VENUE ID / {business.id.toUpperCase()}</span><span>NF · 2026</span></div>
        </section>

        <section className="saas-access-card">
          <div className="saas-access-card__topline">
            <span className="saas-kicker"><KeyRound size={12} /> Acceso de cliente</span>
            <span className={`saas-connection-status${isFirebaseReady ? ' is-firebase' : ''}`}><Wifi size={12} /> {isFirebaseReady ? 'Firebase conectado' : BUSINESS_DEMO_ENABLED ? 'Demo local' : 'Sin conexión'}</span>
          </div>
          <div className="saas-access-card__heading">
            <div>
              <h2>{user ? 'Tu acceso está activo.' : mode === 'login' ? 'Entra a tu escena.' : 'Crea tu acceso.'}</h2>
              <p>{user ? `Sesión vinculada a ${business.name}.` : 'Elige cómo quieres volver a encontrarnos.'}</p>
            </div>
            {user && <button className="saas-session-chip" type="button" onClick={handleSignOut} disabled={submitState === 'loading'}>{user.displayName || 'Invitado'} · salir</button>}
          </div>

          {user ? (
            <div className="saas-authenticated-panel">
              <div className="saas-authenticated-panel__icon"><Check size={22} /></div>
              <div>
                <span className="saas-card-index">IDENTIDAD VERIFICADA</span>
                <h3>Bienvenido de vuelta, {user.displayName || 'invitado'}.</h3>
                <p>Tu espacio en {business.name} está listo: mesas, reservas y pase en un solo lugar.</p>
              </div>
              <button
                className="saas-button saas-button--gold"
                type="button"
                onClick={() => {
                  store.setBusinessPortalSession(business.id, {
                    id: user.uid,
                    name: user.displayName || user.email?.split('@')[0] || 'Invitado Nightflow',
                    phone: user.phone || '',
                    ...(user.email ? { email: user.email } : {}),
                    auth_provider: user.email ? 'password' : 'phone_otp',
                    tier: 'SILVER',
                    created_at: user.createdAt
                  });
                  navigate(`/negocio/${business.slug}/app`);
                }}
              >
                Entrar a mi portal <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="saas-auth-tabs" role="tablist" aria-label="Tipo de acceso">
                <button className={mode === 'login' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'login'} onClick={() => handleModeChange('login')}>Iniciar sesión</button>
                <button className={mode === 'register' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'register'} onClick={() => handleModeChange('register')}>Crear cuenta</button>
              </div>

              <div className="saas-method-grid" role="radiogroup" aria-label="Método de acceso">
                {availableMethods.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      className={`saas-method-option${method === option.value ? ' is-active' : ''}`}
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={method === option.value}
                      onClick={() => handleMethodChange(option.value)}
                    >
                      <span className="saas-method-option__icon"><Icon size={16} /></span>
                      <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                      {method === option.value && <Check className="saas-method-option__check" size={14} />}
                    </button>
                  );
                })}
              </div>

              <form className="saas-auth-form" onSubmit={handleSubmit}>
                {step === 'identifier' && mode === 'register' && (
                  <label className="saas-field">
                    <span>Nombre para tu perfil</span>
                    <span className="saas-field__control"><UserRound size={16} /><input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Cómo te llamamos" autoComplete="name" /></span>
                  </label>
                )}

                {step === 'identifier' && (
                  <label className="saas-field">
                    <span>{isPhoneMethod ? 'Número de teléfono' : 'Correo electrónico'}</span>
                    <span className="saas-field__control">{isPhoneMethod ? <Phone size={16} /> : <AtSign size={16} />}<input type={isPhoneMethod ? 'tel' : 'email'} value={isPhoneMethod ? phone : email} onChange={(event) => isPhoneMethod ? setPhone(event.target.value) : setEmail(event.target.value)} placeholder={isPhoneMethod ? '+593 9XX XXX XXX' : 'tu@correo.com'} autoComplete={isPhoneMethod ? 'tel' : 'email'} /></span>
                  </label>
                )}

                {step === 'identifier' && method === 'password' && (
                  <label className="saas-field">
                    <span>Contraseña</span>
                    <span className="saas-field__control"><KeyRound size={16} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button className="saas-field__action" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
                  </label>
                )}

                {step === 'code' && (
                  <>
                    <div className="saas-code-notice"><div className="saas-code-notice__icon"><Send size={16} /></div><div><strong>Código en camino</strong><p>{methodDescription}</p>{challenge?.demoCode && BUSINESS_DEMO_ENABLED && <small>Demo DEV: usa {challenge.demoCode}</small>}</div></div>
                    {!isEmailLinkMethod && (
                      <label className="saas-field">
                        <span>Código de seguridad</span>
                        <span className="saas-field__control saas-field__control--code"><ShieldCheck size={16} /><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" /></span>
                      </label>
                    )}
                    {isEmailLinkMethod && <p className="saas-email-link-hint"><Mail size={15} /> Abre el enlace en este dispositivo para continuar.</p>}
                    <button className="saas-resend-button" type="button" onClick={() => void requestOtp()} disabled={submitState === 'loading'}><Send size={13} /> Reenviar {isEmailLinkMethod ? 'enlace' : 'código'}</button>
                  </>
                )}

                {error && <div className="saas-form-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

                <button className="saas-button saas-button--gold saas-auth-submit" type="submit" disabled={!authAvailable || submitState === 'loading' || submitState === 'success'}>
                  {submitState === 'loading' && <span className="saas-spinner" />}
                  {submitState === 'success' ? 'Acceso confirmado' : submitState === 'loading' ? 'Verificando acceso' : step === 'code' ? isEmailCodeMethod || (!isEmailLinkMethod && method === 'email_otp') ? 'Confirmar código' : isEmailLinkMethod ? 'Confirmar enlace' : 'Confirmar código' : mode === 'login' ? 'Entrar a mi cuenta' : 'Crear mi acceso'}
                  {submitState !== 'loading' && submitState !== 'success' && <ArrowRight size={16} />}
                </button>
              </form>
              {!authAvailable && <p className="saas-auth-unavailable">El acceso se habilita al configurar Firebase. El modo demo existe únicamente en desarrollo.</p>}
            </>
          )}

          <SaasSecureNote />
          <div id="nightflow-business-auth-recaptcha" />
        </section>
      </main>
      <SaasFooter />
    </div>
  );
}

export default BusinessAccessPage;
