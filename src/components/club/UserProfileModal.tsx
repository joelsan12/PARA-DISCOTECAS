import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  Camera,
  Trash2,
  KeyRound,
  Check,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck
} from 'lucide-react';
import type { AdminStaffSession } from '../../lib/adminAuth';
import type { Club } from '../../types';
import { auth } from '../../lib/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { updateAdminProfileInFirestore } from '../../lib/adminAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AdminStaffSession;
  activeClub: Club;
  onProfileUpdated: (updatedSession: AdminStaffSession) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  session,
  activeClub,
  onProfileUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');

  // General fields
  const [displayName, setDisplayName] = useState(session.displayName || '');
  const [email, setEmail] = useState(session.email || '');
  const [photoURL, setPhotoURL] = useState<string | null>(session.photoURL || null);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [requiresPasswordForEmail, setRequiresPasswordForEmail] = useState(false);

  // Security / Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process & compress uploaded image using Canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Por favor selecciona un archivo de imagen válido (JPG, PNG o WebP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'La imagen original no debe superar los 8 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Centered square crop
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        setPhotoURL(dataUrl);
        setFeedback({ type: 'success', message: 'Foto procesada. Haz clic en "Guardar Información" para confirmar.' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoURL(null);
    setFeedback({ type: 'success', message: 'Foto removida. Haz clic en "Guardar Información" para confirmar.' });
  };

  // Save General Profile Info
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'El nombre de usuario no puede estar vacío.' });
      return;
    }

    if (!trimmedEmail) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'El correo electrónico no puede estar vacío.' });
      return;
    }

    try {
      const currentUser = auth?.currentUser;

      // 1. Update Firebase Auth Profile (displayName, photoURL)
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: trimmedName,
          photoURL: photoURL || ''
        });

        // 2. Update Email if changed
        if (trimmedEmail.toLowerCase() !== session.email.toLowerCase()) {
          try {
            // If re-auth was requested and password provided:
            if (currentPasswordForEmail) {
              const credential = EmailAuthProvider.credential(session.email, currentPasswordForEmail);
              await reauthenticateWithCredential(currentUser, credential);
            }

            if ('verifyBeforeUpdateEmail' in currentUser) {
              await verifyBeforeUpdateEmail(currentUser, trimmedEmail);
            } else {
              await updateEmail(currentUser, trimmedEmail);
            }
            setRequiresPasswordForEmail(false);
            setCurrentPasswordForEmail('');
          } catch (emailErr: unknown) {
            const errCode = (emailErr as { code?: string })?.code;
            if (errCode === 'auth/requires-recent-login') {
              setRequiresPasswordForEmail(true);
              setIsLoading(false);
              setFeedback({
                type: 'error',
                message: 'Por seguridad, ingresa tu contraseña actual para confirmar el cambio de correo electrónico.'
              });
              return;
            }
            throw emailErr;
          }
        }
      }

      // 3. Update Firestore (users/{uid} y businesses/{clubId}/staff/{uid})
      await updateAdminProfileInFirestore({
        uid: session.uid,
        clubId: session.clubId || activeClub.id,
        displayName: trimmedName,
        photoURL: photoURL || '',
        email: trimmedEmail
      });

      // 4. Update session locally
      const updated: AdminStaffSession = {
        ...session,
        displayName: trimmedName,
        email: trimmedEmail,
        photoURL: photoURL || undefined
      };
      onProfileUpdated(updated);

      setIsLoading(false);
      setFeedback({ type: 'success', message: '¡Perfil actualizado con éxito!' });
    } catch (err: unknown) {
      setIsLoading(false);
      const errMsg = err instanceof Error ? err.message : 'Error al guardar los datos del perfil.';
      setFeedback({ type: 'error', message: errMsg });
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    if (!currentPassword) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'Debes ingresar tu contraseña actual.' });
      return;
    }

    if (newPassword.length < 6) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'La confirmación de la nueva contraseña no coincide.' });
      return;
    }

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No hay usuario autenticado activo.');
      }

      // 1. Reautenticar con contraseña actual
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Actualizar contraseña
      await updatePassword(currentUser, newPassword);

      setIsLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
    } catch (err: unknown) {
      setIsLoading(false);
      const errCode = (err as { code?: string })?.code;
      let msg = 'Error al cambiar contraseña.';
      if (errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
        msg = 'La contraseña actual ingresada es incorrecta.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ type: 'error', message: msg });
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      if (!auth || !session.email) {
        throw new Error('No se pudo determinar el correo del usuario.');
      }
      await sendPasswordResetEmail(auth, session.email);
      setIsLoading(false);
      setFeedback({
        type: 'success',
        message: `Se envió un enlace para restablecer tu contraseña a ${session.email}. Revisa tu bandeja de entrada o spam.`
      });
    } catch (err: unknown) {
      setIsLoading(false);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'No se pudo enviar el correo de restablecimiento.'
      });
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: 'rgba(3, 4, 7, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-light, rgba(229, 181, 79, 0.3))',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(229, 181, 79, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-subtle, rgba(229, 181, 79, 0.12))',
              border: '1px solid var(--border-light, rgba(229, 181, 79, 0.35))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="var(--brand-gold)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-high, #ffffff)', margin: 0 }}>
                Perfil de Administrador
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Configuración de cuenta, identidad visual y credenciales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px' }}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-light, rgba(255, 255, 255, 0.06))'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('GENERAL'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'GENERAL' ? 'var(--accent-subtle, rgba(229, 181, 79, 0.25))' : 'transparent',
              color: activeTab === 'GENERAL' ? 'var(--brand-gold)' : 'var(--text-muted)',
              boxShadow: activeTab === 'GENERAL' ? 'inset 0 0 0 1px var(--border-light, rgba(229, 181, 79, 0.4))' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Datos de Cuenta & Foto
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('SECURITY'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'SECURITY' ? 'var(--accent-subtle, rgba(229, 181, 79, 0.25))' : 'transparent',
              color: activeTab === 'SECURITY' ? 'var(--brand-gold)' : 'var(--text-muted)',
              boxShadow: activeTab === 'SECURITY' ? 'inset 0 0 0 1px var(--border-light, rgba(229, 181, 79, 0.4))' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Seguridad & Contraseña
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: feedback.type === 'success' ? '1px solid var(--state-success, #10b981)' : '1px solid var(--state-danger, #ef4444)',
            color: feedback.type === 'success' ? 'var(--state-success, #34d399)' : 'var(--state-danger, #f87171)'
          }}>
            {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span style={{ lineHeight: 1.4 }}>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: General & Photo */}
        {activeTab === 'GENERAL' && (
          <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Avatar Upload Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              {/* Avatar circle */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.05) 100%)',
                  border: '2px solid var(--brand-gold)',
                  boxShadow: '0 0 16px rgba(229, 181, 79, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--brand-gold)' }}>
                      {displayName.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                {/* Camera upload badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Cambiar foto de perfil"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--brand-gold)',
                    border: '2px solid var(--bg-void, #080c14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--bg-void, #080c14)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                  Foto de Perfil
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Formatos admitidos: JPG, PNG, WebP (recorte automático a 256x256)
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.74rem' }}
                  >
                    Subir Foto
                  </button>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--state-danger, #f87171)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Field: Nombre de Usuario (Editable) */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)', display: 'block', marginBottom: '6px' }}>
                Nombre del Administrador
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre o apodo operativo"
                  className="floorplan-input"
                  style={{
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    fontSize: '0.84rem'
                  }}
                />
                <User size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Visible en la consola, bitácora de auditoría y asignación de mesas.
              </span>
            </div>

            {/* Field: Nombre del Negocio (ESTRICTAMENTE BLOQUEADO / NO MODIFICABLE) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Nombre del Establecimiento / Negocio
                </label>
                <span style={{
                  fontSize: '0.62rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--state-danger, #f87171)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Lock size={10} />
                  NO MODIFICABLE
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={activeClub.name}
                  disabled
                  readOnly
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    background: 'var(--bg-elevated, rgba(15, 20, 28, 0.6))',
                    border: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
                    borderRadius: '10px',
                    color: 'var(--text-muted)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'not-allowed'
                  }}
                />
                <Building2 size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
                🔒 El nombre del negocio define la identidad pública y fiscal del club. No puede alterarse desde el perfil de usuario. Para cambios de razón social, contacta al soporte técnico.
              </span>
            </div>

            {/* Field: Correo Electrónico (Editable) */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)', display: 'block', marginBottom: '6px' }}>
                Correo Electrónico de Acceso
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuclub.com"
                  className="floorplan-input"
                  style={{
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    fontSize: '0.84rem'
                  }}
                />
                <Mail size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Utilizado para iniciar sesión en la consola administrativa.
              </span>
            </div>

            {/* If email changed and requires recent login */}
            {requiresPasswordForEmail && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--state-hold, #fbbf24)' }}>
                  Ingresa tu Contraseña Actual para confirmar nuevo correo:
                </label>
                <input
                  type="password"
                  value={currentPasswordForEmail}
                  onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="floorplan-input"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-luxury-action"
                style={{ padding: '8px 22px', fontSize: '0.84rem' }}
              >
                {isLoading ? 'Guardando cambios...' : 'Guardar Información'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'SECURITY' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Field: Current Password */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)', display: 'block', marginBottom: '6px' }}>
                Contraseña Actual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="floorplan-input"
                  style={{
                    padding: '9px 36px 9px 36px',
                    borderRadius: '10px',
                    fontSize: '0.84rem'
                  }}
                />
                <KeyRound size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Field: New Password */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)', display: 'block', marginBottom: '6px' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="floorplan-input"
                  style={{
                    padding: '9px 36px 9px 36px',
                    borderRadius: '10px',
                    fontSize: '0.84rem'
                  }}
                />
                <Lock size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Field: Confirm New Password */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)', display: 'block', marginBottom: '6px' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    background: 'rgba(8, 10, 16, 0.85)',
                    border: '1px solid rgba(229, 181, 79, 0.3)',
                    borderRadius: '10px',
                    color: 'var(--text-high, #ffffff)',
                    fontSize: '0.84rem'
                  }}
                />
                <Lock size={15} color="var(--brand-gold)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Alternative: Send Password Reset Email */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high, #ffffff)' }}>
                  ¿Olvidaste tu contraseña actual?
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Enviaremos un enlace seguro a {session.email}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isLoading}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(229, 181, 79, 0.1)',
                  border: '1px solid rgba(229, 181, 79, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--brand-gold)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Enviar Enlace
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-luxury-action"
                style={{ padding: '8px 22px', fontSize: '0.84rem' }}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
