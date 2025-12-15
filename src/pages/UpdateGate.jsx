import { updateStripeGate1 } from '../services/updateGate';

const UpdateGate = () => {
    const handleUpdate = async () => {
        // console.log('Actualizando Stripe Gate 1...');
        const success = await updateStripeGate1();
        if (success) {
            alert('✅ Gate actualizado exitosamente!');
        } else {
            alert('❌ Error al actualizar gate');
        }
    };

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Actualizar Stripe Gate 1</h2>
            <button
                onClick={handleUpdate}
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                Actualizar a "Gate Funcional"
            </button>
        </div>
    );
};

export default UpdateGate;
