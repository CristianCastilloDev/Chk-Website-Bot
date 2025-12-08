import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Copy, RefreshCw, Check, AlertCircle, Globe, Smartphone } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import './Pages.css';

const Herramientas = () => {
    const { canInteract } = usePermissions();
    const canUse = canInteract();

    // Estados para Email Temporal
    const [tempEmail, setTempEmail] = useState('');
    const [emailInbox, setEmailInbox] = useState([]);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);

    // Estados para SMS Temporal
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [smsLoading, setSmsLoading] = useState(false);
    const [smsCopied, setSmsCopied] = useState(false);

    // Estados para Fake Address
    const [selectedAddressCountry, setSelectedAddressCountry] = useState('us');
    const [fakeAddress, setFakeAddress] = useState(null);
    const [addressLoading, setAddressLoading] = useState(false);
    const [addressCopied, setAddressCopied] = useState(false);

    // Países disponibles para SMS
    const countries = [
        { code: 'us', name: '🇺🇸 United States', flag: '🇺🇸' },
        { code: 'mx', name: '🇲🇽 Mexico', flag: '🇲🇽' },
        { code: 'gb', name: '🇬🇧 United Kingdom', flag: '🇬🇧' },
        { code: 'ca', name: '🇨🇦 Canada', flag: '🇨🇦' },
        { code: 'de', name: '🇩🇪 Germany', flag: '🇩🇪' },
        { code: 'fr', name: '🇫🇷 France', flag: '🇫🇷' },
        { code: 'es', name: '🇪🇸 Spain', flag: '🇪🇸' },
        { code: 'br', name: '🇧🇷 Brazil', flag: '🇧🇷' },
    ];

    // Servicios disponibles para SMS
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

    // Países para direcciones
    const addressCountries = [
        { code: 'us', name: 'United States', flag: '🇺🇸' },
        { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
        { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'ca', name: 'Canada', flag: '🇨🇦' },
        { code: 'de', name: 'Germany', flag: '🇩🇪' },
        { code: 'fr', name: 'France', flag: '🇫🇷' },
    ];

    // Funciones para Email Temporal
    const generateEmail = async () => {
        setEmailLoading(true);
        // TODO: Implementar API de 1secmail
        setTimeout(() => {
            setTempEmail('demo' + Math.floor(Math.random() * 10000) + '@1secmail.com');
            setEmailLoading(false);
        }, 1000);
    };

    const refreshInbox = async () => {
        setEmailLoading(true);
        // TODO: Implementar lectura de inbox
        setTimeout(() => {
            setEmailInbox([
                { id: 1, from: 'noreply@example.com', subject: 'Welcome!', date: '2 min ago' },
                { id: 2, from: 'support@service.com', subject: 'Verification Code', date: '5 min ago' },
            ]);
            setEmailLoading(false);
        }, 1000);
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(tempEmail);
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
    };

    // Funciones para SMS Temporal
    const getPhoneNumber = async () => {
        if (!selectedCountry || !selectedService) {
            alert('Por favor selecciona un país y servicio');
            return;
        }
        setSmsLoading(true);
        // TODO: Implementar API de SMS-Activate
        setTimeout(() => {
            setPhoneNumber('+1 234 567 8900');
            setSmsLoading(false);
        }, 1500);
    };

    const refreshSMS = async () => {
        setSmsLoading(true);
        // TODO: Implementar lectura de SMS
        setTimeout(() => {
            setSmsCode('123456');
            setSmsLoading(false);
        }, 1500);
    };

    const copyPhone = () => {
        navigator.clipboard.writeText(phoneNumber);
        setSmsCopied(true);
        setTimeout(() => setSmsCopied(false), 2000);
    };

    const cancelNumber = () => {
        setPhoneNumber('');
        setSmsCode('');
        setSelectedCountry('');
        setSelectedService('');
    };

    // Funciones para Fake Address
    const generateAddress = async () => {
        setAddressLoading(true);
        // TODO: Implementar Faker.js o Random User API
        setTimeout(() => {
            setFakeAddress({
                street: '1234 Main Street',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'United States'
            });
            setAddressLoading(false);
        }, 1000);
    };

    const copyAddress = (text) => {
        navigator.clipboard.writeText(text);
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
    };

    const copyFullAddress = () => {
        const fullAddress = `${fakeAddress.street}\n${fakeAddress.city}, ${fakeAddress.state} ${fakeAddress.zipCode}\n${fakeAddress.country}`;
        copyAddress(fullAddress);
    };

    return (
        <DashboardLayout currentPage="herramientas">
            <div>
                <div className="page-header">
                    <h1>🛠️ Herramientas</h1>
                    <p>Accede a herramientas útiles para tus necesidades</p>
                </div>

                {/* Mensaje de restricción si no puede interactuar */}
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

                {/* Contenido principal */}
                <div className={`herramientas-content ${!canUse ? 'disabled' : ''}`}>

                    {/* 1. EMAIL TEMPORAL */}
                    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Mail size={28} />
                            📧 Email Temporal
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Genera un email temporal para recibir mensajes sin usar tu email personal
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={generateEmail}
                                disabled={emailLoading}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={18} className={emailLoading ? 'spinning' : ''} />
                                {emailLoading ? 'Generando...' : 'Generar Email'}
                            </button>
                            {tempEmail && (
                                <button
                                    onClick={refreshInbox}
                                    disabled={emailLoading}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <RefreshCw size={18} />
                                    Refrescar Inbox
                                </button>
                            )}
                        </div>

                        {tempEmail && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tu email temporal:</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'monospace' }}>{tempEmail}</p>
                                    </div>
                                    <button
                                        onClick={copyEmail}
                                        className="btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        {emailCopied ? <Check size={18} /> : <Copy size={18} />}
                                        {emailCopied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {emailInbox.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📬 Inbox ({emailInbox.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {emailInbox.map(email => (
                                        <div key={email.id} className="glass" style={{ padding: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 600 }}>{email.from}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{email.date}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)' }}>{email.subject}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. SMS TEMPORAL */}
                    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <MessageSquare size={28} />
                            📱 SMS Temporal
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Obtén un número temporal para recibir códigos de verificación SMS
                        </p>

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
                                disabled={smsLoading || !selectedCountry || !selectedService}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Smartphone size={18} />
                                {smsLoading ? 'Obteniendo...' : 'Obtener Número'}
                            </button>
                            {phoneNumber && (
                                <>
                                    <button
                                        onClick={refreshSMS}
                                        disabled={smsLoading}
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
                                            {smsCopied ? <Check size={18} /> : <Copy size={18} />}
                                            {smsCopied ? 'Copiado' : 'Copiar'}
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

                    {/* 3. FAKE ADDRESS */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <MapPin size={28} />
                            🏠 Fake Address
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Genera una dirección falsa para formularios y registros
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    País
                                </label>
                                <select
                                    value={selectedAddressCountry}
                                    onChange={(e) => setSelectedAddressCountry(e.target.value)}
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
                                    {addressCountries.map(country => (
                                        <option key={country.code} value={country.code}>{country.flag} {country.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={generateAddress}
                                disabled={addressLoading}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={18} className={addressLoading ? 'spinning' : ''} />
                                {addressLoading ? 'Generando...' : 'Generar Dirección'}
                            </button>
                        </div>

                        {fakeAddress && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>Dirección Generada</h3>
                                    <button
                                        onClick={copyFullAddress}
                                        className="btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        {addressCopied ? <Check size={18} /> : <Copy size={18} />}
                                        Copiar Todo
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { label: 'Calle', value: fakeAddress.street },
                                        { label: 'Ciudad', value: fakeAddress.city },
                                        { label: 'Estado', value: fakeAddress.state },
                                        { label: 'Código Postal', value: fakeAddress.zipCode },
                                        { label: 'País', value: fakeAddress.country },
                                    ].map((field, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{field.label}</p>
                                                <p style={{ fontWeight: 600 }}>{field.value}</p>
                                            </div>
                                            <button
                                                onClick={() => copyAddress(field.value)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'transparent',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-primary)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Herramientas;
