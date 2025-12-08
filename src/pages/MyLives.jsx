import { useState, useEffect } from 'react';
import { Heart, Filter, Search, Download, Copy, Calendar, Shield, CreditCard, Wallet, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getUserLives } from '../services/db';
import './Pages.css';

const MyLives = () => {
    const [lives, setLives] = useState([]);
    const [filteredLives, setFilteredLives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGate, setFilterGate] = useState('all');
    const [filterDate, setFilterDate] = useState('all');

    const { user } = useAuth();

    useEffect(() => {
        loadLives();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [lives, searchTerm, filterGate, filterDate]);

    const loadLives = async () => {
        if (!user || !user.id) return;

        try {
            setLoading(true);
            const userLives = await getUserLives(user.id);
            setLives(userLives);
        } catch (error) {
            console.error('Error loading lives:', error);
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
        alert('Tarjeta copiada al portapapeles!');
    };

    const exportToCSV = () => {
        const csv = 'Tarjeta,Gate,Tipo,Fecha,Hora,Tiempo,Status,Resultado\n' +
            filteredLives.map(live =>
                `${live.card},${live.gateName},${live.gateType},${live.date},${live.hour},${live.responseTime}s,${live.status},${live.result}`
            ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis_lives_${Date.now()}.csv`;
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

    // Stats
    const totalLives = lives.length;
    const livesToday = lives.filter(l => l.date === new Date().toISOString().split('T')[0]).length;
    const gateUsage = lives.reduce((acc, live) => {
        acc[live.gateType] = (acc[live.gateType] || 0) + 1;
        return acc;
    }, {});
    const mostUsedGate = Object.keys(gateUsage).reduce((a, b) =>
        gateUsage[a] > gateUsage[b] ? a : b, 'stripe'
    );

    return (
        <DashboardLayout currentPage="my-lives">
            <div>
                <div className="page-header">
                    <h1><Heart size={32} style={{ display: 'inline', marginRight: '10px' }} />Mis Lives</h1>
                    <p>Todas tus tarjetas validadas exitosamente</p>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card glass">
                        <div className="stat-icon gradient-accent">
                            <Heart size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{totalLives}</h3>
                            <p className="stat-label">Total Lives</p>
                        </div>
                    </div>

                    <div className="stat-card glass">
                        <div className="stat-icon gradient-primary">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{livesToday}</h3>
                            <p className="stat-label">Hoy</p>
                        </div>
                    </div>

                    <div className="stat-card glass">
                        <div className="stat-icon gradient-secondary" style={{ background: getGateColor(mostUsedGate) }}>
                            {getGateIcon(mostUsedGate)}
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value" style={{ textTransform: 'capitalize' }}>{mostUsedGate}</h3>
                            <p className="stat-label">Más Usado</p>
                        </div>
                    </div>
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
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>Cargando lives...</p>
                        </div>
                    ) : filteredLives.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Heart size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {lives.length === 0 ? 'Aún no tienes lives. ¡Empieza a validar tarjetas!' : 'No se encontraron lives con los filtros aplicados.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tarjeta</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Gate</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tiempo</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLives.map((live) => (
                                        <tr
                                            key={live.id}
                                            style={{ borderBottom: '1px solid var(--glass-border)' }}
                                        >
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyLives;
