import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, DollarSign, Shield, User, Crown, Code, Calendar } from 'lucide-react';
import { addCreditsToUser, addPlanToUser, updateUserRole } from '../services/db';
import { useAuth } from '../context/AuthContext';
import './EditUserModal.css';

const EditUserModal = ({ user, isOpen, onClose, onSave }) => {
    const { user: currentUser } = useAuth();
    const [creditsToAdd, setCreditsToAdd] = useState(0);
    const [role, setRole] = useState(user?.role || 'free');
    const [planDuration, setPlanDuration] = useState(30);
    const [creditPrice, setCreditPrice] = useState(0);
    const [planPrice, setPlanPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [actionType, setActionType] = useState(''); // 'credits', 'plan', or 'role'

    // Precios sugeridos
    const suggestedPrices = {
        credits: {
            100: 50,
            500: 200,
            1000: 350
        },
        plan: {
            1: 20,
            7: 100,
            15: 180,
            30: 300
        }
    };

    useEffect(() => {
        if (user) {
            setRole(user.role || 'free');
            setCreditsToAdd(0);
            setError('');
            setSuccessMessage('');
        }
    }, [user]);

    const handleAddCredits = async () => {
        if (creditsToAdd <= 0) {
            setError('Por favor ingresa una cantidad válida de créditos');
            return;
        }

        if (creditPrice <= 0) {
            setError('Por favor ingresa un precio válido');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await addCreditsToUser(user.id, creditsToAdd, currentUser.id, currentUser.name, creditPrice);
            setSuccessMessage(`✅ ${creditsToAdd} créditos vendidos por $${creditPrice}`);
            setCreditsToAdd(0);
            setCreditPrice(0);
            setTimeout(() => {
                setSuccessMessage('');
                onSave();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error adding credits:', error);
            setError(error.message || 'Error al agregar créditos');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlan = async () => {
        if (!planDuration || planDuration <= 0) {
            setError('Por favor selecciona una duración válida');
            return;
        }

        if (planPrice <= 0) {
            setError('Por favor ingresa un precio válido');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await addPlanToUser(user.id, planDuration, currentUser.id, currentUser.name, planPrice);
            const planName = planDuration === 1 ? 'Plan Diario' : planDuration === 7 ? 'Plan Semanal' : planDuration === 15 ? 'Plan Quincenal' : 'Plan Mensual';
            setSuccessMessage(`✅ ${planName} vendido por $${planPrice}`);
            setPlanPrice(0);
            setTimeout(() => {
                setSuccessMessage('');
                onSave();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error adding plan:', error);
            setError(error.message || 'Error al agregar plan');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async () => {
        if (role === user.role) {
            setError('El rol no ha cambiado');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await updateUserRole(user.id, role, currentUser.id);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error updating role:', error);
            setError(error.message || 'Error al actualizar rol');
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const getRoleIcon = (roleName) => {
        const icons = {
            free: User,
            premium: Crown,
            pro: Shield,
            admin: Shield,
            dev: Code
        };
        const Icon = icons[roleName] || User;
        return <Icon size={16} />;
    };

    const getRoleColor = (roleName) => {
        const colors = {
            free: '#6b7280',
            premium: '#3b82f6',
            pro: '#8b5cf6',
            admin: '#f59e0b',
            dev: '#10b981'
        };
        return colors[roleName] || '#6b7280';
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Sin expiración';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay with Modal Inside */}
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            className="edit-user-modal glass"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="modal-header">
                                <h2>Gestionar Usuario</h2>
                                <button className="close-btn" onClick={onClose}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="user-info-display">
                                <div
                                    className="user-avatar-large"
                                    style={{ background: user?.avatar?.color || '#6366f1' }}
                                >
                                    {user?.avatar?.initials || 'U'}
                                </div>
                                <div className="user-details">
                                    <h3>{user?.name}</h3>
                                    <p>{user?.email}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="success-message">
                                    {successMessage}
                                </div>
                            )}

                            {/* 3-Column Layout */}
                            <div className="modal-columns">
                                {/* Column 1: Current Plan Info */}
                                <div className="modal-column">
                                    <h4 className="column-title">Plan Actual</h4>
                                    <div className="plan-details">
                                        <div className="plan-item">
                                            <span className="plan-label">Rol:</span>
                                            <span className={`role-badge ${user?.role}`}>
                                                {getRoleIcon(user?.role)}
                                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                            </span>
                                        </div>
                                        <div className="plan-item">
                                            <span className="plan-label">Créditos:</span>
                                            <span className="plan-value">
                                                {user?.role === 'dev' ? '∞' : (user?.credits?.toLocaleString() || '0')}
                                            </span>
                                        </div>
                                        {user?.planExpiresAt && (
                                            <div className="plan-item">
                                                <span className="plan-label">Expira:</span>
                                                <span className="plan-value">{formatDate(user.planExpiresAt)}</span>
                                            </div>
                                        )}
                                        {!user?.planExpiresAt && user?.role === 'free' && (
                                            <div className="plan-item">
                                                <span className="plan-label">Expira:</span>
                                                <span className="plan-value">Sin expiración</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Change Role (Dev Only) */}
                                {currentUser?.role === 'dev' && (
                                    <div className="modal-column">
                                        <h4 className="column-title">Cambiar Rol (Solo Dev)</h4>
                                        <div className="form-group">
                                            <div className="role-selector-vertical">
                                                {['miembro', 'admin', 'dev'].map((roleName) => (
                                                    <button
                                                        key={roleName}
                                                        className={`role-option ${role === roleName ? 'active' : ''}`}
                                                        onClick={() => setRole(roleName)}
                                                        style={{
                                                            borderColor: role === roleName ? getRoleColor(roleName) : 'var(--glass-border)'
                                                        }}
                                                    >
                                                        {getRoleIcon(roleName)}
                                                        <span>{roleName.charAt(0).toUpperCase() + roleName.slice(1)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {role !== user?.role && (
                                                <button
                                                    className="btn-action"
                                                    onClick={() => {
                                                        setActionType('role');
                                                        setShowConfirm(true);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    Actualizar Rol
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Column 3: Add Credits + Add Plan */}
                                {user?.role !== 'dev' && (
                                    <div className="modal-column">
                                        <h4 className="column-title">Gestión de Créditos y Planes</h4>

                                        {/* Add Credits */}
                                        <div className="form-group">
                                            <label>
                                                <DollarSign size={18} />
                                                Agregar Créditos
                                            </label>
                                            <div className="credits-add-section">
                                                <select
                                                    value={creditsToAdd}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        setCreditsToAdd(value);
                                                        setCreditPrice(suggestedPrices.credits[value] || 0);
                                                    }}
                                                    className="credits-input"
                                                >
                                                    <option value={0}>Seleccionar...</option>
                                                    <option value={100}>100 Créditos</option>
                                                    <option value={500}>500 Créditos</option>
                                                    <option value={1000}>1000 Créditos</option>
                                                </select>
                                            </div>
                                            <div className="credits-add-section" style={{ marginTop: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={creditPrice}
                                                    onChange={(e) => setCreditPrice(parseInt(e.target.value) || 0)}
                                                    className="credits-input"
                                                    placeholder="Precio ($)"
                                                    min="0"
                                                />
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleAddCredits}
                                                    disabled={loading || creditsToAdd <= 0 || creditPrice <= 0}
                                                >
                                                    <Plus size={18} />
                                                    Vender ${creditPrice}
                                                </button>
                                            </div>
                                            <small>Precio sugerido: ${suggestedPrices.credits[creditsToAdd] || 0}</small>
                                        </div>

                                        {/* Add Plan */}
                                        <div className="form-group">
                                            <label>
                                                <Calendar size={18} />
                                                Agregar Tiempo de Plan
                                            </label>
                                            <div className="plan-duration-grid">
                                                <button
                                                    className={`duration-option ${planDuration === 1 ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPlanDuration(1);
                                                        setPlanPrice(suggestedPrices.plan[1]);
                                                    }}
                                                >
                                                    Básico
                                                    <span>1 Día</span>
                                                </button>
                                                <button
                                                    className={`duration-option ${planDuration === 7 ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPlanDuration(7);
                                                        setPlanPrice(suggestedPrices.plan[7]);
                                                    }}
                                                >
                                                    Semanal
                                                    <span>7 Días</span>
                                                </button>
                                                <button
                                                    className={`duration-option ${planDuration === 15 ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPlanDuration(15);
                                                        setPlanPrice(suggestedPrices.plan[15]);
                                                    }}
                                                >
                                                    Quincenal
                                                    <span>15 Días</span>
                                                </button>
                                                <button
                                                    className={`duration-option ${planDuration === 30 ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPlanDuration(30);
                                                        setPlanPrice(suggestedPrices.plan[30]);
                                                    }}
                                                >
                                                    Mensual
                                                    <span>30 Días</span>
                                                </button>
                                            </div>
                                            <div className="credits-add-section" style={{ marginTop: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={planPrice}
                                                    onChange={(e) => setPlanPrice(parseInt(e.target.value) || 0)}
                                                    className="credits-input"
                                                    placeholder="Precio ($)"
                                                    min="0"
                                                />
                                            </div>
                                            <button
                                                className="btn-primary"
                                                onClick={handleAddPlan}
                                                disabled={loading || planPrice <= 0}
                                                style={{ marginTop: '0.5rem' }}
                                            >
                                                <Plus size={18} />
                                                Vender por ${planPrice}
                                            </button>
                                            <small>Precio sugerido: ${suggestedPrices.plan[planDuration] || 0}</small>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {/* <div className="modal-actions">
                                <button className="btn-secondary" onClick={onClose} disabled={loading}>
                                    Cerrar
                                </button>
                            </div> */}
                        </motion.div>
                    </motion.div>

                    {/* Confirmation Dialog */}
                    {showConfirm && (
                        <motion.div
                            className="confirm-dialog glass"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <h3>Confirmar Cambio de Rol</h3>
                            <p>¿Estás seguro de cambiar el rol de {user?.name} a {role}?</p>
                            <div className="confirm-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleUpdateRole}
                                    disabled={loading}
                                >
                                    {loading ? 'Actualizando...' : 'Confirmar'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default EditUserModal;
