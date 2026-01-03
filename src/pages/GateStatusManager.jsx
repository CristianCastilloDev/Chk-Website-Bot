import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Save, X, CheckCircle, AlertTriangle, XCircle, Edit2, Power, PowerOff, Wrench, Plus, CreditCard, Lock, Zap } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import { getAllGates, updateGateStatus, updateGate, createGate } from '../services/db';
import './Pages.css';

const GateStatusManager = () => {
    const [gates, setGates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingGate, setEditingGate] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const [newGateForm, setNewGateForm] = useState({
        name: '',
        type: 'stripe',
        category: 'CHARGE',
        description: '',
        status: 'inactive',
        icon: 'Shield',
        order: 1,
        chargeAmount: 1.00,
        command: ''
    });
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
            type: gate.type || 'stripe',
            category: gate.category || 'CHARGE',
            icon: gate.icon || 'Shield',
            status: gate.status || 'inactive',
            command: gate.command || ''
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

    const handleCreateGate = async () => {
        try {
            if (!newGateForm.name.trim()) {
                alert('❌ El nombre es requerido');
                return;
            }
            await createGate(newGateForm);
            await loadGates();
            setIsCreating(false);
            setNewGateForm({
                name: '',
                type: 'stripe',
                category: 'CHARGE',
                description: '',
                status: 'inactive',
                icon: 'Shield',
                order: 1,
                chargeAmount: 1.00,
                command: ''
            });
            alert('✅ Gate creado exitosamente');
        } catch (error) {
            console.error('Error creating gate:', error);
            alert('❌ Error al crear gate');
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
        const iconStyle = { width: '32px', height: '32px', borderRadius: '25%' };
        switch (type) {
            case 'stripe':
                return <img src="https://cdn.simpleicons.org/stripe/6366f1" alt="Stripe" style={iconStyle} />;
            case 'paypal':
                return <img src="https://cdn.simpleicons.org/paypal/0070ba" alt="PayPal" style={iconStyle} />;
            case 'braintree':
                return <img src="https://cdn.simpleicons.org/braintree/00c853" alt="Braintree" style={iconStyle} />;
            case 'authorize':
                return <img src="https://play-lh.googleusercontent.com/tr8pu9LKDdj1jwezlMPSntXjdNOgIuzYUQM5rK4Cnr8tJf6LDAxhdj4SaR4BYt7XKg=w240-h480-rw" alt="Authorize.Net" style={iconStyle} />;
            case 'cardknox':
                return <img src="https://avatars.githubusercontent.com/u/12068809?s=200&v=4" alt="cardknox" style={iconStyle} />;
            case 'cybersource':
                return <img src="https://yt3.googleusercontent.com/ytc/AIdro_nFtxG9aSjVCran4CC53pNqV4hjhgM23hMduoangaiOQvA=s160-c-k-c0x00ffffff-no-rj" alt="Cybersource" style={iconStyle} />;
            case 'idk':
                return <Zap size={32} style={{ color: '#9333ea' }} />;
            case 'moneris':
                return <img src="https://avatars.githubusercontent.com/u/18684316?s=200&v=4" alt="Moneris" style={iconStyle} />;
            case 'nmi':
                return <img src="https://techspark.co/wp-content/uploads/2021/11/nmi-uai-516x516.png" alt="NMI" style={iconStyle} />;
            case 'payfabric':
                return <CreditCard size={32} style={{ color: '#0ea5e9' }} />;
            case 'payflow':
                return <img src="https://cdn.simpleicons.org/paypal/0070ba" alt="PayFlow" style={iconStyle} />;
            default:
                return <Shield size={32} />;
        }
    };

    const getCategoryColor = (category) => {
        return category === 'CHARGE' ? '#10b981' : '#3b82f6';
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
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1><Settings size={32} style={{ display: 'inline', marginRight: '10px' }} />Status Gates</h1>
                        <p>Gestión completa de gates</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setIsCreating(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                    >
                        <Plus size={20} />
                        Crear Gate
                    </button>
                </div>

                {/* Modal para Crear Gate */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                padding: '1rem'
                            }}
                            onClick={() => setIsCreating(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    maxWidth: '500px',
                                    width: '100%',
                                    maxHeight: '90vh',
                                    overflowY: 'auto'
                                }}
                            >
                                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={28} />
                                    Crear Nuevo Gate
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Nombre */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Nombre del Gate:</label>
                                        <input
                                            type="text"
                                            value={newGateForm.name}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, name: e.target.value })}
                                            placeholder="Ej: Stripe Charge 1"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    {/* Pasarela */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Pasarela:</label>
                                        <select
                                            value={newGateForm.type}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, type: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="stripe">Stripe</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="braintree">Braintree</option>
                                            <option value="authorize">Authorize.Net</option>
                                            <option value="cardknox">CardKnox</option>
                                            <option value="cybersource">Cybersource</option>
                                            <option value="idk">IDK</option>
                                            <option value="moneris">Moneris</option>
                                            <option value="nmi">NMI</option>
                                            <option value="payfabric">PayFabric</option>
                                            <option value="payflow">PayFlow</option>
                                        </select>
                                    </div>

                                    {/* Categoría */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Categoría:</label>
                                        <select
                                            value={newGateForm.category}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, category: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="CHARGE">⚡ Chargue</option>
                                            <option value="AUTH">🔐 Auth</option>
                                        </select>
                                    </div>

                                    {/* Monto de Cargo (solo para CHARGE) */}
                                    {newGateForm.category === 'CHARGE' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Monto del Cargo (USD):</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={newGateForm.chargeAmount}
                                                onChange={(e) => setNewGateForm({ ...newGateForm, chargeAmount: parseFloat(e.target.value) || 0 })}
                                                placeholder="1.00"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Descripción */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Descripción (para devs):</label>
                                        <textarea
                                            value={newGateForm.description}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, description: e.target.value })}
                                            placeholder="Descripción técnica del gate..."
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    {/* Comando de Telegram */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Comando de Telegram:</label>
                                        <input
                                            type="text"
                                            value={newGateForm.command}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, command: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                            placeholder="Ej: stripe1, klove100"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            El comando será: /{newGateForm.command || 'comando'}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Status Inicial:</label>
                                        <select
                                            value={newGateForm.status}
                                            onChange={(e) => setNewGateForm({ ...newGateForm, status: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="active">✅ Activo</option>
                                            <option value="maintenance">🔧 Mantenimiento</option>
                                            <option value="inactive">❌ Inactivo</option>
                                        </select>
                                    </div>

                                    {/* Botones */}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={handleCreateGate}
                                            style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
                                        >
                                            <Save size={18} style={{ marginRight: '0.5rem' }} />
                                            Crear Gate
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => setIsCreating(false)}
                                            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Pasarela:</label>
                                            <select
                                                value={editForm.type}
                                                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="stripe">Stripe</option>
                                                <option value="paypal">PayPal</option>
                                                <option value="braintree">Braintree</option>
                                                <option value="authorize">Authorize.Net</option>
                                                <option value="cardknox">CardKnox</option>
                                                <option value="cybersource">Cybersource</option>
                                                <option value="idk">IDK</option>
                                                <option value="moneris">Moneris</option>
                                                <option value="nmi">NMI</option>
                                                <option value="payfabric">PayFabric</option>
                                                <option value="payflow">PayFlow</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Categoría:</label>
                                            <select
                                                value={editForm.category}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="CHARGE">⚡ CHARGE</option>
                                                <option value="AUTH">🔐 AUTH</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Descripción:</label>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                rows={2}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Comando:</label>
                                            <input
                                                type="text"
                                                value={editForm.command}
                                                onChange={(e) => setEditForm({ ...editForm, command: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                                placeholder="Ej: stripe1"
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
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                                /{editForm.command || 'comando'}
                                            </p>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Status:</label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="active">✅ Activo</option>
                                                <option value="maintenance">🔧 Mantenimiento</option>
                                                <option value="inactive">❌ Inactivo</option>
                                            </select>
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
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {gate.type}
                                                        </p>
                                                        {gate.category && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '12px',
                                                                background: `${getCategoryColor(gate.category)}20`,
                                                                color: getCategoryColor(gate.category),
                                                                fontWeight: 600
                                                            }}>
                                                                {gate.category}
                                                            </span>
                                                        )}
                                                    </div>
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
