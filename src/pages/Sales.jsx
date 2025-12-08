import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, User, Filter, Search, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import UserTooltip from '../components/UserTooltip';
import { getAllSales, getUserDocument } from '../services/db';
import './Pages.css';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [hoveredUser, setHoveredUser] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [tooltipUser, setTooltipUser] = useState(null);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const fetchedSales = await getAllSales();
            setSales(fetchedSales);
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.userUsername?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || sale.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleUserHover = async (userId, event) => {
        if (!userId) return;

        try {
            const user = await getUserDocument(userId);
            setTooltipUser(user);
            setHoveredUser(userId);

            const rect = event.currentTarget.getBoundingClientRect();

            setTooltipPosition({
                x: rect.left - 10,
                y: rect.bottom + 5
            });
        } catch (error) {
            console.error('Error loading user for tooltip:', error);
        }
    };

    const handleUserLeave = () => {
        setHoveredUser(null);
        setTooltipUser(null);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalSales = () => {
        return filteredSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    };

    const getTotalCredits = () => {
        return filteredSales
            .filter(sale => sale.type === 'credits')
            .reduce((sum, sale) => sum + (sale.creditsAdded || 0), 0);
    };

    if (loading) {
        return (
            <DashboardLayout currentPage="sales">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando ventas...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="sales">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1>Ventas</h1>
                    <p>Historial de transacciones y ventas realizadas</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <motion.div
                        className="stat-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="stat-icon gradient-primary">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{filteredSales.length}</h3>
                            <p className="stat-label">Total Transacciones</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="stat-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="stat-icon gradient-accent">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{getTotalCredits().toLocaleString()}</h3>
                            <p className="stat-label">Créditos Vendidos</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="stat-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="stat-icon gradient-warm">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">
                                {filteredSales.filter(s => s.type === 'plan').length}
                            </h3>
                            <p className="stat-label">Planes Vendidos</p>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="users-filters glass">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por usuario o admin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="role-filter">
                        <Filter size={20} />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="all">Todos los Tipos</option>
                            <option value="credits">Créditos</option>
                            <option value="plan">Planes</option>
                        </select>
                    </div>
                </div>

                {/* Sales Table */}
                {filteredSales.length === 0 ? (
                    <div className="empty-state glass">
                        <p>No se encontraron ventas</p>
                    </div>
                ) : (
                    <motion.div
                        className="sales-table glass"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="table-header">
                            <div className="table-cell">Admin</div>
                            <div className="table-cell">Usuario</div>
                            <div className="table-cell">Tipo</div>
                            <div className="table-cell">Detalles</div>
                            <div className="table-cell">Saldo Anterior</div>
                            <div className="table-cell">Saldo Nuevo</div>
                            <div className="table-cell">Fecha</div>
                        </div>

                        <div className="table-body">
                            {filteredSales.map((sale) => (
                                <motion.div
                                    key={sale.id}
                                    className="table-row"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                                >
                                    <div className="table-cell">
                                        <div className="user-cell">
                                            <User size={16} />
                                            <span>{sale.adminName}</span>
                                        </div>
                                    </div>
                                    <div className="table-cell">
                                        <span
                                            className="username-hover"
                                            onMouseEnter={(e) => handleUserHover(sale.userId, e)}
                                            onMouseLeave={handleUserLeave}
                                        >
                                            @{sale.userUsername || sale.userName}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        <span className={`type-badge ${sale.type}`}>
                                            {sale.type === 'credits' ? (
                                                <>
                                                    <DollarSign size={14} />
                                                    Créditos
                                                </>
                                            ) : (
                                                <>
                                                    <Calendar size={14} />
                                                    Plan
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        {sale.type === 'credits' ? (
                                            <span className="detail-value">
                                                +{sale.creditsAdded?.toLocaleString()} créditos
                                            </span>
                                        ) : (
                                            <span className="detail-value">
                                                {sale.planAdded} ({sale.planDuration} días)
                                            </span>
                                        )}
                                    </div>
                                    <div className="table-cell">
                                        <span className="balance-value">
                                            {sale.previousBalance?.toLocaleString() || '0'}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        <span className="balance-value new">
                                            {sale.newBalance?.toLocaleString() || '0'}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        <div className="date-cell">
                                            <Calendar size={16} />
                                            {formatDate(sale.timestamp)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* User Tooltip */}
                <UserTooltip
                    user={tooltipUser}
                    isVisible={hoveredUser !== null}
                    position={tooltipPosition}
                />
            </motion.div>
        </DashboardLayout>
    );
};

export default Sales;
