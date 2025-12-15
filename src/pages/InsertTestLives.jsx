import { insertTestLives } from '../services/insertTestLives';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const InsertTestLives = () => {
    const { user } = useAuth();

    const handleInsert = async () => {
        // console.log('👤 User object:', user);

        if (!user) {
            alert('❌ Debes estar autenticado');
            return;
        }

        if (!user.id) {
            alert('❌ Error: Usuario no tiene ID. Por favor recarga la página.');
            console.error('User object sin ID:', user);
            return;
        }

        // console.log('🚀 Iniciando inserción de lives de prueba...');
        // console.log('📋 Datos del usuario:', {
            id: user.id,
            name: user.name,
            email: user.email
        });

        try {
            await insertTestLives(user.id, user.name || user.email, user.email);
            alert('✅ Lives de prueba insertadas exitosamente!\n\nPuedes verlas en:\n- Mis Lives\n- BIN Analytics');
        } catch (error) {
            console.error('❌ Error completo:', error);
            alert('❌ Error al insertar lives: ' + error.message);
        }
    };

    return (
        <DashboardLayout currentPage="insert-test-lives">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Insertar Lives de Prueba</h2>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Esto insertará 4 lives de prueba con información real de BIN
                </p>
                <p style={{ marginBottom: '2rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                    ⚠️ Se ejecutará inmediatamente al hacer click
                </p>
                <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto 2rem', listStyle: 'none', padding: 0 }}>
                    <li style={{ padding: '0.5rem', background: 'var(--bg-secondary)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                        🔵 Stripe: 4268070406206971|04|2029|254
                    </li>
                    <li style={{ padding: '0.5rem', background: 'var(--bg-secondary)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                        🔵 Stripe: 4268070406201234|04|2029|123
                    </li>
                    <li style={{ padding: '0.5rem', background: 'var(--bg-secondary)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                        🟢 Braintree: 4169161497838242|06|2030|489
                    </li>
                    <li style={{ padding: '0.5rem', background: 'var(--bg-secondary)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                        🔵 PayPal: 5579100460427790|03|2030|887
                    </li>
                </ul>
                <button
                    onClick={handleInsert}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Insertar Lives de Prueba
                </button>
            </div>
        </DashboardLayout>
    );
};

export default InsertTestLives;
