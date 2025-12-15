// Script para actualizar Stripe Gate 1 con el nombre "Gate Funcional"
// Ejecutar desde la consola del navegador o componente temporal

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const updateStripeGate1 = async () => {
    try {
        const gateRef = doc(db, 'gates', 'stripe_gate_1');

        await updateDoc(gateRef, {
            name: 'Gate Funcional',
            description: 'Gate funcional con endpoint configurado',
            // Aquí puedes agregar el endpoint real cuando lo tengas
            // apiEndpoint: 'https://tu-endpoint.com/check'
        });

        // console.log('✅ Stripe Gate 1 actualizado a "Gate Funcional"');
        return true;
    } catch (error) {
        console.error('❌ Error actualizando gate:', error);
        return false;
    }
};

// Para ejecutar desde la consola:
// import { updateStripeGate1 } from './services/updateGate';
// updateStripeGate1();
