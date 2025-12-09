import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Send, Trash2, Download, AlertCircle, CheckCircle, XCircle, Clock, Zap, Heart, ChevronDown, CreditCard, Lock } from 'lucide-react';
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
    const [showGateModal, setShowGateModal] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({
        charge: false,  // CHARGE abierto por defecto
        auth: true      // AUTH cerrado por defecto
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


    const getGateIcon = (type) => {
        const iconStyle = { width: '32px', height: '32px', borderRadius: '25%' };
        switch (type) {
            case 'stripe':
                return <img src="https://cdn.simpleicons.org/stripe/6366f1" alt="Stripe" style={iconStyle} />;
            case 'paypal':
                return <img src="https://cdn.simpleicons.org/paypal/0070ba" alt="PayPal" style={iconStyle} />;
            case 'braintree':
                return <img src="https://cdn.simpleicons.org/braintree/00c853" alt="Braintree" style={iconStyle} />;
            case 'authorize':
                return <img src="https://play-lh.googleusercontent.com/tr8pu9LKDdj1jwezlMPSntXjdNOgIuzYUQM5rK4Cnr8tJf6LDAxhdj4SaR4BYt7XKg=w240-h480-rw" alt="Authorize.Net" style={iconStyle} />;
            case 'cardknox':
                return <img src="https://avatars.githubusercontent.com/u/12068809?s=200&v=4" alt="cardknox" style={iconStyle} />;
            case 'cybersource':
                return <img src="https://yt3.googleusercontent.com/ytc/AIdro_nFtxG9aSjVCran4CC53pNqV4hjhgM23hMduoangaiOQvA=s160-c-k-c0x00ffffff-no-rj" alt="Cybersource" style={iconStyle} />;
            case 'idk':
                return <Zap size={32} style={{ color: '#9333ea' }} />;
            case 'moneris':
                return <img src="https://avatars.githubusercontent.com/u/18684316?s=200&v=4" alt="Moneris" style={iconStyle} />;
            case 'nmi':
                return <img src="https://techspark.co/wp-content/uploads/2021/11/nmi-uai-516x516.png" alt="NMI" style={iconStyle} />;
            case 'payfabric':
                return <CreditCard size={32} style={{ color: '#0ea5e9' }} />;
            case 'payflow':
                return <img src="https://cdn.simpleicons.org/paypal/0070ba" alt="PayFlow" style={iconStyle} />;
            default:
                return <Shield size={32} />;
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

    // Agrupar gates por categoría (CHARGE o AUTH)
    const gatesByCategory = {
        charge: gates.filter(g => {
            const name = g.name?.toLowerCase() || '';
            const description = g.description?.toLowerCase() || '';
            const type = g.type?.toLowerCase() || '';

            // Buscar palabras clave en nombre, descripción o tipo
            const isCharge = name.includes('charge') ||
                name.includes('charged') ||
                name.includes('payment') ||
                description.includes('charge') ||
                description.includes('payment') ||
                name.includes('stripe') ||  // Stripe típicamente es CHARGE
                type === 'stripe';

            console.log(`Gate: ${g.name} - CHARGE: ${isCharge}`);
            return isCharge;
        }),
        auth: gates.filter(g => {
            const name = g.name?.toLowerCase() || '';
            const description = g.description?.toLowerCase() || '';
            const type = g.type?.toLowerCase() || '';

            // Buscar palabras clave en nombre, descripción o tipo
            const isAuth = name.includes('auth') ||
                name.includes('authorization') ||
                name.includes('cvv') ||
                name.includes('cnn') ||
                description.includes('auth') ||
                name.includes('braintree') ||  // Braintree típicamente es AUTH
                name.includes('paypal') ||     // PayPal típicamente es AUTH
                type === 'braintree' ||
                type === 'paypal';

            console.log(`Gate: ${g.name} - AUTH: ${isAuth}`);
            return isAuth;
        })
    };

    console.log('CHARGE Gates:', gatesByCategory.charge.length);
    console.log('AUTH Gates:', gatesByCategory.auth.length);

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



                    {/* Input Form */}
                    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>Ingresar Tarjetas</h3>

                            {/* Gate Selector Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Gate:</label>
                                {loadingGates ? (
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Cargando...</p>
                                ) : (
                                    <button
                                        onClick={() => setShowGateModal(true)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '8px',
                                            border: '2px solid var(--glass-border)',
                                            background: selectedGate
                                                ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                                : 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {selectedGate ? (
                                            <>
                                                <span>{getGateIcon(selectedGate.type)}</span>
                                                <span>{selectedGate.name}</span>
                                                <span style={{ opacity: 0.7 }}>({selectedGate.category})</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={18} />
                                                <span>Seleccionar Gate</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
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

            {/* Gate Selection Modal */}
            <AnimatePresence>
                {showGateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowGateModal(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '16px',
                                border: '1px solid var(--glass-border)',
                                maxWidth: '900px',
                                width: '100%',
                                maxHeight: '80vh',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid var(--glass-border)',
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                            }}>
                                <h2 style={{
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    color: 'white'
                                }}>
                                    <Shield size={24} />
                                    Seleccionar Gate
                                </h2>
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '0.9rem'
                                }}>
                                    Elige el gate que deseas utilizar para validar tarjetas
                                </p>
                            </div>

                            {/* Modal Content */}
                            <div style={{
                                padding: '1.5rem',
                                overflowY: 'auto',
                                flex: 1
                            }}>
                                {/* CHARGE Gates */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                        <CreditCard size={20} style={{ color: '#10b981' }} />
                                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.1rem' }}>
                                            CHARGE Gates
                                        </h3>
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {gates.filter(g => g.status === 'active' && g.category === 'CHARGE').length} activos
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {gates
                                            .filter(g => g.status === 'active' && g.category === 'CHARGE')
                                            .map((gate, index) => (
                                                <motion.div
                                                    key={gate.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => {
                                                        setSelectedGate(gate);
                                                        setShowGateModal(false);
                                                    }}
                                                    style={{
                                                        padding: '1.25rem',
                                                        background: selectedGate?.id === gate.id
                                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))'
                                                            : 'var(--bg-secondary)',
                                                        border: selectedGate?.id === gate.id
                                                            ? '2px solid #10b981'
                                                            : '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        marginBottom: '0.75rem'
                                                    }}>
                                                        <span style={{ fontSize: '1.5rem' }}>
                                                            {getGateIcon(gate.type)}
                                                        </span>
                                                        <div style={{ flex: 1 }}>
                                                            <h4 style={{
                                                                margin: 0,
                                                                fontSize: '1rem',
                                                                fontWeight: 600
                                                            }}>
                                                                {gate.name}
                                                            </h4>
                                                            <p style={{
                                                                margin: '0.25rem 0 0 0',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-secondary)',
                                                                textTransform: 'uppercase',
                                                                fontWeight: 600
                                                            }}>
                                                                {gate.type}
                                                            </p>
                                                        </div>
                                                        {selectedGate?.id === gate.id && (
                                                            <CheckCircle size={20} style={{ color: '#10b981' }} />
                                                        )}
                                                    </div>
                                                    {gate.description && (
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-secondary)',
                                                            lineHeight: 1.4
                                                        }}>
                                                            {gate.description}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            ))}
                                    </div>

                                    {gates.filter(g => g.status === 'active' && g.category === 'CHARGE').length === 0 && (
                                        <p style={{
                                            textAlign: 'center',
                                            color: 'var(--text-secondary)',
                                            padding: '2rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            No hay gates CHARGE activos disponibles
                                        </p>
                                    )}
                                </div>

                                {/* AUTH Gates */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <Lock size={20} style={{ color: '#3b82f6' }} />
                                        <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '1.1rem' }}>
                                            AUTH Gates
                                        </h3>
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {gates.filter(g => g.status === 'active' && g.category === 'AUTH').length} activos
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {gates
                                            .filter(g => g.status === 'active' && g.category === 'AUTH')
                                            .map((gate, index) => (
                                                <motion.div
                                                    key={gate.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => {
                                                        setSelectedGate(gate);
                                                        setShowGateModal(false);
                                                    }}
                                                    style={{
                                                        padding: '1.25rem',
                                                        background: selectedGate?.id === gate.id
                                                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))'
                                                            : 'var(--bg-secondary)',
                                                        border: selectedGate?.id === gate.id
                                                            ? '2px solid #3b82f6'
                                                            : '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        marginBottom: '0.75rem'
                                                    }}>
                                                        <span style={{ fontSize: '1.5rem' }}>
                                                            {getGateIcon(gate.type)}
                                                        </span>
                                                        <div style={{ flex: 1 }}>
                                                            <h4 style={{
                                                                margin: 0,
                                                                fontSize: '1rem',
                                                                fontWeight: 600
                                                            }}>
                                                                {gate.name}
                                                            </h4>
                                                            <p style={{
                                                                margin: '0.25rem 0 0 0',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-secondary)',
                                                                textTransform: 'uppercase',
                                                                fontWeight: 600
                                                            }}>
                                                                {gate.type}
                                                            </p>
                                                        </div>
                                                        {selectedGate?.id === gate.id && (
                                                            <CheckCircle size={20} style={{ color: '#3b82f6' }} />
                                                        )}
                                                    </div>
                                                    {gate.description && (
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-secondary)',
                                                            lineHeight: 1.4
                                                        }}>
                                                            {gate.description}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            ))}
                                    </div>

                                    {gates.filter(g => g.status === 'active' && g.category === 'AUTH').length === 0 && (
                                        <p style={{
                                            textAlign: 'center',
                                            color: 'var(--text-secondary)',
                                            padding: '2rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            No hay gates AUTH activos disponibles
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderTop: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem'
                            }}>
                                <button
                                    onClick={() => setShowGateModal(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default Gates;
