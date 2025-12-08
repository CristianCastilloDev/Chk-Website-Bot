import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Send, Trash2, Download, AlertCircle, CheckCircle, XCircle, Clock, Zap, Heart, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GateCard from '../components/GateCard';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { updateUserCredits, getAllGates, saveLive } from '../services/db';
import './Pages.css';

const Gates = () => {
    const [cards, setCards] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [gates, setGates] = useState([]);
    const [selectedGate, setSelectedGate] = useState(null);
    const [loadingGates, setLoadingGates] = useState(true);
    const [collapsedSections, setCollapsedSections] = useState({
        stripe: true,
        paypal: true,
        braintree: true
    });

    const { canInteract, hasActiveSubscription, isAdmin, isDev } = usePermissions();
    const { user } = useAuth();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.56.2:8000';

    // Cargar gates desde Firebase
    useEffect(() => {
        const loadGates = async () => {
            try {
                setLoadingGates(true);
                const allGates = await getAllGates();
                setGates(allGates);

                // Seleccionar primer gate activo por defecto
                const firstActive = allGates.find(g => g.status === 'active');
                if (firstActive) {
                    setSelectedGate(firstActive);
                }
            } catch (error) {
                console.error('Error loading gates:', error);
            } finally {
                setLoadingGates(false);
            }
        };

        loadGates();
    }, []);

    const maskCard = (card) => {
        const parts = card.split('|');
        if (parts.length < 1) return card;
        const number = parts[0];
        if (number.length < 8) return card;
        return `${number.substring(0, 4)} **** **** ${number.substring(number.length - 4)}`;
    };

    const handleValidate = async () => {
        if (!selectedGate) {
            alert('Por favor selecciona un gate primero');
            return;
        }

        if (!cards.trim()) {
            alert('Por favor ingresa al menos una tarjeta');
            return;
        }

        const cardList = cards.split('\n').filter(card => card.trim());

        if (!isAdmin() && !isDev()) {
            const creditsNeeded = cardList.length;
            if (!hasActiveSubscription() && user.credits < creditsNeeded) {
                alert(`Necesitas ${creditsNeeded} créditos. Tienes ${user.credits}. Compra más créditos o un plan.`);
                return;
            }
        }

        setLoading(true);
        setProcessing(true);
        const newResults = [];

        for (const card of cardList) {
            try {
                console.log('🔗 API URL:', API_URL);
                console.log('📤 Enviando tarjeta:', card);
                console.log('🎯 Gate:', selectedGate.name);

                const startTime = Date.now();
                const response = await fetch(`${API_URL}/check`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ card: card.trim() })
                });

                console.log('📥 Respuesta:', response.status);

                let data;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                console.log('📦 Data recibida:', data);

                const endTime = Date.now();
                const time = ((endTime - startTime) / 1000).toFixed(2);

                const result = parseResult(data, card, time);
                newResults.push(result);
                setResults(prev => [...prev, result]);

                // Guardar live automáticamente si es Live
                if (result.icon === 'live') {
                    try {
                        const cardParts = card.split('|');
                        const cardNumber = cardParts[0] || '';
                        const bin = cardNumber.substring(0, 6);

                        // Consultar información del BIN
                        let bankInfo = {
                            bank: 'Desconocido',
                            country: 'Desconocido',
                            type: 'Desconocido',
                            brand: 'Desconocido'
                        };

                        try {
                            const binResponse = await fetch(`https://lookup.binlist.net/${bin}`);
                            if (binResponse.ok) {
                                const binData = await binResponse.json();
                                bankInfo = {
                                    bank: binData.bank?.name || 'Desconocido',
                                    country: binData.country?.name || 'Desconocido',
                                    type: binData.type || 'Desconocido',
                                    brand: binData.scheme || 'Desconocido'
                                };
                            }
                        } catch (binError) {
                            console.log('No se pudo obtener info del BIN:', binError);
                        }

                        await saveLive({
                            userId: user.uid,
                            userName: user.name || 'Usuario',
                            userEmail: user.email,
                            gateId: selectedGate.id,
                            gateName: selectedGate.name,
                            gateType: selectedGate.type,
                            card: card,
                            cardMasked: maskCard(card),
                            bin: bin,
                            last4: cardNumber.substring(cardNumber.length - 4),
                            status: result.status,
                            result: result.result,
                            responseTime: parseFloat(time),
                            // Información del BIN
                            bank: bankInfo.bank,
                            country: bankInfo.country,
                            cardType: bankInfo.type,
                            cardBrand: bankInfo.brand
                        });

                        console.log('✅ Live Guardada en Firebase con info de BIN');
                    } catch (error) {
                        console.error('Error guardando live:', error);
                    }
                }

                if (!isAdmin() && !isDev() && !hasActiveSubscription()) {
                    await updateUserCredits(user.uid, user.credits - 1);
                }

            } catch (error) {
                console.error('❌ Error:', error);
                newResults.push({
                    card,
                    status: 'Error',
                    result: 'Error de conexión',
                    time: '0.00',
                    icon: 'error'
                });
            }
        }

        setLoading(false);
        setProcessing(false);

        // Limpiar tarjetas del textarea
        setCards('');

        // Contar lives y deads
        const liveCount = newResults.filter(r => r.icon === 'live' || r.icon === 'warning').length;
        const deadCount = newResults.filter(r => r.icon === 'dead' || r.icon === 'error').length;

        // Notificación de éxito
        alert(`✅ Validación completada: ${liveCount} Lives, ${deadCount} Dead`);
    };

    const parseResult = (data, card, time) => {
        const text = typeof data === 'string' ? data : JSON.stringify(data);

        let status = 'Unknown';
        let result = 'Sin respuesta';
        let icon = 'error';

        if (text.includes('✅') || text.includes('Live') || text.includes('Charged')) {
            status = 'Live';
            result = 'Approved';
            icon = 'live';
        } else if (text.includes('⚠️') || text.includes('CNN') || text.includes('security code')) {
            status = 'Live CNN';
            result = 'CVV Incorrecto';
            icon = 'warning';
        } else if (text.includes('💸') || text.includes('Fondos') || text.includes('insufficient')) {
            status = 'Fondos Insuficientes';
            result = 'Sin fondos';
            icon = 'warning';
        } else if (text.includes('❌') || text.includes('DEAD') || text.includes('3D Secure') || text.includes('incorrect')) {
            status = 'Dead';
            result = text.includes('3D Secure') ? '3D Secure' : 'Rechazada';
            icon = 'dead';
        } else if (text.includes('Invalidas') || text.includes('Fecha')) {
            status = 'Fecha Inválida';
            result = 'Fecha expirada';
            icon = 'error';
        }

        return { card, status, result, time, icon };
    };

    const getStatusIcon = (icon) => {
        switch (icon) {
            case 'live':
                return <CheckCircle size={18} className="status-icon-live" />;
            case 'warning':
                return <AlertCircle size={18} className="status-icon-warning" />;
            case 'dead':
                return <XCircle size={18} className="status-icon-dead" />;
            default:
                return <AlertCircle size={18} className="status-icon-error" />;
        }
    };

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const clearResults = () => {
        setResults([]);
        setCards('');
    };

    const exportResults = () => {
        const csv = 'Card,Status,Result,Time\n' +
            results.map(r => `${r.card},${r.status},${r.result},${r.time}s`).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gates_results_${Date.now()}.csv`;
        a.click();
    };

    const canUseGates = canInteract();

    // Agrupar gates por tipo
    const gatesByType = {
        stripe: gates.filter(g => g.type === 'stripe'),
        paypal: gates.filter(g => g.type === 'paypal'),
        braintree: gates.filter(g => g.type === 'braintree')
    };

    return (
        <DashboardLayout currentPage="gates">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1><Shield size={32} style={{ display: 'inline', marginRight: '10px' }} />Gates - Validador de Tarjetas</h1>
                    <p>Selecciona un gate y valida tarjetas en tiempo real</p>
                </div>

                {!canUseGates && (
                    <div className="permission-warning">
                        <AlertCircle size={24} />
                        <div>
                            <h3>Acceso Restringido</h3>
                            <p>
                                Necesitas un plan activo o créditos para usar Gates.{' '}
                                <a href="/pricing">Ver planes</a>
                            </p>
                        </div>
                    </div>
                )}

                <div className={`gates-content ${!canUseGates ? 'disabled' : ''}`}>
                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                        <motion.div className="stat-card glass">
                            <div className="stat-icon gradient-primary">
                                <Zap size={24} />
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{user?.credits || 0}</h3>
                                <p className="stat-label">Créditos Disponibles</p>
                            </div>
                        </motion.div>

                        <motion.div className="stat-card glass">
                            <div className="stat-icon gradient-accent">
                                <CheckCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{results.filter(r => r.icon === 'live').length}</h3>
                                <p className="stat-label">Live</p>
                            </div>
                        </motion.div>

                        <motion.div className="stat-card glass">
                            <div className="stat-icon gradient-secondary">
                                <XCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{results.filter(r => r.icon === 'dead').length}</h3>
                                <p className="stat-label">Dead</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Gate Selector */}
                    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Seleccionar Gate</h3>
                            {selectedGate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: selectedGate.color, color: 'white', borderRadius: '8px', fontWeight: 600 }}>
                                    <Shield size={18} />
                                    {selectedGate.name}
                                </div>
                            )}
                        </div>

                        {loadingGates ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p>Cargando gates...</p>
                            </div>
                        ) : gates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <AlertCircle size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>No hay gates disponibles. Inicializa los gates primero.</p>
                            </div>
                        ) : (
                            <>
                                {/* Stripe Gates */}
                                {gatesByType.stripe.length > 0 && (
                                    <div className="gate-type-section">
                                        <div
                                            className="gate-type-header"
                                            onClick={() => toggleSection('stripe')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3>Stripe</h3>
                                                <span className="gate-type-count">{gatesByType.stripe.length} gates</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: collapsedSections.stripe ? -90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                        <AnimatePresence>
                                            {!collapsedSections.stripe && (
                                                <motion.div
                                                    className="gates-grid"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {gatesByType.stripe.map(gate => (
                                                        <GateCard
                                                            key={gate.id}
                                                            gate={gate}
                                                            selected={selectedGate?.id === gate.id}
                                                            onSelect={() => setSelectedGate(gate)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* PayPal Gates */}
                                {gatesByType.paypal.length > 0 && (
                                    <div className="gate-type-section">
                                        <div
                                            className="gate-type-header"
                                            onClick={() => toggleSection('paypal')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3>PayPal</h3>
                                                <span className="gate-type-count">{gatesByType.paypal.length} gates</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: collapsedSections.paypal ? -90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                        <AnimatePresence>
                                            {!collapsedSections.paypal && (
                                                <motion.div
                                                    className="gates-grid"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {gatesByType.paypal.map(gate => (
                                                        <GateCard
                                                            key={gate.id}
                                                            gate={gate}
                                                            selected={selectedGate?.id === gate.id}
                                                            onSelect={() => setSelectedGate(gate)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Braintree Gates */}
                                {gatesByType.braintree.length > 0 && (
                                    <div className="gate-type-section">
                                        <div
                                            className="gate-type-header"
                                            onClick={() => toggleSection('braintree')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3>Braintree</h3>
                                                <span className="gate-type-count">{gatesByType.braintree.length} gates</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: collapsedSections.braintree ? -90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                        <AnimatePresence>
                                            {!collapsedSections.braintree && (
                                                <motion.div
                                                    className="gates-grid"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {gatesByType.braintree.map(gate => (
                                                        <GateCard
                                                            key={gate.id}
                                                            gate={gate}
                                                            selected={selectedGate?.id === gate.id}
                                                            onSelect={() => setSelectedGate(gate)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Input Form */}
                    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Ingresar Tarjetas</h3>
                            {selectedGate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: selectedGate.color, color: 'white', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                    <Shield size={18} />
                                    {selectedGate.name}
                                </div>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Formato: <code>4557880011223344|12|26|123</code> (una por línea)
                        </p>
                        <textarea
                            value={cards}
                            onChange={(e) => setCards(e.target.value)}
                            placeholder="4557880011223344|12|26|123&#10;5555555555554444|01|27|456"
                            rows={8}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                resize: 'vertical'
                            }}
                            disabled={!canUseGates || processing || !selectedGate}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <button
                                className="btn-primary"
                                onClick={handleValidate}
                                disabled={!canUseGates || processing || !cards.trim() || !selectedGate}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Send size={18} />
                                {processing ? 'Procesando...' : 'Validar Tarjetas'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={clearResults}
                                disabled={processing}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Trash2 size={18} />
                                Limpiar
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => navigate('/gates/my-lives')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Heart size={18} />
                                Ver Mis Lives
                            </button>
                            {results.length > 0 && (
                                <button
                                    className="btn-secondary"
                                    onClick={exportResults}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Download size={18} />
                                    Exportar CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Table */}
                    {results.length > 0 && (
                        <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Resultados ({results.length})</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Tarjeta</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Resultado</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Tiempo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((result, index) => (
                                            <motion.tr
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                style={{ borderBottom: '1px solid var(--glass-border)' }}
                                            >
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    {result.card}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {getStatusIcon(result.icon)}
                                                        <span style={{ fontWeight: 600 }}>{result.status}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    {result.result}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <Clock size={14} />
                                                        {result.time}s
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Gates;
