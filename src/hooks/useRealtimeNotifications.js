import { useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyAdmins } from '../services/db';

/**
 * Hook para escuchar nuevas órdenes en tiempo real
 * Solo se activa para admins y devs
 */
export const useOrderNotifications = (isActive) => {
  useEffect(() => {
    if (!isActive) return;

    const ordersRef = collection(db, 'analytics_orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Solo notificar en nuevas adiciones, no en la carga inicial
        if (change.type === 'added' && !isFirstLoad) {
          const order = change.doc.data();
          console.log('🛒 Nueva Orden Detectada:', order.targetUser, '-', `$${order.price}`);
          console.log('🛒 Llamando a notifyAdmins...');
          
          notifyAdmins(
            'order',
            '🛒 Nueva Orden',
            `Orden de ${order.targetUser || 'Usuario'} - $${order.price || 0}`,
            {
              orderId: change.doc.id,
              amount: order.price,
              user: order.targetUser
            }
          ).then(() => {
            console.log('🛒 notifyAdmins completado exitosamente');
          }).catch(error => {
            console.error('🛒 Error al notificar:', error);
          });
        }
      });

      if (isFirstLoad) {
        isFirstLoad = false;
      }
    }, (error) => {
      console.error('🛒 Error en listener de órdenes:', error);
    });

    return () => unsubscribe();
  }, [isActive]);
};

/**
 * Hook para escuchar nuevos usuarios en tiempo real
 */
export const useUserNotifications = (isActive) => {
  useEffect(() => {
    if (!isActive) return;
    
    const usersRef = collection(db, 'users');
    // Removido orderBy para evitar problemas de índice
    const q = query(usersRef);

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !isFirstLoad) {
          const user = change.doc.data();
          console.log('👤 Nuevo Usuario Detectado:', user.name || user.email);
          
          notifyAdmins(
            'user',
            '👤 Nuevo Usuario',
            `${user.name || user.email} se ha registrado`,
            {
              userId: change.doc.id,
              email: user.email,
              name: user.name
            }
          ).catch(error => console.error('👤 Error al notificar:', error));
        }
      });

      if (isFirstLoad) {
        isFirstLoad = false;
      }
    }, (error) => {
      console.error('👤 Error en listener de usuarios:', error);
    });

    return () => unsubscribe();
  }, [isActive]);
};

/**
 * Hook para escuchar nuevos lives en tiempo real
 */
export const useLiveNotifications = (isActive) => {
  useEffect(() => {
    if (!isActive) return;

    const livesRef = collection(db, 'lives');
    const q = query(livesRef, orderBy('createdAt', 'desc'));

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !isFirstLoad) {
          const live = change.doc.data();
          console.log('💳 Nuevo Live Detectado:', live.gateName);
          
          notifyAdmins(
            'live',
            '💳 Nuevo Live',
            `Live de ${live.gateName || 'Gate'} agregado`,
            {
              liveId: change.doc.id,
              gateName: live.gateName,
              bin: live.bin
            }
          ).catch(error => console.error('💳 Error al notificar:', error));
        }
      });

      if (isFirstLoad) {
        isFirstLoad = false;
      }
    }, (error) => {
      console.error('💳 Error en listener de lives:', error);
    });

    return () => unsubscribe();
  }, [isActive]);
};
