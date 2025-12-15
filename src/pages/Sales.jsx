import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, User, Filter, Search, TrendingUp, Award, BarChart3 } from 'lucide-react';
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
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        averageSale: 0,
        topSeller: null
    });

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const fetchedSales = await getAllSales();
            setSales(fetchedSales);
            
            // Calculate statistics
            const totalRevenue = fetchedSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
            const totalSales = fetchedSales.length;
            const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
            
            // Find top seller (admin with most sales)
            const salesByAdmin = {};
            fetchedSales.forEach(sale => {
                const adminName = sale.adminName || 'Unknown';
                if (!salesByAdmin[adminName]) {
                    salesByAdmin[adminName] = { count: 0, name: adminName, photo: sale.adminPhoto };
                }
                salesByAdmin[adminName].count++;
            });
            
            const topSeller = Object.values(salesByAdmin).sort((a, b) => b.count - a.count)[0] || null;
            
            setStats({ totalRevenue, totalSales, averageSale, topSeller });
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
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    {/* Total Revenue */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <DollarSign size={18} style={{ color: '#10b981' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue Total</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
                            ${stats.totalRevenue.toFixed(2)}
                        </p>
                    </div>

                    {/* Total Sales */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <TrendingUp size={18} style={{ color: '#3b82f6' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Ventas</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>
                            {stats.totalSales}
                        </p>
                    </div>

                    {/* Average Sale */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <BarChart3 size={18} style={{ color: '#f59e0b' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Promedio</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>
                            ${stats.averageSale.toFixed(2)}
                        </p>
                    </div>

                    {/* Top Seller */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Award size={18} style={{ color: '#8b5cf6' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Top Seller</h3>
                        </div>
                        {stats.topSeller ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: stats.topSeller.photo ? `url(${stats.topSeller.photo})` : '#8b5cf6',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    {!stats.topSeller.photo && (stats.topSeller.name?.charAt(0) || 'T')}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {stats.topSeller.name}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {stats.topSeller.count} ventas
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sin datos</p>
                        )}
                    </div>
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
