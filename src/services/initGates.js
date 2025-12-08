// Script para inicializar los 9 gates en Firebase
// Ejecutar una sola vez desde la consola del navegador o desde un componente temporal

import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const initializeGates = async () => {
    const gates = [
        // STRIPE GATES (3)
        {
            id: 'stripe_gate_1',
            name: 'Stripe Gate 1',
            type: 'stripe',
            icon: 'CreditCard',
            color: '#6366f1',
            apiEndpoint: '', // Se llenará después
            apiParams: {},
            status: 'active',
            description: 'Validación Stripe - Configuración 1',
            order: 1
        },
        {
            id: 'stripe_gate_2',
            name: 'Stripe Gate 2',
            type: 'stripe',
            icon: 'CreditCard',
            color: '#6366f1',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación Stripe - Configuración 2',
            order: 2
        },
        {
            id: 'stripe_gate_3',
            name: 'Stripe Gate 3',
            type: 'stripe',
            icon: 'CreditCard',
            color: '#6366f1',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación Stripe - Configuración 3',
            order: 3
        },

        // PAYPAL GATES (3)
        {
            id: 'paypal_gate_1',
            name: 'PayPal Gate 1',
            type: 'paypal',
            icon: 'Wallet',
            color: '#0070ba',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación PayPal - Configuración 1',
            order: 4
        },
        {
            id: 'paypal_gate_2',
            name: 'PayPal Gate 2',
            type: 'paypal',
            icon: 'Wallet',
            color: '#0070ba',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación PayPal - Configuración 2',
            order: 5
        },
        {
            id: 'paypal_gate_3',
            name: 'PayPal Gate 3',
            type: 'paypal',
            icon: 'Wallet',
            color: '#0070ba',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación PayPal - Configuración 3',
            order: 6
        },

        // BRAINTREE GATES (3)
        {
            id: 'braintree_gate_1',
            name: 'Braintree Gate 1',
            type: 'braintree',
            icon: 'Shield',
            color: '#00c853',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación Braintree - Configuración 1',
            order: 7
        },
        {
            id: 'braintree_gate_2',
            name: 'Braintree Gate 2',
            type: 'braintree',
            icon: 'Shield',
            color: '#00c853',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación Braintree - Configuración 2',
            order: 8
        },
        {
            id: 'braintree_gate_3',
            name: 'Braintree Gate 3',
            type: 'braintree',
            icon: 'Shield',
            color: '#00c853',
            apiEndpoint: '',
            apiParams: {},
            status: 'active',
            description: 'Validación Braintree - Configuración 3',
            order: 9
        }
    ];

    console.log('🚀 Iniciando creación de gates...');

    for (const gate of gates) {
        try {
            const gateRef = doc(db, 'gates', gate.id);
            await setDoc(gateRef, {
                ...gate,
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`✅ Gate creado: ${gate.name}`);
        } catch (error) {
            console.error(`❌ Error creando ${gate.name}:`, error);
        }
    }

    console.log('🎉 ¡Todos los gates han sido creados!');

    // Crear stats iniciales
    try {
        const statsRef = doc(db, 'stats', 'global_stats');
        await setDoc(statsRef, {
            totalLives: 0,
            livesByGate: {},
            livesByType: {
                stripe: 0,
                paypal: 0,
                braintree: 0
            },
            lastUpdated: serverTimestamp()
        });
        console.log('✅ Stats globales inicializadas');
    } catch (error) {
        console.error('❌ Error creando stats:', error);
    }
};

// Para ejecutar desde la consola del navegador:
// import { initializeGates } from './services/initGates';
// initializeGates();
