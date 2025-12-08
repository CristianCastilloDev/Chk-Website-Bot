import { useState } from 'react';
import { MessageSquare, Copy, RefreshCw, Check, AlertCircle, Globe, Smartphone } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import './Pages.css';

const SMSTemporal = () => {
    const { canInteract } = usePermissions();
    const canUse = canInteract();

    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const countries = [
        { code: 'us', name: '🇺🇸 United States' },
        { code: 'mx', name: '🇲🇽 Mexico' },
        { code: 'gb', name: '🇬🇧 United Kingdom' },
        { code: 'ca', name: '🇨🇦 Canada' },
        { code: 'de', name: '🇩🇪 Germany' },
        { code: 'fr', name: '🇫🇷 France' },
        { code: 'es', name: '🇪🇸 Spain' },
        { code: 'br', name: '🇧🇷 Brazil' },
    ];

    const services = [
        { id: 'wa', name: 'WhatsApp', icon: '💬' },
        { id: 'tg', name: 'Telegram', icon: '✈️' },
        { id: 'ig', name: 'Instagram', icon: '📷' },
        { id: 'fb', name: 'Facebook', icon: '👥' },
        { id: 'go', name: 'Google', icon: '🔍' },
        { id: 'tw', name: 'Twitter/X', icon: '🐦' },
        { id: 'tt', name: 'TikTok', icon: '🎵' },
        { id: 'dc', name: 'Discord', icon: '🎮' },
    ];

    const getPhoneNumber = async () => {
        if (!selectedCountry || !selectedService) {
            alert('Por favor selecciona un país y servicio');
            return;
        }
        setLoading(true);
        // TODO: Implementar API de SMS-Activate
        setTimeout(() => {
            setPhoneNumber('+1 234 567 8900');
            setLoading(false);
        }, 1500);
    };

    const refreshSMS = async () => {
        setLoading(true);
        // TODO: Implementar lectura de SMS
        setTimeout(() => {
            setSmsCode('123456');
            setLoading(false);
        }, 1500);
    };

    const copyPhone = () => {
        navigator.clipboard.writeText(phoneNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cancelNumber = () => {
        setPhoneNumber('');
        setSmsCode('');
        setSelectedCountry('');
        setSelectedService('');
    };

    return (
        <DashboardLayout currentPage="herramientas">
            <div>
                <div className="page-header">
                    <h1><MessageSquare size={32} style={{ display: 'inline', marginRight: '10px' }} />📱 SMS Temporal</h1>
                    <p>Obtén un número temporal para recibir códigos de verificación SMS</p>
                </div>

                {!canUse && (
                    <div className="permission-warning glass">
                        <AlertCircle size={24} />
                        <div>
                            <h3>Acceso Restringido</h3>
                            <p>
                                Necesitas un plan activo o créditos para usar esta funcionalidad.
                                Visita la página de <a href="/pricing">Pricing</a> para obtener acceso.
                            </p>
                        </div>
                    </div>
                )}

                <div className={`herramientas-content ${!canUse ? 'disabled' : ''}`}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    País
                                </label>
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Selecciona un país</option>
                                    {countries.map(country => (
                                        <option key={country.code} value={country.code}>{country.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Smartphone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Servicio
                                </label>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Selecciona un servicio</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.icon} {service.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={getPhoneNumber}
                                disabled={loading || !selectedCountry || !selectedService}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Smartphone size={18} />
                                {loading ? 'Obteniendo...' : 'Obtener Número'}
                            </button>
                            {phoneNumber && (
                                <>
                                    <button
                                        onClick={refreshSMS}
                                        disabled={loading}
                                        className="btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <RefreshCw size={18} />
                                        Refrescar SMS
                                    </button>
                                    <button
                                        onClick={cancelNumber}
                                        className="btn-danger"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white' }}
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>

                        {phoneNumber && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tu número temporal:</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: '1.3rem', fontWeight: 600, fontFamily: 'monospace' }}>{phoneNumber}</p>
                                        <button
                                            onClick={copyPhone}
                                            className="btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                            {copied ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>

                                {smsCode && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Código recibido:</p>
                                        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>{smsCode}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SMSTemporal;
