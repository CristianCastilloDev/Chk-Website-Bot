import { useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyAdmins } from '../services/db';

/**
 * Hook para escuchar nuevas órdenes en tiempo real
 * Solo órdenes del día actual para reducir lecturas
 */
export const useOrderNotifications = (isActive, showInfo, playSound) => {
  useEffect(() => {
    if (!isActive) return;

    const ordersRef = collection(db, 'analytics_orders');
    
    // Solo órdenes de hoy para reducir lecturas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      ordersRef, 
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Solo notificar nuevas órdenes, no en la carga inicial
        if (change.type === 'added' && !isFirstLoad) {
          const order = change.doc.data();
          
          // Mostrar toast directo sin guardar en Firebase
          showInfo({
            title: '🛒 Nueva Orden',
            description: `Orden de ${order.targetUser || 'Usuario'} - $${order.price || 0}`
          });
          
          // Reproducir sonido
          playSound('order');
        }
      });

      if (isFirstLoad) {
        isFirstLoad = false;
      }
    }, (error) => {
      console.error('🛒 Error en listener de órdenes:', error);
    });

    return () => unsubscribe();
  }, [isActive, showInfo, playSound]);
};

// Hooks de usuarios y lives DESACTIVADOS permanentemente
// Solo se mantiene el hook de órdenes para reducir consumo
