import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { addCreditsToUser, addPlanToUser } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import './Modal.css';

const SalesModal = ({ isOpen, onClose, selectedUser, onSuccess }) => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [saleType, setSaleType] = useState('credits'); // 'credits' or 'plan'
    const [credits, setCredits] = useState(100);
    const [planDuration, setPlanDuration] = useState(7);
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Precios sugeridos
    const suggestedPrices = {
        credits: {
            100: 50,
            500: 200,
            1000: 350
        },
        plan: {
            7: 100,    // Semanal
            30: 300    // Mensual
        }
    };

    // Actualizar precio sugerido cuando cambia la cantidad
    const handleCreditsChange = (value) => {
        setCredits(value);
        setAmount(suggestedPrices.credits[value] || 0);
    };

    const handlePlanChange = (value) => {
        setPlanDuration(value);
        setAmount(suggestedPrices.plan[value] || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            showError('No hay usuario seleccionado');
            return;
        }

        if (amount <= 0) {
            showError('El precio debe ser mayor a 0');
            return;
        }

        setLoading(true);

        try {
            if (saleType === 'credits') {
                await addCreditsToUser(
                    selectedUser.id,
                    credits,
                    user.id,
                    user.name,
                    amount
                );
                showSuccess(`✅ ${credits} créditos vendidos por $${amount}`);
            } else {
                await addPlanToUser(
                    selectedUser.id,
                    planDuration,
                    user.id,
                    user.name,
                    amount
                );
                const planName = planDuration === 7 ? 'Semanal' : 'Mensual';
                showSuccess(`✅ Plan ${planName} vendido por $${amount}`);
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error creating sale:', error);
            showError('Error al crear la venta');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSaleType('credits');
        setCredits(100);
        setPlanDuration(7);
        setAmount(0);
    };

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <button className="modal-close" onClick={onClose} aria-label="Close modal">
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <div className="modal-icon modal-icon-info">
                        <DollarSign size={32} />
                    </div>
                    <h2>Crear Venta</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Usuario: <strong>{selectedUser?.name}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Tipo de Venta */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                Tipo de Venta
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSaleType('credits')}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        border: `2px solid ${saleType === 'credits' ? 'var(--primary)' : 'var(--glass-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        background: saleType === 'credits' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <CreditCard size={24} color={saleType === 'credits' ? 'var(--primary)' : 'var(--text-secondary)'} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Créditos</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaleType('plan')}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        border: `2px solid ${saleType === 'plan' ? 'var(--primary)' : 'var(--glass-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        background: saleType === 'plan' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Calendar size={24} color={saleType === 'plan' ? 'var(--primary)' : 'var(--text-secondary)'} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Plan</span>
                                </button>
                            </div>
                        </div>

                        {/* Cantidad */}
                        {saleType === 'credits' ? (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    Cantidad de Créditos
                                </label>
                                <select
                                    value={credits}
                                    onChange={(e) => handleCreditsChange(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value={100}>100 Créditos</option>
                                    <option value={500}>500 Créditos</option>
                                    <option value={1000}>1000 Créditos</option>
                                </select>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    Duración del Plan
                                </label>
                                <select
                                    value={planDuration}
                                    onChange={(e) => handlePlanChange(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value={7}>Plan Semanal (7 días)</option>
                                    <option value={30}>Plan Mensual (30 días)</option>
                                </select>
                            </div>
                        )}

                        {/* Precio */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                Precio ($)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                min="0"
                                step="1"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem',
                                    fontWeight: '600'
                                }}
                            />
                            <small style={{ color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block' }}>
                                Precio sugerido basado en la selección
                            </small>
                        </div>

                        {/* Resumen */}
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--primary)'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Resumen de Venta</h4>
                            <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>
                                Producto: <strong style={{ color: 'var(--text-primary)' }}>
                                    {saleType === 'credits' ? `${credits} Créditos` : `Plan ${planDuration === 7 ? 'Semanal' : 'Mensual'}`}
                                </strong>
                            </p>
                            <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>
                                Cliente: <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong>
                            </p>
                            <p style={{ margin: '0.25rem 0', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>
                                Total: ${amount}
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Procesando...' : 'Crear Venta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

SalesModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedUser: PropTypes.object,
    onSuccess: PropTypes.func.isRequired
};

export default SalesModal;
