import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle, Database } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

const ManageBins = () => {
    const [bins, setBins] = useState([]);
    const [newBin, setNewBin] = useState({
        bin: '',
        bank: '',
        country: '',
        countryCode: '',
        type: 'credit',
        brand: 'visa',
        level: 'classic'
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const { isDev } = usePermissions();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirigir si no es dev
        if (!isDev()) {
            navigate('/dashboard');
            return;
        }
        loadBins();
    }, [isDev, navigate]);

    const loadBins = async () => {
        try {
            // Leer el archivo binDatabase.js actual
            const response = await fetch('/src/data/binDatabase.js');
            const text = await response.text();

            // Parsear los BINs del archivo (esto es una solución temporal)
            // En producción, deberías tener un endpoint en tu backend
            const binsMatch = text.match(/export const BIN_DATABASE = ({[\s\S]*?});/);
            if (binsMatch) {
                const binsObj = eval('(' + binsMatch[1] + ')');
                const binsList = Object.entries(binsObj).map(([bin, data]) => ({
                    bin,
                    ...data
                }));
                setBins(binsList);
            }
        } catch (error) {
            console.error('Error loading BINs:', error);
            setMessage({ type: 'error', text: 'Error al cargar los BINs' });
        }
    };

    const handleAddBin = () => {
        if (!newBin.bin || newBin.bin.length < 6) {
            setMessage({ type: 'error', text: 'El BIN debe tener al menos 6 dígitos' });
            return;
        }

        if (!newBin.bank || !newBin.country || !newBin.countryCode) {
            setMessage({ type: 'error', text: 'Todos los campos son requeridos' });
            return;
        }

        // Verificar que no exista ya
        if (bins.find(b => b.bin === newBin.bin)) {
            setMessage({ type: 'error', text: 'Este BIN ya existe en la base de datos' });
            return;
        }

        setBins([...bins, { ...newBin }]);
        setNewBin({
            bin: '',
            bank: '',
            country: '',
            countryCode: '',
            type: 'credit',
            brand: 'visa',
            level: 'classic'
        });
        setMessage({ type: 'success', text: 'BIN agregado. No olvides guardar los cambios.' });
    };

    const handleRemoveBin = (binToRemove) => {
        setBins(bins.filter(b => b.bin !== binToRemove));
        setMessage({ type: 'success', text: 'BIN eliminado. No olvides guardar los cambios.' });
    };

    const handleSave = () => {
        setLoading(true);

        // Generar el código del archivo
        const fileContent = `// Base de datos local de BINs VERIFICADOS
// Solo incluye BINs confirmados de bancos reales
// IMPORTANTE: Todos estos BINs han sido verificados manualmente

export const BIN_DATABASE = {
${bins.map(bin => `    '${bin.bin}': { bank: '${bin.bank}', country: '${bin.country}', countryCode: '${bin.countryCode}', type: '${bin.type}', brand: '${bin.brand}', level: '${bin.level}' },`).join('\n')}
};

// Función helper para buscar un BIN
export const searchBin = (bin) => {
    return BIN_DATABASE[bin] || null;
};

// Función helper para obtener todos los BINs disponibles
export const getAllBins = () => {
    return Object.keys(BIN_DATABASE);
};

// Función helper para obtener estadísticas de la base de datos
export const getBinDatabaseStats = () => {
    const bins = Object.values(BIN_DATABASE);

    const countries = {};
    const banks = {};
    const brands = {};

    bins.forEach(bin => {
        countries[bin.country] = (countries[bin.country] || 0) + 1;
        banks[bin.bank] = (banks[bin.bank] || 0) + 1;
        brands[bin.brand] = (brands[bin.brand] || 0) + 1;
    });

    return {
        totalBins: bins.length,
        countries: Object.keys(countries).length,
        banks: Object.keys(banks).length,
        brands: Object.keys(brands).length,
        topCountries: Object.entries(countries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, count]) => ({ country, count })),
        topBanks: Object.entries(banks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([bank, count]) => ({ bank, count }))
    };
};
`;

        // Copiar al portapapeles
        navigator.clipboard.writeText(fileContent).then(() => {
            setMessage({
                type: 'success',
                text: 'Código copiado al portapapeles. Pégalo en src/data/binDatabase.js y guarda el archivo.'
            });
            setLoading(false);
        }).catch(err => {
            setMessage({ type: 'error', text: 'Error al copiar: ' + err.message });
            setLoading(false);
        });
    };

    if (!isDev()) {
        return null;
    }

    return (
        <DashboardLayout currentPage="manage-bins">
            <div>
                <div className="page-header">
                    <h1><Database size={32} style={{ display: 'inline', marginRight: '10px' }} />Gestión de BINs</h1>
                    <p>Panel de desarrollo - Solo accesible para DEV</p>
                </div>

                {message.text && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        borderRadius: '8px',
                        color: message.type === 'error' ? '#ef4444' : '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Agregar nuevo BIN */}
                <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={24} />
                        Agregar Nuevo BIN
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>BIN (6-8 dígitos)</label>
                            <input
                                type="text"
                                value={newBin.bin}
                                onChange={(e) => setNewBin({ ...newBin, bin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                                placeholder="426807"
                                maxLength={8}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Banco</label>
                            <input
                                type="text"
                                value={newBin.bank}
                                onChange={(e) => setNewBin({ ...newBin, bank: e.target.value })}
                                placeholder="HSBC MEXICO S.A"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>País</label>
                            <input
                                type="text"
                                value={newBin.country}
                                onChange={(e) => setNewBin({ ...newBin, country: e.target.value })}
                                placeholder="Mexico"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Código País</label>
                            <input
                                type="text"
                                value={newBin.countryCode}
                                onChange={(e) => setNewBin({ ...newBin, countryCode: e.target.value.toUpperCase().slice(0, 2) })}
                                placeholder="MX"
                                maxLength={2}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipo</label>
                            <select
                                value={newBin.type}
                                onChange={(e) => setNewBin({ ...newBin, type: e.target.value })}
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
                                <option value="credit">Credit</option>
                                <option value="debit">Debit</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Marca</label>
                            <select
                                value={newBin.brand}
                                onChange={(e) => setNewBin({ ...newBin, brand: e.target.value })}
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
                                <option value="visa">Visa</option>
                                <option value="mastercard">Mastercard</option>
                                <option value="amex">American Express</option>
                                <option value="discover">Discover</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nivel</label>
                            <select
                                value={newBin.level}
                                onChange={(e) => setNewBin({ ...newBin, level: e.target.value })}
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
                                <option value="classic">Classic</option>
                                <option value="gold">Gold</option>
                                <option value="platinum">Platinum</option>
                                <option value="signature">Signature</option>
                                <option value="infinite">Infinite</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleAddBin}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        Agregar BIN
                    </button>
                </div>

                {/* Lista de BINs */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={24} />
                            BINs en la Base de Datos ({bins.length})
                        </h3>
                        <button
                            onClick={handleSave}
                            disabled={loading || bins.length === 0}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Save size={20} />
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    {bins.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                            No hay BINs en la base de datos. Agrega algunos arriba.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>BIN</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Banco</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>País</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Tipo</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Marca</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Nivel</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bins.map((bin, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600 }}>{bin.bin}</td>
                                            <td style={{ padding: '1rem' }}>{bin.bank}</td>
                                            <td style={{ padding: '1rem' }}>{bin.country} ({bin.countryCode})</td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{bin.type}</td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{bin.brand}</td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{bin.level}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => handleRemoveBin(bin.bin)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
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

export default ManageBins;
