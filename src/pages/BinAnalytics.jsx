import { useState, useEffect } from 'react';
import { Search, CreditCard, Globe, Building2, TrendingUp, Lock, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { saveBinSearch, getUserBinSearches, getBinStats } from '../services/db';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
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
        topCountries: [],
        topBrands: [],
        cardTypes: [],
        cardLevels: []
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'charts', or 'gates' - Default: stats

    // Gate Search States
    const [searchBin, setSearchBin] = useState('');
    const [gateSearchLoading, setGateSearchLoading] = useState(false);
    const [gateResults, setGateResults] = useState(null);

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
            // 1. Primero buscar en el caché de Firestore
            const cacheRef = doc(db, 'bin_cache', bin);
            const cacheDoc = await getDoc(cacheRef);

            let binInfo;

            if (cacheDoc.exists()) {
                //console.log(`✅ BIN ${bin} encontrado en caché`);
                const cachedData = cacheDoc.data();
                binInfo = {
                    bin: bin,
                    bank: cachedData.bank,
                    country: cachedData.country,
                    countryCode: cachedData.countryCode || '',
                    type: cachedData.type,
                    brand: cachedData.brand,
                    level: cachedData.level,
                    prepaid: cachedData.prepaid
                };
            } else {
                // 2. Si no está en caché, consultar la API
                console.log(`🌐 BIN ${bin} no está en caché, consultando API...`);
                const response = await fetch(`https://bin-ip-checker.p.rapidapi.com/?bin=${bin}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json, text/plain, */*',
                        'X-RapidAPI-Key': 'f4f24adea3mshaa035122af7c477p173fcbjsnad38016e6ced',
                        'X-RapidAPI-Host': 'bin-ip-checker.p.rapidapi.com',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    body: new URLSearchParams({
                        'bin': bin
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al consultar el BIN. Verifica que el BIN sea válido.');
                }

                const data = await response.json();

                //console.log('Respuesta de la API:', data);

                if (!data.success || data.BIN?.valid === false) {
                    throw new Error('BIN inválido. Por favor verifica el número.');
                }

                const binData = data.BIN;

                binInfo = {
                    bin: bin,
                    bank: binData.issuer?.name || 'Desconocido',
                    country: binData.country?.name || 'Desconocido',
                    countryCode: binData.country?.alpha2 || binData.country?.numeric || '',
                    type: binData.type || 'Desconocido',
                    brand: binData.brand || binData.scheme || 'Desconocido',
                    level: binData.level || 'Standard',
                    prepaid: binData.is_prepaid === 'true' || binData.is_prepaid === true
                };

                // 3. Guardar en caché para futuras consultas
                await setDoc(cacheRef, {
                    ...binInfo,
                    cachedAt: serverTimestamp(),
                    lastUpdated: new Date().toISOString()
                });

                //console.log(`💾 BIN ${bin} guardado en caché`);
            }

            //console.log('BIN Info mapeado:', binInfo);

            setResult(binInfo);
            await saveBinSearch(user.id, binInfo);
            loadHistory();
            loadStats();

        } catch (err) {
            console.error('Error fetching BIN:', err);
            setError(err.message || 'Error al consultar el BIN. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const searchGatesByBin = async (searchBinValue) => {
        try {
            setGateSearchLoading(true);
            console.log('🔍 Buscando gates para BIN:', searchBinValue);

            // Consultar TODOS los lives
            const livesRef = collection(db, 'lives');
            const querySnapshot = await getDocs(livesRef);

            console.log('📊 Total de lives en Firestore:', querySnapshot.size);

            const lives = [];
            let sampleCount = 0;
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Mostrar los primeros 3 como ejemplo
                if (sampleCount < 3) {
                    console.log(`📝 Ejemplo ${sampleCount + 1}:`, {
                        card: data.card,
                        gateName: data.gateName
                    });
                    sampleCount++;
                }

                // El campo 'card' tiene formato: "4268070401234|04|2029|123"
                // Extraer solo el número de tarjeta (antes del primer |)
                if (data.card) {
                    const cardNumber = data.card.split('|')[0];
                    const bin = cardNumber.substring(0, 6);

                    if (bin === searchBinValue) {
                        lives.push(data);
                    }
                }
            });

            console.log(`🎯 Lives encontrados con BIN ${searchBinValue}:`, lives.length);

            if (lives.length === 0) {
                setGateResults({
                    totalLives: 0,
                    topGates: [],
                    gateTypes: [],
                    topGateways: [],
                    topStatus: []
                });
                return;
            }

            // Analizar estadísticas de gates
            const gateCount = {};
            const gateTypeCount = {};
            const gatewayCount = {};
            const statusCount = {};

            lives.forEach(live => {
                // Contar gates
                if (live.gateName) {
                    gateCount[live.gateName] = (gateCount[live.gateName] || 0) + 1;

                    // Extraer tipo de gateway del gateName (ej: "Braintree Gate 1" -> "Braintree")
                    const gatewayName = live.gateName.split(' ')[0];
                    gatewayCount[gatewayName] = (gatewayCount[gatewayName] || 0) + 1;
                }

                // Contar tipos (CHARGE vs AUTH) - basado en el status
                const gateType = live.status?.includes('Approved') || live.status?.includes('CVV') ? 'CHARGE' : 'AUTH';
                gateTypeCount[gateType] = (gateTypeCount[gateType] || 0) + 1;

                // Contar status (CCN vs CVV)
                if (live.status) {
                    const statusType = live.status.includes('CVV') ? 'CVV' : 'CCN';
                    statusCount[statusType] = (statusCount[statusType] || 0) + 1;
                }
            });

            // Convertir a arrays y ordenar
            const topGates = Object.entries(gateCount)
                .map(([gate, count]) => ({ gate, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 7);

            const gateTypes = Object.entries(gateTypeCount)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);

            const topGateways = Object.entries(gatewayCount)
                .map(([gateway, count]) => ({ gateway, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 7);

            const topStatus = Object.entries(statusCount)
                .map(([status, count]) => ({ status, count }))
                .sort((a, b) => b.count - a.count);

            setGateResults({
                totalLives: lives.length,
                topGates,
                gateTypes,
                topGateways,
                topStatus
            });

        } catch (error) {
            console.error('Error searching gates:', error);
            setError('Error al buscar gates. Intenta nuevamente.');
        } finally {
            setGateSearchLoading(false);
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
                            onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Ingresa cualquier BIN (6 dígitos, ej: 426807)"
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            maxLength={6}
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

                {/* Sistema de Pestañas */}
                {!statsLoading && (stats.topBanks.length > 0 || stats.topCountries.length > 0) && (
                    <div style={{ marginBottom: '2rem' }}>
                        {/* Botones de Pestañas */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginBottom: '2rem',
                            borderBottom: '2px solid var(--border-color)',
                            paddingBottom: '0.5rem'
                        }}>
                            <button
                                onClick={() => setActiveTab('stats')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: activeTab === 'stats' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                    color: activeTab === 'stats' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    transition: 'all 0.3s ease',
                                    boxShadow: activeTab === 'stats' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'stats') {
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'stats') {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                📊 Estadísticas
                            </button>

                            <button
                                onClick={() => setActiveTab('charts')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: activeTab === 'charts' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                    color: activeTab === 'charts' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    transition: 'all 0.3s ease',
                                    boxShadow: activeTab === 'charts' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'charts') {
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'charts') {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                📊 Gráficos
                            </button>

                            <button
                                onClick={() => setActiveTab('gates')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: activeTab === 'gates' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                                    color: activeTab === 'gates' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    transition: 'all 0.3s ease',
                                    boxShadow: activeTab === 'gates' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'gates') {
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'gates') {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                🔍 Buscar Gate
                            </button>
                        </div>

                        {/* Sección de Gráficos Visuales */}
                        {activeTab === 'charts' && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingUp size={28} />
                                    📊 Estadísticas Visuales
                                </h2>

                                {/* Grid de Gráficos */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                                    {/* Top Bancos - Bar Chart */}
                                    {stats.topBanks.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building2 size={20} />
                                                Top Bancos
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.topBanks.map(item => ({ name: item.bank.substring(0, 20), value: item.count }))}>
                                                    <defs>
                                                        <linearGradient id="colorBanks" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '0.75rem', fill: 'var(--text-secondary)' }} />
                                                    <YAxis style={{ fontSize: '0.85rem', fill: 'var(--text-secondary)' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'rgba(30, 30, 46, 0.95)',
                                                            border: '2px solid rgba(59, 130, 246, 0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px 16px',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                                            backdropFilter: 'blur(10px)'
                                                        }}
                                                        labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '6px', fontSize: '0.95rem' }}
                                                        itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                                                        cursor={{ fill: 'rgba(59, 130, 246, 0.15)' }}
                                                    />
                                                    <Bar dataKey="value" fill="url(#colorBanks)" radius={[8, 8, 0, 0]} animationDuration={1200} animationBegin={0} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Tipos de Tarjeta - Donut Chart */}
                                    {stats.cardTypes.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CreditCard size={20} />
                                                Tipos de Tarjeta
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={stats.cardTypes.map(item => ({ name: item.type, value: item.count }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                                    >
                                                        {stats.cardTypes.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#6b7280'} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Top Países - Bar Chart */}
                                    {stats.topCountries.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Globe size={20} />
                                                Top Países
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.topCountries.map(item => ({ name: item.country, value: item.count }))}>
                                                    <XAxis dataKey="name" style={{ fontSize: '0.85rem' }} />
                                                    <YAxis />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                        labelStyle={{ color: 'var(--text-primary)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Niveles de Tarjeta - Donut Chart */}
                                    {stats.cardLevels.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <TrendingUp size={20} />
                                                Niveles de Tarjeta
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={stats.cardLevels.map(item => ({ name: item.level, value: item.count }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                                    >
                                                        {stats.cardLevels.map((entry, index) => {
                                                            const colors = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#06b6d4', '#ec4899'];
                                                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                                        })}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Top Marcas - Bar Chart */}
                                    {stats.topBrands.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', gridColumn: stats.topBrands.length > 3 ? '1 / -1' : 'auto' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={20} />
                                                Top Marcas
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.topBrands.map(item => ({ name: item.brand, value: item.count }))} layout="horizontal">
                                                    <XAxis type="number" style={{ fontSize: '0.85rem', fill: 'var(--text-secondary)' }} />
                                                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '0.85rem', fill: 'var(--text-primary)' }} />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                        labelStyle={{ color: 'var(--text-primary)' }}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                                        {stats.topBrands.map((entry, index) => {
                                                            const brandColors = {
                                                                'VISA': '#1a1f71',
                                                                'MASTERCARD': '#eb001b',
                                                                'AMEX': '#006fcf',
                                                                'DISCOVER': '#ff6000'
                                                            };
                                                            return <Cell key={`cell-${index}`} fill={brandColors[entry.brand.toUpperCase()] || '#8b5cf6'} />;
                                                        })}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sección de Estadísticas (Cards) */}
                {activeTab === 'stats' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={28} />
                            📈 Estadísticas Detalladas
                        </h2>

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
                )}

                {/* Sección de Buscar Gate */}
                {activeTab === 'gates' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Search size={28} />
                            🔍 Buscar Gate por BIN
                        </h2>

                        {/* Buscador de BIN */}
                        <div className="glass" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        Ingresa el BIN (6 dígitos)
                                    </label>
                                    <input
                                        type="text"
                                        value={searchBin}
                                        onChange={(e) => setSearchBin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Ej: 421316"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-secondary)',
                                            border: '2px solid var(--border-color)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (searchBin.length === 6) {
                                            searchGatesByBin(searchBin);
                                        }
                                    }}
                                    disabled={searchBin.length !== 6 || gateSearchLoading}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        background: searchBin.length === 6 && !gateSearchLoading ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--bg-secondary)',
                                        color: searchBin.length === 6 && !gateSearchLoading ? '#fff' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: searchBin.length === 6 && !gateSearchLoading ? 'pointer' : 'not-allowed',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        transition: 'all 0.3s ease',
                                        boxShadow: searchBin.length === 6 && !gateSearchLoading ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                                        opacity: searchBin.length === 6 && !gateSearchLoading ? 1 : 0.5
                                    }}
                                >
                                    {gateSearchLoading ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                        </div>

                        {/* Resultados de búsqueda */}
                        {gateResults && (
                            <div>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                                    Resultados para BIN: {searchBin}
                                </h3>

                                {/* Grid de Gráficos de Gates */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                                    {/* Top Gates - Bar Chart */}
                                    {gateResults.topGates.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <TrendingUp size={20} />
                                                Top Gates ({gateResults.totalLives} lives)
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={gateResults.topGates.map(item => ({ name: item.gate, value: item.count }))}>
                                                    <defs>
                                                        <linearGradient id="colorTopGates" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '0.75rem', fill: 'var(--text-secondary)' }} />
                                                    <YAxis style={{ fontSize: '0.85rem', fill: 'var(--text-secondary)' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'rgba(30, 30, 46, 0.95)',
                                                            border: '2px solid rgba(139, 92, 246, 0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px 16px',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                                                        }}
                                                        labelStyle={{ color: '#fff', fontWeight: 700 }}
                                                        itemStyle={{ color: '#8b5cf6', fontWeight: 600 }}
                                                        cursor={{ fill: 'rgba(139, 92, 246, 0.15)' }}
                                                    />
                                                    <Bar dataKey="value" fill="url(#colorTopGates)" radius={[8, 8, 0, 0]} animationDuration={1200} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Top Gate Types - Donut Chart */}
                                    {gateResults.gateTypes.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CreditCard size={20} />
                                                Tipos de Gate
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <defs>
                                                        <linearGradient id="colorCharge" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#1e40af" stopOpacity={0.7} />
                                                        </linearGradient>
                                                        <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#374151" stopOpacity={0.7} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={gateResults.gateTypes.map(item => ({ name: item.type, value: item.count }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                                        labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
                                                        animationDuration={800}
                                                    >
                                                        {gateResults.gateTypes.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.type === 'CHARGE' ? 'url(#colorCharge)' : 'url(#colorAuth)'} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'rgba(30, 30, 46, 0.95)',
                                                            border: '2px solid rgba(59, 130, 246, 0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Top Gateways - Bar Chart */}
                                    {gateResults.topGateways.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building2 size={20} />
                                                Top Gateways
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={gateResults.topGateways.map(item => ({ name: item.gateway, value: item.count }))} layout="horizontal">
                                                    <defs>
                                                        <linearGradient id="colorGateways" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis type="number" style={{ fontSize: '0.85rem', fill: 'var(--text-secondary)' }} />
                                                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '0.85rem', fill: 'var(--text-primary)' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'rgba(30, 30, 46, 0.95)',
                                                            border: '2px solid rgba(16, 185, 129, 0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px'
                                                        }}
                                                        labelStyle={{ color: '#fff', fontWeight: 700 }}
                                                        cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" fill="url(#colorGateways)" radius={[0, 8, 8, 0]} animationDuration={1000} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Top Status - Donut Chart */}
                                    {gateResults.topStatus.length > 0 && (
                                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={20} />
                                                Top Status
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <defs>
                                                        <linearGradient id="colorCVV" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#059669" stopOpacity={0.7} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCCN" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0.7} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={gateResults.topStatus.map(item => ({ name: item.status, value: item.count }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                                        labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
                                                        animationDuration={800}
                                                    >
                                                        {gateResults.topStatus.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.status === 'CVV' ? 'url(#colorCVV)' : 'url(#colorCCN)'} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'rgba(30, 30, 46, 0.95)',
                                                            border: '2px solid rgba(16, 185, 129, 0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mensaje cuando no hay resultados */}
                        {!gateResults && !gateSearchLoading && (
                            <div className="glass" style={{ padding: '3rem', borderRadius: '12px', textAlign: 'center' }}>
                                <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                                    Ingresa un BIN de 6 dígitos para buscar los gates utilizados
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </DashboardLayout>
    );
};

export default BinAnalytics;
