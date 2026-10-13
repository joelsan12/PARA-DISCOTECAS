import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Smartphone,
  Mail,
  AlertTriangle,
  X,
  Copy,
  Check,
  Edit2,
  Ban,
  Layers,
  RefreshCw,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Club } from '../../../types';
import type { AdminStaffSession } from '../../../lib/adminAuth';
import { callFunctions } from '../../../lib/functionsClient';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface StaffItem {
  uid: string;
  businessId: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  role: 'owner' | 'manager' | 'door' | 'finance' | 'waiter';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  assignedZones: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

const ZONE_OPTIONS: string[] = [
  'VIP Stage',
  'DJ Booth',
  'Dance Floor',
  'Suites VIP',
  'Palco',
  'Platinum',
  'Gold',
  'Silver',
  'Terrace Lounge'
];

interface Props {
  activeClub: Club;
  session: AdminStaffSession;
}

const ROLE_LABELS: Record<StaffItem['role'], { label: string; color: string; bg: string }> = {
  waiter: { label: 'Mesero de Sala', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  door: { label: 'Control de Puerta', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  finance: { label: 'Finanzas & Cierres', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  manager: { label: 'Gerente General', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  owner: { label: 'Propietario / Socio', color: '#e5b54f', bg: 'rgba(229, 181, 79, 0.14)' }
};

export const StaffManager: React.FC<Props> = ({ activeClub, session }) => {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formRole, setFormRole] = useState<StaffItem['role']>('waiter');
  const [formZones, setFormZones] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Temporary Password Banner state
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    email: string;
    password: string;
    name: string;
    role: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const staffNameId = useId();
  const staffEmailId = useId();
  const staffPasswordId = useId();
  const staffWhatsappId = useId();
  const staffRoleId = useId();

  const isCallerOwner = session.staffRole === 'owner' || session.isSuperAdmin;

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Consulta primaria al backend seguro
      const res = await callFunctions<{ staff: StaffItem[] }>('listBusinessStaff', {
        businessId: activeClub.id
      });
      setStaffList(res.staff || []);
      return;
    } catch {
      // 2. Consulta de respaldo directo en Firestore si el backend está reiniciando
      try {
        if (db) {
          const snapshot = await getDocs(collection(db, 'businesses', activeClub.id, 'staff'));
          if (!snapshot.empty) {
            const list: StaffItem[] = snapshot.docs.map(docSnap => {
              const data = docSnap.data();
              return {
                uid: docSnap.id,
                businessId: activeClub.id,
                name: (data.name as string) || 'Colaborador',
                email: (data.email as string) || '',
                whatsapp: (data.whatsapp as string) || null,
                role: (data.role as StaffItem['role']) || 'waiter',
                status: (data.status as StaffItem['status']) || 'ACTIVE',
                assignedZones: Array.isArray(data.assignedZones) ? data.assignedZones : [],
                createdAt: typeof data.createdAt === 'string' ? data.createdAt : null,
                updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
              };
            });
            setStaffList(list);
            return;
          }
        }
      } catch {
        // Fallback de Firestore no disponible
      }

      setError(
        'El servicio de gestión de personal no pudo sincronizarse. Verifica tu conexión con el backend de Nightflow o pulsa en reintentar.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeClub.id]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowPassword(false);
    setFormWhatsapp('');
    setFormRole('waiter');
    setFormZones(['VIP Stage', 'Palco']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StaffItem) => {
    setEditingStaff(item);
    setFormName(item.name);
    setFormEmail(item.email);
    setFormPassword('');
    setShowPassword(false);
    setFormWhatsapp(item.whatsapp || '');
    setFormRole(item.role);
    setFormZones(item.assignedZones || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(`${pwd}!26`);
    setShowPassword(true);
  };

  const toggleZone = (zone: string) => {
    setFormZones(prev => {
      if (prev.includes(zone)) {
        return prev.filter(z => z !== zone);
      }
      if (prev.length >= 9) return prev;
      return [...prev, zone];
    });
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: Record<string, unknown> = {
        businessId: activeClub.id,
        role: formRole,
        assignedZones: formZones
      };

      if (formPassword.trim()) {
        if (formPassword.trim().length < 6) {
          setFormError('La contraseña debe tener al menos 6 caracteres.');
          setSubmitting(false);
          return;
        }
        payload.password = formPassword.trim();
      }

      if (editingStaff) {
        payload.uid = editingStaff.uid;
        if (formName.trim()) payload.name = formName.trim();
        if (formWhatsapp.trim()) payload.whatsapp = formWhatsapp.trim();
      } else {
        if (!formEmail.trim()) {
          setFormError('El correo electrónico es requerido para invitar al colaborador.');
          setSubmitting(false);
          return;
        }
        payload.email = formEmail.trim().toLowerCase();
        payload.name = formName.trim() || 'Staff';
        if (formWhatsapp.trim()) payload.whatsapp = formWhatsapp.trim();
      }

      const res = await callFunctions<{
        ok: boolean;
        uid: string;
        name: string;
        email: string;
        role: StaffItem['role'];
        temporaryPassword?: string;
      }>('upsertStaffMember', payload);

      setIsModalOpen(false);
      await loadStaff();

      if (res.temporaryPassword) {
        setTempPasswordModal({
          email: res.email,
          password: res.temporaryPassword,
          name: res.name,
          role: ROLE_LABELS[res.role as keyof typeof ROLE_LABELS]?.label || res.role
        });
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el colaborador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (item: StaffItem) => {
    if (item.uid === session.uid) {
      alert('No puedes revocar tu propio acceso administrativo.');
      return;
    }
    const confirmed = window.confirm(
      `¿Confirmas la revocación inmediata de ${item.name} (${ROLE_LABELS[item.role]?.label})?\n\nEl usuario perderá el acceso instantáneamente. Esta acción queda en la bitácora de auditoría.`
    );
    if (!confirmed) return;

    try {
      await callFunctions<{ ok: boolean }>('revokeStaffMember', {
        businessId: activeClub.id,
        uid: item.uid
      });
      await loadStaff();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al revocar el acceso del colaborador.');
    }
  };

  const copyCredentials = () => {
    if (!tempPasswordModal) return;
    const text = `Credenciales de Acceso — NIGHTFLOW VIP\nEstablecimiento: ${activeClub.name}\nRol: ${tempPasswordModal.role}\nNombre: ${tempPasswordModal.name}\nUsuario (Correo): ${tempPasswordModal.email}\nContraseña: ${tempPasswordModal.password}\n\nIngresa al portal de acceso: http://localhost:5174/`;
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 3000);
  };

  const filteredStaff = staffList.filter(s => {
    if (filterRole === 'all') return true;
    return s.role === filterRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 20, 30, 0.85) 0%, rgba(8, 10, 16, 0.95) 100%)',
        border: '1px solid rgba(229, 181, 79, 0.25)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(229, 181, 79, 0.1)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e5b54f'
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f4f1ea', margin: 0 }}>
                Equipo &amp; Personal de Sala
              </h2>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                {staffList.filter(s => s.status === 'ACTIVE').length} / 50 ACTIVOS
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Control granular de roles (meseros, puerta, finanzas y gerencia) con asignación de zonas operativas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
            color: '#0a0d14',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '0.84rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(229, 181, 79, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <UserPlus size={16} />
          <span>Agregar Colaborador</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'waiter', label: 'Meseros' },
          { key: 'door', label: 'Control Puerta' },
          { key: 'finance', label: 'Finanzas' },
          { key: 'manager', label: 'Gerencia' },
          { key: 'owner', label: 'Propietarios' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterRole(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: filterRole === tab.key ? 'rgba(229, 181, 79, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filterRole === tab.key ? '#e5b54f' : '#94a3b8',
              border: filterRole === tab.key ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Staff List or Empty */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          Consultando plantilla de personal...
        </div>
      ) : error ? (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          fontSize: '0.86rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadStaff()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={13} />
            <span>Reintentar Conexión</span>
          </button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'rgba(12, 16, 24, 0.6)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          color: '#64748b'
        }}>
          <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No hay colaboradores en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredStaff.map(member => {
            const roleInfo = ROLE_LABELS[member.role] || {
              label: member.role,
              color: '#94a3b8',
              bg: 'rgba(148, 163, 184, 0.1)'
            };
            const isRevoked = member.status === 'REVOKED';

            return (
              <div
                key={member.uid}
                style={{
                  background: 'linear-gradient(145deg, rgba(14, 18, 28, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
                  border: isRevoked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  opacity: isRevoked ? 0.65 : 1
                }}
              >
                {/* Top Row: Avatar & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isRevoked ? 'rgba(239, 68, 68, 0.15)' : roleInfo.bg,
                      color: isRevoked ? '#f87171' : roleInfo.color,
                      border: `1px solid ${isRevoked ? 'rgba(239, 68, 68, 0.4)' : roleInfo.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem'
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#f4f1ea' }}>
                        {member.name}
                      </h4>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '3px',
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: roleInfo.bg,
                        color: roleInfo.color,
                        border: `1px solid ${roleInfo.color}40`,
                        letterSpacing: '0.04em'
                      }}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isRevoked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                    color: isRevoked ? '#f87171' : '#34d399',
                    border: isRevoked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    {isRevoked ? 'REVOCADO' : 'ACTIVO'}
                  </span>
                </div>

                {/* Details (Email, WhatsApp) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {member.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={13} style={{ color: '#64748b' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email}
                      </span>
                    </div>
                  )}
                  {member.whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={13} style={{ color: '#64748b' }} />
                      <span>{member.whatsapp}</span>
                    </div>
                  )}
                </div>

                {/* Zones (chips) for waiteros */}
                {member.role === 'waiter' && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Layers size={12} style={{ color: '#38bdf8' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                        ZONAS ASIGNADAS
                      </span>
                    </div>
                    {member.assignedZones && member.assignedZones.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {member.assignedZones.map(zone => (
                          <span
                            key={zone}
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              color: '#93c5fd',
                              border: '1px solid rgba(56, 189, 248, 0.2)'
                            }}
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                        Todas las zonas (sin restricción)
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!isRevoked && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '10px',
                    marginTop: 'auto'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      style={{
                        background: 'rgba(229, 181, 79, 0.08)',
                        border: '1px solid rgba(229, 181, 79, 0.25)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#e5b54f',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Gestionar correo y contraseña de este colaborador"
                    >
                      <Key size={12} />
                      <span>Credenciales</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#cbd5e1',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit2 size={12} />
                      <span>Editar</span>
                    </button>
                    {member.uid !== session.uid && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(member)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: '#f87171',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Ban size={12} />
                        <span>Revocar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Alta / Edición */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 5, 8, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0e121a 0%, #07090f 100%)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} style={{ color: '#e5b54f' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f1ea' }}>
                  {editingStaff ? 'Modificar Personal' : 'Nuevo Colaborador de Sala'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {formError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem'
                }}>
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor={staffNameId} style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  NOMBRE COMPLETO
                </label>
                <input
                  id={staffNameId}
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Sofía Valarezo"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f4f1ea',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor={staffEmailId} style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  CORREO ELECTRÓNICO (IDENTIDAD)
                </label>
                <input
                  id={staffEmailId}
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="sofia@tuclub.com"
                  disabled={Boolean(editingStaff)}
                  required
                  style={{
                    width: '100%',
                    background: editingStaff ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: editingStaff ? '#64748b' : '#f4f1ea',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Contraseña de Acceso (Credencial) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor={staffPasswordId} style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8' }}>
                    {editingStaff ? 'ESTABLECER NUEVA CONTRASEÑA (OPCIONAL)' : 'CONTRASEÑA DE ACCESO'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    style={{
                      background: 'rgba(229, 181, 79, 0.12)',
                      border: '1px solid rgba(229, 181, 79, 0.35)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      color: '#e5b54f',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Key size={11} />
                    <span>Generar Segura</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id={staffPasswordId}
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder={editingStaff ? 'Dejar vacío para conservar contraseña actual' : 'Ej: Portero2026! (mín. 6 caracteres)'}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 42px 10px 14px',
                      color: '#f4f1ea',
                      fontSize: '0.86rem',
                      fontFamily: showPassword ? 'monospace' : 'inherit',
                      letterSpacing: showPassword ? '0.04em' : 'normal',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                  {editingStaff
                    ? 'Escribe una nueva contraseña para actualizar las credenciales de este usuario.'
                    : 'Ingresa la contraseña del colaborador o haz clic en «Generar Segura». Si la dejas vacía, se generará una automáticamente.'}
                </p>
              </div>

              <div>
                <label htmlFor={staffWhatsappId} style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  WHATSAPP DE CONTACTO (OPCIONAL)
                </label>
                <input
                  id={staffWhatsappId}
                  type="tel"
                  value={formWhatsapp}
                  onChange={e => setFormWhatsapp(e.target.value)}
                  placeholder="+593 99 123 4567"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f4f1ea',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor={staffRoleId} style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  ROL DE OPERACIONES
                </label>
                <select
                  id={staffRoleId}
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as StaffItem['role'])}
                  style={{
                    width: '100%',
                    background: '#0a0d14',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f4f1ea',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="waiter">Mesero de Sala (Consumo y Pedidos)</option>
                  <option value="door">Control de Puerta (Escáner y Reingreso)</option>
                  <option value="finance">Finanzas (Cierre de Cuentas y Pasarela)</option>
                  <option value="manager">Gerente (Gestión Integral y Sala)</option>
                  {isCallerOwner && <option value="owner">Propietario / Socio Fundador</option>}
                </select>
              </div>

              {/* Zonas Asignadas (Crucial para meseros) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8' }}>
                    ZONAS SALA ASIGNADAS ({formZones.length}/9)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {formRole === 'waiter' ? 'Filtra las mesas de su PWA móvil' : 'Informativo para este rol'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ZONE_OPTIONS.map(z => {
                    const selected = formZones.includes(z);
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: selected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          color: selected ? '#38bdf8' : '#94a3b8',
                          border: selected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {z}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    color: '#94a3b8',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    color: '#0a0d14',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(229, 181, 79, 0.25)'
                  }}
                >
                  {submitting ? 'Guardando...' : editingStaff ? 'Actualizar' : 'Dar de Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Credenciales Asignadas */}
      {tempPasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 5, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #121824 0%, #080c14 100%)',
            border: '1px solid rgba(229, 181, 79, 0.4)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <Key size={22} style={{ color: '#e5b54f' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f4f1ea' }}>
                Credenciales Asignadas con Éxito
              </h3>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              Se han configurado las credenciales para <strong>{tempPasswordModal.name}</strong> ({tempPasswordModal.role}).
              Comparte estos datos para que inicie sesión en <strong>http://localhost:5174/</strong>:
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(229, 181, 79, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '18px'
            }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>USUARIO (CORREO)</span>
                <div style={{ fontSize: '0.9rem', color: '#f4f1ea', fontWeight: 600 }}>{tempPasswordModal.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>CONTRASEÑA DE ACCESO</span>
                <div style={{
                  fontSize: '1.05rem',
                  fontFamily: 'monospace',
                  color: '#e5b54f',
                  fontWeight: 800,
                  letterSpacing: '0.08em'
                }}>
                  {tempPasswordModal.password}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '0.74rem',
              color: '#34d399'
            }}>
              <Check size={15} />
              <span>Credenciales sincronizadas en Firebase Authentication para este establecimiento.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={copyCredentials}
                style={{
                  flex: 1,
                  background: copiedPass ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${copiedPass ? '#34d399' : '#38bdf8'}`,
                  borderRadius: '10px',
                  padding: '10px',
                  color: copiedPass ? '#34d399' : '#38bdf8',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedPass ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedPass ? 'Copiado al Portapapeles' : 'Copiar Credencial'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTempPasswordModal(null)}
                style={{
                  background: 'linear-gradient(135deg, #e5b54f 0%, #c49535 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: '#0a0d14',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
