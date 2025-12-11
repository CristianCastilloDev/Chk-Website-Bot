import { collection, addDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Script para generar datos de prueba para Analytics Dashboard
 * Genera: órdenes, usuarios, suscripciones, actividad
 */

// Generar datos de órdenes
export const generateTestOrders = async (count = 50) => {
    console.log(`🔄 Generando ${count} órdenes de prueba...`);
    
    const statuses = ['pending', 'approved', 'rejected'];
    const types = ['plan', 'credits'];
    const adminNames = ['Admin Carlos', 'Admin María', 'Admin Juan', 'Admin Ana'];
    const userNames = ['User001', 'User002', 'User003', 'User004', 'User005'];
    
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        // Generar fecha aleatoria en los últimos 6 meses
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const order = {
            createdBy: adminNames[Math.floor(Math.random() * adminNames.length)],
            createdAt: createdAt,
            targetUser: userNames[Math.floor(Math.random() * userNames.length)],
            type: type,
            description: type === 'plan' 
                ? `Plan ${[7, 15, 30][Math.floor(Math.random() * 3)]} días`
                : `${[100, 500, 1000][Math.floor(Math.random() * 3)]} créditos`,
            amount: type === 'plan' 
                ? [7, 15, 30][Math.floor(Math.random() * 3)]
                : [100, 500, 1000][Math.floor(Math.random() * 3)],
            price: type === 'plan'
                ? [10, 20, 50][Math.floor(Math.random() * 3)]
                : [5, 15, 30][Math.floor(Math.random() * 3)],
            status: status,
            approvedBy: status === 'approved' ? 'Dev Master' : null,
            approvedAt: status === 'approved' ? createdAt : null,
            rejectedBy: status === 'rejected' ? 'Dev Master' : null,
            rejectedAt: status === 'rejected' ? createdAt : null,
            rejectionReason: status === 'rejected' ? 'Presupuesto insuficiente' : null
        };
        
        orders.push(order);
    }
    
    // Guardar en Firestore
    const ordersRef = collection(db, 'analytics_orders');
    let savedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
        try {
            await addDoc(ordersRef, order);
            savedCount++;
            if (savedCount % 10 === 0) {
                console.log(`  ✓ ${savedCount}/${count} órdenes guardadas...`);
            }
        } catch (error) {
            errorCount++;
            if (errorCount === 1) {
                console.error('❌ Error guardando orden:', error.message);
                console.log('💡 Verifica que tu usuario tenga rol "admin" o "dev"');
                console.log('💡 O actualiza temporalmente las reglas de Firebase');
            }
        }
    }
    
    if (savedCount === 0 && errorCount > 0) {
        console.log('\n⚠️  No se pudieron crear órdenes por permisos.');
        console.log('📝 Solución temporal: En Firebase Console → Firestore → Rules');
        console.log('   Cambia temporalmente analytics_orders a:');
        console.log('   allow read, write: if request.auth != null;');
        console.log('   Luego vuelve a ejecutar window.generateAnalyticsData()');
    }
    
    console.log(`✅ ${savedCount} órdenes de prueba creadas exitosamente`);
    return savedCount;
};

// Generar datos de actividad de usuarios
export const generateTestUserActivity = async (count = 100) => {
    console.log(`🔄 Generando ${count} registros de actividad...`);
    
    const activities = ['login', 'gate_check', 'bin_search', 'live_check'];
    const userNames = ['User001', 'User002', 'User003', 'User004', 'User005'];
    
    const activityRecords = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - daysAgo);
        
        const activity = {
            userId: userNames[Math.floor(Math.random() * userNames.length)],
            activity: activities[Math.floor(Math.random() * activities.length)],
            timestamp: timestamp,
            metadata: {
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0'
            }
        };
        
        activityRecords.push(activity);
    }
    
    // Guardar en Firestore
    const activityRef = collection(db, 'analytics_activity');
    let savedCount = 0;
    
    for (const activity of activityRecords) {
        try {
            await addDoc(activityRef, activity);
            savedCount++;
            if (savedCount % 20 === 0) {
                console.log(`  ✓ ${savedCount}/${count} actividades guardadas...`);
            }
        } catch (error) {
            console.error('Error guardando actividad:', error);
        }
    }
    
    console.log(`✅ ${savedCount} registros de actividad creados exitosamente`);
    return savedCount;
};

// Generar datos de suscripciones
export const generateTestSubscriptions = async (count = 30) => {
    console.log(`🔄 Generando ${count} suscripciones de prueba...`);
    
    const types = ['plan', 'credits'];
    const userNames = ['User001', 'User002', 'User003', 'User004', 'User005'];
    const statuses = ['active', 'expired', 'renewed'];
    
    const subscriptions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const subscription = {
            userId: userNames[Math.floor(Math.random() * userNames.length)],
            type: type,
            status: status,
            createdAt: createdAt,
            amount: type === 'plan' 
                ? [7, 15, 30][Math.floor(Math.random() * 3)]
                : [100, 500, 1000][Math.floor(Math.random() * 3)],
            price: type === 'plan'
                ? [10, 20, 50][Math.floor(Math.random() * 3)]
                : [5, 15, 30][Math.floor(Math.random() * 3)],
            expiresAt: new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)),
            isRenewal: status === 'renewed'
        };
        
        subscriptions.push(subscription);
    }
    
    // Guardar en Firestore
    const subsRef = collection(db, 'analytics_subscriptions');
    let savedCount = 0;
    
    for (const sub of subscriptions) {
        try {
            await addDoc(subsRef, sub);
            savedCount++;
            if (savedCount % 10 === 0) {
                console.log(`  ✓ ${savedCount}/${count} suscripciones guardadas...`);
            }
        } catch (error) {
            console.error('Error guardando suscripción:', error);
        }
    }
    
    console.log(`✅ ${savedCount} suscripciones de prueba creadas exitosamente`);
    return savedCount;
};

// Generar todos los datos de prueba
export const generateAllAnalyticsData = async () => {
    console.log('🚀 Iniciando generación de datos de Analytics...\n');
    
    try {
        await generateTestOrders(50);
        console.log('');
        await generateTestUserActivity(100);
        console.log('');
        await generateTestSubscriptions(30);
        console.log('');
        console.log('✅ ¡Todos los datos de prueba generados exitosamente!');
    } catch (error) {
        console.error('❌ Error generando datos:', error);
    }
};

// Eliminar todos los datos de prueba
export const deleteAllAnalyticsData = async () => {
    console.log('🗑️  Eliminando datos de prueba de Analytics...\n');
    
    const collections = ['analytics_orders', 'analytics_activity', 'analytics_subscriptions'];
    
    for (const collectionName of collections) {
        try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            console.log(`  Eliminando ${snapshot.size} documentos de ${collectionName}...`);
            
            for (const doc of snapshot.docs) {
                await deleteDoc(doc.ref);
            }
            
            console.log(`  ✓ ${collectionName} limpiado`);
        } catch (error) {
            console.error(`  ❌ Error eliminando ${collectionName}:`, error);
        }
    }
    
    console.log('\n✅ Todos los datos de prueba eliminados');
};

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
    window.generateAnalyticsData = generateAllAnalyticsData;
    window.deleteAnalyticsData = deleteAllAnalyticsData;
    console.log('📊 Funciones de Analytics disponibles:');
    console.log('  - window.generateAnalyticsData() - Generar datos de prueba');
    console.log('  - window.deleteAnalyticsData() - Eliminar datos de prueba');
}
