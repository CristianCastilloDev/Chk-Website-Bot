import { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import './Pages.css';

const EmailTemporal = () => {
    const { canInteract } = usePermissions();
    const canUse = canInteract();

    const [tempEmail, setTempEmail] = useState('');
    const [emailInbox, setEmailInbox] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateEmail = async () => {
        setLoading(true);
        // TODO: Implementar API de 1secmail
        setTimeout(() => {
            setTempEmail('demo' + Math.floor(Math.random() * 10000) + '@1secmail.com');
            setLoading(false);
        }, 1000);
    };

    const refreshInbox = async () => {
        setLoading(true);
        // TODO: Implementar lectura de inbox
        setTimeout(() => {
            setEmailInbox([
                { id: 1, from: 'noreply@example.com', subject: 'Welcome!', date: '2 min ago' },
                { id: 2, from: 'support@service.com', subject: 'Verification Code', date: '5 min ago' },
            ]);
            setLoading(false);
        }, 1000);
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(tempEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout currentPage="herramientas">
            <div>
                <div className="page-header">
                    <h1><Mail size={32} style={{ display: 'inline', marginRight: '10px' }} />📧 Email Temporal</h1>
                    <p>Genera un email temporal para recibir mensajes sin usar tu email personal</p>
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
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={generateEmail}
                                disabled={loading}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                                {loading ? 'Generando...' : 'Generar Email'}
                            </button>
                            {tempEmail && (
                                <button
                                    onClick={refreshInbox}
                                    disabled={loading}
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
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copiado' : 'Copiar'}
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

export default EmailTemporal;
