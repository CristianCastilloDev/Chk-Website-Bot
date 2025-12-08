import { useState } from 'react';
import { MapPin, Copy, RefreshCw, Check, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import './Pages.css';

const FakeAddress = () => {
    const { canInteract } = usePermissions();
    const canUse = canInteract();

    const [selectedCountry, setSelectedCountry] = useState('us');
    const [fakeAddress, setFakeAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const countries = [
        { code: 'us', name: 'United States', flag: '🇺🇸' },
        { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
        { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'ca', name: 'Canada', flag: '🇨🇦' },
        { code: 'de', name: 'Germany', flag: '🇩🇪' },
        { code: 'fr', name: 'France', flag: '🇫🇷' },
    ];

    const generateAddress = async () => {
        setLoading(true);
        // TODO: Implementar Faker.js o Random User API
        setTimeout(() => {
            setFakeAddress({
                street: '1234 Main Street',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'United States'
            });
            setLoading(false);
        }, 1000);
    };

    const copyAddress = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyFullAddress = () => {
        const fullAddress = `${fakeAddress.street}\n${fakeAddress.city}, ${fakeAddress.state} ${fakeAddress.zipCode}\n${fakeAddress.country}`;
        copyAddress(fullAddress);
    };

    return (
        <DashboardLayout currentPage="herramientas">
            <div>
                <div className="page-header">
                    <h1><MapPin size={32} style={{ display: 'inline', marginRight: '10px' }} />🏠 Fake Address</h1>
                    <p>Genera una dirección falsa para formularios y registros</p>
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
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
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
                                    {countries.map(country => (
                                        <option key={country.code} value={country.code}>{country.flag} {country.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={generateAddress}
                                disabled={loading}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                                {loading ? 'Generando...' : 'Generar Dirección'}
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
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
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

export default FakeAddress;
