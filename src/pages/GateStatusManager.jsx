import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Save, X, CheckCircle, AlertTriangle, XCircle, Edit2, Power, PowerOff, Wrench } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import { getAllGates, updateGateStatus, updateGate } from '../services/db';
import './Pages.css';

const GateStatusManager = () => {
    const [gates, setGates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingGate, setEditingGate] = useState(null);
    const [editForm, setEditForm] = useState({});
    const { isDev } = usePermissions();

    useEffect(() => {
        if (isDev()) {
            loadGates();
        }
    }, []);

    const loadGates = async () => {
        try {
            setLoading(true);
            const allGates = await getAllGates();
            setGates(allGates);
        } catch (error) {
            console.error('Error loading gates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (gateId, newStatus) => {
        try {
            await updateGateStatus(gateId, newStatus);
            setGates(gates.map(g =>
                g.id === gateId ? { ...g, status: newStatus } : g
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Error al actualizar estado');
        }
    };

    const startEdit = (gate) => {
        setEditingGate(gate.id);
        setEditForm({
            name: gate.name,
            description: gate.description || '',
            apiEndpoint: gate.apiEndpoint || ''
        });
    };

    const cancelEdit = () => {
        setEditingGate(null);
        setEditForm({});
    };

    const saveEdit = async (gateId) => {
        try {
            await updateGate(gateId, editForm);
            setGates(gates.map(g =>
                g.id === gateId ? { ...g, ...editForm } : g
            ));
            setEditingGate(null);
            setEditForm({});
            alert('✅ Gate actualizado');
        } catch (error) {
            console.error('Error updating gate:', error);
            alert('❌ Error al actualizar');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'maintenance': return '#f59e0b';
            case 'inactive': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <Power size={16} />;
            case 'maintenance': return <Wrench size={16} />;
            case 'inactive': return <PowerOff size={16} />;
            default: return <Shield size={16} />;
        }
    };

    const getGateIcon = (type) => {
        switch (type) {
            case 'stripe':
                return <img src="https://cdn.simpleicons.org/stripe/6366f1" alt="Stripe" style={{ width: '32px', height: '32px' }} />;
            case 'paypal':
                return <img src="https://cdn.simpleicons.org/paypal/0070ba" alt="PayPal" style={{ width: '32px', height: '32px' }} />;
            case 'braintree':
                return <img src="https://cdn.simpleicons.org/braintree/00c853" alt="Braintree" style={{ width: '32px', height: '32px' }} />;
            default:
                return <Shield size={32} />;
        }
    };

    if (!isDev()) {
        return (
            <DashboardLayout currentPage="gate-status">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                    <h2>Acceso Denegado</h2>
                    <p>Solo los desarrolladores pueden acceder a esta página.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="gate-status">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1><Settings size={32} style={{ display: 'inline', marginRight: '10px' }} />Status Gates</h1>
                    <p>Gestión rápida de gates</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Cargando gates...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {gates.map(gate => (
                            <motion.div
                                key={gate.id}
                                className="glass"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${getStatusColor(gate.status)}20`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Status indicator bar */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: getStatusColor(gate.status)
                                }} />

                                {editingGate === gate.id ? (
                                    // Edit Mode
                                    <div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Nombre:</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Descripción:</label>
                                            <input
                                                type="text"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn-primary"
                                                onClick={() => saveEdit(gate.id)}
                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                            >
                                                <Save size={16} />
                                                Guardar
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={cancelEdit}
                                                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <>
                                        {/* Header with icon and status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {getGateIcon(gate.type)}
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{gate.name}</h3>
                                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        {gate.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '20px',
                                                background: `${getStatusColor(gate.status)}15`,
                                                color: getStatusColor(gate.status),
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                {getStatusIcon(gate.status)}
                                                <span style={{ textTransform: 'capitalize' }}>
                                                    {gate.status === 'active' ? 'Activo' : gate.status === 'maintenance' ? 'Mant.' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {gate.description && (
                                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                {gate.description}
                                            </p>
                                        )}

                                        {/* Quick Actions */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select
                                                value={gate.status}
                                                onChange={(e) => handleStatusChange(gate.id, e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                <option value="active">✅ Activo</option>
                                                <option value="maintenance">🔧 Mantenimiento</option>
                                                <option value="inactive">❌ Inactivo</option>
                                            </select>
                                            <button
                                                onClick={() => startEdit(gate)}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
};

export default GateStatusManager;
