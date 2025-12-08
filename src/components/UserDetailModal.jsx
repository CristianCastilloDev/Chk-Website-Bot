import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Calendar, DollarSign, TrendingUp, Shield, Clock } from 'lucide-react';
import { getUserSales, getUserLifetimeStats } from '../services/db';
import './UserDetailModal.css';

const UserDetailModal = ({ user, isOpen, onClose }) => {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && isOpen) {
            loadUserData();
        }
    }, [user, isOpen]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const [userSales, userStats] = await Promise.all([
                getUserSales(user.id),
                getUserLifetimeStats(user.id)
            ]);
            setSales(userSales.slice(0, 10)); // Last 10 transactions
            setStats(userStats);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleIcon = (role) => {
        return <Shield size={16} />;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    >
                        <motion.div
                            className="user-detail-modal glass"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="modal-header">
                                <h2>Detalles del Usuario</h2>
                                <button className="close-btn" onClick={onClose}>
                                    <X size={24} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Cargando datos...</p>
                                </div>
                            ) : (
                                <>
                                    {/* User Profile */}
                                    <div className="user-profile-section">
                                        <div
                                            className="user-avatar-xl"
                                            style={{ background: user?.avatar?.color || '#6366f1' }}
                                        >
                                            {user?.avatar?.initials || 'U'}
                                        </div>
                                        <div className="user-info">
                                            <h3>{user?.name}</h3>
                                            <div className="user-meta">
                                                <span className="meta-item">
                                                    <Mail size={14} />
                                                    {user?.email}
                                                </span>
                                                <span className={`role-badge ${user?.role}`}>
                                                    {getRoleIcon(user?.role)}
                                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="stats-grid-detail">
                                        <div className="stat-item">
                                            <div className="stat-icon gradient-primary">
                                                <Calendar size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Fecha de Registro</span>
                                                <span className="stat-value">{formatDate(user?.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon gradient-accent">
                                                <DollarSign size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Créditos Actuales</span>
                                                <span className="stat-value">
                                                    {user?.role === 'dev' ? '∞' : (user?.credits?.toLocaleString() || '0')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon gradient-warm">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Total Créditos Comprados</span>
                                                <span className="stat-value">{stats?.totalCreditsAdded?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon gradient-primary">
                                                <DollarSign size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Dinero Total Ingresado</span>
                                                <span className="stat-value">${stats?.totalMoneySpent?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon gradient-accent">
                                                <Shield size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Plan Actual</span>
                                                <span className="stat-value">{user?.plan?.type?.toUpperCase() || 'FREE'}</span>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon gradient-warm">
                                                <Clock size={20} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Expira</span>
                                                <span className="stat-value">
                                                    {user?.planExpiresAt ? formatDate(user.planExpiresAt) : 'Sin expiración'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purchase History */}
                                    <div className="purchase-history">
                                        <h4>Historial de Compras (Últimas 10)</h4>
                                        {sales.length === 0 ? (
                                            <p className="no-purchases">No hay compras registradas</p>
                                        ) : (
                                            <div className="purchases-list">
                                                {sales.map((sale) => (
                                                    <div key={sale.id} className="purchase-item">
                                                        <div className="purchase-icon">
                                                            {sale.type === 'credits' ? (
                                                                <DollarSign size={18} />
                                                            ) : (
                                                                <Calendar size={18} />
                                                            )}
                                                        </div>
                                                        <div className="purchase-details">
                                                            <span className="purchase-type">
                                                                {sale.type === 'credits' ? 'Créditos' : 'Plan'}
                                                            </span>
                                                            <span className="purchase-amount">
                                                                {sale.type === 'credits'
                                                                    ? `+${sale.creditsAdded} créditos`
                                                                    : `${sale.planAdded} (${sale.planDuration} días)`
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="purchase-meta">
                                                            <span className="purchase-admin">Por: {sale.adminName}</span>
                                                            <span className="purchase-date">{formatDate(sale.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="modal-actions">
                                        <button className="btn-primary" onClick={onClose}>
                                            Cerrar
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserDetailModal;
