import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Datos hardcodeados de BINs para evitar problemas de CORS
const BIN_DATA = {
    '426807': {
        bank: 'JPMorgan Chase Bank',
        country: 'United States',
        type: 'debit',
        brand: 'visa'
    },
    '416916': {
        bank: 'Bancoppel',
        country: 'Mexico',
        type: 'credit',
        brand: 'visa'
    },
    '557910': {
        bank: 'Banco Santander',
        country: 'Mexico',
        type: 'debit',
        brand: 'mastercard'
    }
};

// Script para insertar lives de prueba en Firebase
export const insertTestLives = async (userId, userName, userEmail) => {
    if (!userId) {
        throw new Error('userId es requerido');
    }

    const testLives = [
        // 2 Stripe
        {
            card: '4268070406206971|04|2029|254',
            bin: '426807',
            gateType: 'stripe',
            gateName: 'Stripe Gate 1',
            gateId: 'stripe_gate_1'
        },
        {
            card: '4268070406201234|04|2029|123',
            bin: '426807',
            gateType: 'stripe',
            gateName: 'Stripe Gate 2',
            gateId: 'stripe_gate_2'
        },
        // 1 Braintree
        {
            card: '4169161497838242|06|2030|489',
            bin: '416916',
            gateType: 'braintree',
            gateName: 'Braintree Gate 1',
            gateId: 'braintree_gate_1'
        },
        // 1 PayPal
        {
            card: '5579100460427790|03|2030|887',
            bin: '557910',
            gateType: 'paypal',
            gateName: 'PayPal Gate 1',
            gateId: 'paypal_gate_1'
        }
    ];

    // console.log('🚀 Insertando lives de prueba...');
    // console.log('👤 Usuario:', userId, userName, userEmail);

    for (const testLive of testLives) {
        try {
            // Usar datos hardcodeados en lugar de consultar API
            const bankInfo = BIN_DATA[testLive.bin] || {
                bank: 'Desconocido',
                country: 'Desconocido',
                type: 'Desconocido',
                brand: 'Desconocido'
            };

            // console.log(`📊 BIN ${testLive.bin}: ${bankInfo.bank} - ${bankInfo.country}`);

            const cardNumber = testLive.card.split('|')[0];
            const livesRef = collection(db, 'lives');

            const liveData = {
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                gateId: testLive.gateId,
                gateName: testLive.gateName,
                gateType: testLive.gateType,
                card: testLive.card,
                cardMasked: `${cardNumber.substring(0, 4)} **** **** ${cardNumber.substring(cardNumber.length - 4)}`,
                bin: testLive.bin,
                last4: cardNumber.substring(cardNumber.length - 4),
                status: 'Live',
                result: 'Approved',
                responseTime: parseFloat((Math.random() * 3 + 1).toFixed(2)), // Random entre 1-4 segundos
                // Información del BIN
                bank: bankInfo.bank,
                country: bankInfo.country,
                cardType: bankInfo.type,
                cardBrand: bankInfo.brand,
                // Fecha y hora
                date: new Date().toISOString().split('T')[0],
                hour: new Date().toTimeString().split(' ')[0].substring(0, 5),
                timestamp: serverTimestamp()
            };

            // console.log('💾 Guardando live:', liveData);

            await addDoc(livesRef, liveData);

            // console.log(`✅ Live guardada: ${testLive.card.substring(0, 19)}... (${testLive.gateType})`);
        } catch (error) {
            console.error(`❌ Error guardando live:`, error);
            throw error; // Re-throw para que el componente lo capture
        }
    }

    // console.log('🎉 ¡Todas las lives de prueba han sido insertadas!');
    // console.log('📊 Ahora puedes ver las estadísticas en BIN Analytics');
};
