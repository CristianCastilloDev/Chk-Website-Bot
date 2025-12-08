import { useState, useEffect } from 'react';
import { Search, CreditCard, Globe, Building2, TrendingUp, Lock, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { saveBinSearch, getUserBinSearches, getBinStats } from '../services/db';
import { searchBin, getAllBins } from '../data/binDatabase';
import './Pages.css';

const BinAnalytics = () => {
    const [bin, setBin] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        topBinsWithLives: [],
        mostCheckedBins: [],
        topBanks: [],
        topCountries: []
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const [visibleBins, setVisibleBins] = useState(3);
    const [visibleChecked, setVisibleChecked] = useState(3);
    const [visibleBanks, setVisibleBanks] = useState(3);
    const [visibleCountries, setVisibleCountries] = useState(3);

    const { hasActiveSubscription, isAdmin, isDev } = usePermissions();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.id && (hasActiveSubscription() || isAdmin() || isDev())) {
            loadHistory();
            loadStats();
        }
    }, [user]);

    const loadHistory = async () => {
        try {
            const searches = await getUserBinSearches(user.id);
            setHistory(searches);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const binStats = await getBinStats();
            setStats(binStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const analyzeBin = async () => {
        if (bin.length < 6) {
            setError('El BIN debe tener al menos 6 dígitos');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Buscar en la base de datos local
            const binData = searchBin(bin);

            if (!binData) {
                const availableBins = getAllBins();
                throw new Error(`BIN no encontrado en nuestra base de datos. Tenemos ${availableBins.length} BINs disponibles. Agrega más BINs en /dev/manage-bins`);
            }

            const binInfo = {
                bin: bin,
                bank: binData.bank,
                country: binData.country,
                countryCode: binData.countryCode,
                type: binData.type,
                brand: binData.brand,
                level: binData.level,
                prepaid: binData.prepaid || false
            };

            setResult(binInfo);
            await saveBinSearch(user.id, binInfo);
            loadHistory();
            loadStats();

        } catch (err) {
            console.error('Error fetching BIN:', err);
            setError(err.message || 'Error al consultar el BIN');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    if (!hasActiveSubscription() && !isAdmin() && !isDev()) {
        return (
            <DashboardLayout currentPage="bin-analytics">
                <div className="permission-warning" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Lock size={64} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
                    <h2>Plan Requerido</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                        BIN Analytics está disponible solo para usuarios con plan activo.
                    </p>
                    <a href="/pricing" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                        Ver Planes
                    </a>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="bin-analytics">
            <div>
                <div className="page-header">
                    <h1><Search size={32} style={{ display: 'inline', marginRight: '10px' }} />BIN Analytics</h1>
                    <p>Analiza información de tarjetas y estadísticas</p>
                </div>

                <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={24} />
                        Consultar BIN
                    </h3>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={bin}
                            onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="Ingresa 6-8 dígitos del BIN (ej: 426807)"
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            maxLength={8}
                        />
                        <button
                            onClick={analyzeBin}
                            disabled={loading || bin.length < 6}
                            className="btn-primary"
                            style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Search size={20} />
                            {loading ? 'Analizando...' : 'Analizar'}
                        </button>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {result && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <Building2 size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>Banco</span>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.bank}</p>
                                </div>

                                <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <Globe size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>País</span>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.country} ({result.countryCode})</p>
                                </div>

                                <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <CreditCard size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>Tipo</span>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase' }}>{result.type}</p>
                                </div>

                                <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <CheckCircle size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>Marca</span>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase' }}>{result.brand}</p>
                                </div>

                                <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <CreditCard size={18} />
                                        <span style={{ fontSize: '0.85rem' }}>Nivel</span>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase' }}>{result.level}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {statsLoading ? (
                    <SkeletonLoader type="card" count={4} height="200px" />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* BINs con más Lives */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <TrendingUp size={20} />
                                BINs con más Lives
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.topBinsWithLives.length > 0 ? (
                                    <>
                                        {stats.topBinsWithLives.slice(0, visibleBins).map((item, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: 600 }}>{item.bin}</span>
                                                <span style={{ color: '#10b981', fontWeight: 600 }}>{item.lives} Lives</span>
                                            </div>
                                        ))}
                                        {visibleBins < stats.topBinsWithLives.length && (
                                            <button onClick={() => setVisibleBins(prev => prev + 3)} style={{ padding: '0.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                Ver más
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay datos aún</p>
                                )}
                            </div>
                        </div>

                        {/* BINs más Consultados */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <Search size={20} />
                                BINs más Consultados
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.mostCheckedBins.length > 0 ? (
                                    <>
                                        {stats.mostCheckedBins.slice(0, visibleChecked).map((item, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: 600 }}>{item.bin}</span>
                                                <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{item.count} veces</span>
                                            </div>
                                        ))}
                                        {visibleChecked < stats.mostCheckedBins.length && (
                                            <button onClick={() => setVisibleChecked(prev => prev + 3)} style={{ padding: '0.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                Ver más
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay datos aún</p>
                                )}
                            </div>
                        </div>

                        {/* Top Bancos */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <Building2 size={20} />
                                Top Bancos
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.topBanks.length > 0 ? (
                                    <>
                                        {stats.topBanks.slice(0, visibleBanks).map((item, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.bank}</span>
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.count} Lives</span>
                                            </div>
                                        ))}
                                        {visibleBanks < stats.topBanks.length && (
                                            <button onClick={() => setVisibleBanks(prev => prev + 3)} style={{ padding: '0.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                Ver más
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay datos aún</p>
                                )}
                            </div>
                        </div>

                        {/* Top Países */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <Globe size={20} />
                                Top Países
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.topCountries.length > 0 ? (
                                    <>
                                        {stats.topCountries.slice(0, visibleCountries).map((item, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: 600 }}>{item.country}</span>
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.count} Lives</span>
                                            </div>
                                        ))}
                                        {visibleCountries < stats.topCountries.length && (
                                            <button onClick={() => setVisibleCountries(prev => prev + 3)} style={{ padding: '0.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                Ver más
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay datos aún</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BinAnalytics;
