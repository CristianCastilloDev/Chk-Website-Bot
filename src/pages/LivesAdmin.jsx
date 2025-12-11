import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, Search, Download, Copy, Calendar, Shield, CreditCard, Wallet, Clock, User } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import { usePermissions } from '../hooks/usePermissions';
import { getAllLives, getGlobalStats } from '../services/db';
import './Pages.css';

const LivesAdmin = () => {
    const [lives, setLives] = useState([]);
    const [filteredLives, setFilteredLives] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGate, setFilterGate] = useState('all');
    const [filterDate, setFilterDate] = useState('all');
    const [filterUser, setFilterUser] = useState('');

    const { isDev } = usePermissions();
    const { showSuccess } = useToast();

    useEffect(() => {
        if (isDev()) {
            loadData();
        }
    }, []);

    useEffect(() => {
        applyFilters();
    }, [lives, searchTerm, filterGate, filterDate, filterUser]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const [allLives, globalStats] = await Promise.all([
                getAllLives(),
                getGlobalStats()
            ]);
            setLives(allLives);
            setStats(globalStats);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...lives];

        // Filtro de búsqueda (BIN o últimos 4)
        if (searchTerm) {
            filtered = filtered.filter(live =>
                live.bin?.includes(searchTerm) ||
                live.last4?.includes(searchTerm) ||
                live.cardMasked?.includes(searchTerm)
            );
        }

        // Filtro por gate
        if (filterGate !== 'all') {
            filtered = filtered.filter(live => live.gateType === filterGate);
        }

        // Filtro por usuario
        if (filterUser) {
            filtered = filtered.filter(live =>
                live.userName?.toLowerCase().includes(filterUser.toLowerCase()) ||
                live.userEmail?.toLowerCase().includes(filterUser.toLowerCase())
            );
        }

        // Filtro por fecha
        if (filterDate !== 'all') {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            if (filterDate === 'today') {
                filtered = filtered.filter(live => live.date === today);
            } else if (filterDate === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(live => {
                    const liveDate = new Date(live.date);
                    return liveDate >= weekAgo;
                });
            } else if (filterDate === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(live => {
                    const liveDate = new Date(live.date);
                    return liveDate >= monthAgo;
                });
            }
        }

        setFilteredLives(filtered);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showSuccess('Tarjeta copiada al portapapeles');
    };

    const exportToCSV = () => {
        const csv = 'Usuario,Email,Tarjeta,Gate,Tipo,Fecha,Hora,Tiempo,Status,Resultado\n' +
            filteredLives.map(live =>
                `${live.userName},${live.userEmail},${live.card},${live.gateName},${live.gateType},${live.date},${live.hour},${live.responseTime}s,${live.status},${live.result}`
            ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lives_global_${Date.now()}.csv`;
        a.click();
    };

    const getGateIcon = (type) => {
        switch (type) {
            case 'stripe':
                return <CreditCard size={16} />;
            case 'paypal':
                return <Wallet size={16} />;
            case 'braintree':
                return <Shield size={16} />;
            default:
                return <CreditCard size={16} />;
        }
    };

    const getGateColor = (type) => {
        switch (type) {
            case 'stripe':
                return '#6366f1';
            case 'paypal':
                return '#0070ba';
            case 'braintree':
                return '#00c853';
            default:
                return '#6366f1';
        }
    };

    if (!isDev()) {
        return (
            <DashboardLayout currentPage="lives-admin">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Database size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                    <h2>Acceso Denegado</h2>
                    <p>Solo los desarrolladores pueden acceder a esta página.</p>
                </div>
            </DashboardLayout>
        );
    }

    // Stats
    const totalLives = lives.length;
    const livesToday = lives.filter(l => l.date === new Date().toISOString().split('T')[0]).length;
    const uniqueUsers = new Set(lives.map(l => l.userId)).size;

    return (
        <DashboardLayout currentPage="lives-admin">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1><Database size={32} style={{ display: 'inline', marginRight: '10px' }} />Lives Global</h1>
                    <p>Dashboard completo de todas las lives del sistema</p>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <motion.div className="stat-card glass">
                        <div className="stat-icon gradient-accent">
                            <Database size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{totalLives}</h3>
                            <p className="stat-label">Total Lives</p>
                        </div>
                    </motion.div>

                    <motion.div className="stat-card glass">
                        <div className="stat-icon gradient-primary">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{livesToday}</h3>
                            <p className="stat-label">Hoy</p>
                        </div>
                    </motion.div>

                    <motion.div className="stat-card glass">
                        <div className="stat-icon gradient-secondary">
                            <User size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{uniqueUsers}</h3>
                            <p className="stat-label">Usuarios Activos</p>
                        </div>
                    </motion.div>

                    {stats && (
                        <>
                            <motion.div className="stat-card glass">
                                <div className="stat-icon" style={{ background: '#6366f1' }}>
                                    <img src="https://cdn.simpleicons.org/stripe/white" alt="Stripe" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{stats.livesByType?.stripe || 0}</h3>
                                    <p className="stat-label">Stripe</p>
                                </div>
                            </motion.div>

                            <motion.div className="stat-card glass">
                                <div className="stat-icon" style={{ background: '#0070ba' }}>
                                    <img src="https://cdn.simpleicons.org/paypal/white" alt="PayPal" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{stats.livesByType?.paypal || 0}</h3>
                                    <p className="stat-label">PayPal</p>
                                </div>
                            </motion.div>

                            <motion.div className="stat-card glass">
                                <div className="stat-icon" style={{ background: '#00c853' }}>
                                    <img src="https://cdn.simpleicons.org/braintree/white" alt="Braintree" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{stats.livesByType?.braintree || 0}</h3>
                                    <p className="stat-label">Braintree</p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Filters */}
                <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por BIN o últimos 4 dígitos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por usuario o email..."
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        <select
                            value={filterGate}
                            onChange={(e) => setFilterGate(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Todos los Gates</option>
                            <option value="stripe">Stripe</option>
                            <option value="paypal">PayPal</option>
                            <option value="braintree">Braintree</option>
                        </select>

                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Todas las fechas</option>
                            <option value="today">Hoy</option>
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                        </select>

                        {filteredLives.length > 0 && (
                            <button
                                className="btn-secondary"
                                onClick={exportToCSV}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Download size={18} />
                                Exportar
                            </button>
                        )}
                    </div>
                </div>

                {/* Lives Table */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>
                        Lives ({filteredLives.length}{filteredLives.length !== totalLives && ` de ${totalLives}`})
                    </h3>

                    {loading ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Usuario</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tarjeta</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Gate</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tiempo</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan="6" style={{ padding: 0 }}>
                                            <SkeletonLoader type="table-rows" columns={6} rows={5} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : filteredLives.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Database size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {lives.length === 0 ? 'Aún no hay lives en el sistema.' : 'No se encontraron lives con los filtros aplicados.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Usuario</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tarjeta</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Gate</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tiempo</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLives.map((live, index) => (
                                        <motion.tr
                                            key={live.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            style={{ borderBottom: '1px solid var(--glass-border)' }}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{live.userName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{live.userEmail}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                {live.cardMasked}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px',
                                                        background: getGateColor(live.gateType),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white'
                                                    }}>
                                                        {getGateIcon(live.gateType)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{live.gateName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                                                            {live.gateType}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem' }}>{live.date}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{live.hour}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={14} />
                                                    {live.responseTime}s
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => copyToClipboard(live.card)}
                                                    className="btn-secondary"
                                                    style={{
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <Copy size={14} />
                                                    Copiar
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default LivesAdmin;
