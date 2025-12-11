import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';
import { createNotification } from '../services/db';
import { useOrderNotifications, useUserNotifications, useLiveNotifications } from '../hooks/useRealtimeNotifications';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAdmin, isDev } = useAuth();
  const { showInfo, showSuccess, showWarning } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Activar listeners solo para admins y devs
  const shouldListenToEvents = (isAdmin() || isDev());
  
  // Listeners en tiempo real para eventos
  useOrderNotifications(shouldListenToEvents);
  useUserNotifications(shouldListenToEvents);
  useLiveNotifications(shouldListenToEvents);

  // Sonidos de notificación por tipo
  const playNotificationSound = useCallback((type = 'info') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar sonido según el tipo de notificación
      switch (type) {
        case 'order':
          // Sonido de orden: Tono ascendente (dinero/compra)
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.15);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'user':
          // Sonido de usuario: Doble beep amigable
          oscillator.frequency.value = 700;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          
          // Segundo beep
          setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 850;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.25, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.1);
          }, 120);
          break;

        case 'live':
          // Sonido de live: Tono brillante con vibrato
          oscillator.frequency.value = 950;
          oscillator.type = 'triangle';
          
          // Crear vibrato
          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();
          lfo.frequency.value = 6;
          lfoGain.gain.value = 20;
          lfo.connect(lfoGain);
          lfoGain.connect(oscillator.frequency);
          
          gainNode.gain.setValueAtTime(0.28, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          lfo.start(audioContext.currentTime);
          oscillator.start(audioContext.currentTime);
          lfo.stop(audioContext.currentTime + 0.4);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;

        case 'system':
        default:
          // Sonido de sistema: Tono neutral simple
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Listener en tiempo real para notificaciones del usuario
  useEffect(() => {
    if (!user?.id || (!isAdmin() && !isDev())) {
      console.log('🔔 Notification listener: INACTIVE - User:', user?.id, 'isAdmin:', isAdmin(), 'isDev:', isDev());
      return;
    }

    console.log('🔔 Notification listener: ACTIVE for user:', user.id);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔔 Notification snapshot received, total docs:', snapshot.size);
      
      const notifs = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        notifs.push(data);
        if (!data.read) unread++;
      });

      // Detectar nuevas notificaciones
      snapshot.docChanges().forEach((change) => {
        console.log('🔔 Change detected:', change.type, 'Current notifications length:', notifications.length);
        
        if (change.type === 'added' && notifications.length > 0) {
          const newNotif = { id: change.doc.id, ...change.doc.data() };
          console.log('🔔 NEW NOTIFICATION:', newNotif);
          
          // Mostrar toast solo si no es la carga inicial
          showInfo({
            title: newNotif.title,
            description: newNotif.message
          });
          
          // Reproducir sonido según el tipo de notificación
          console.log('🔔 Playing sound for type:', newNotif.type);
          playNotificationSound(newNotif.type);
        }
      });

      setNotifications(notifs);
      setUnreadCount(unread);
      console.log('🔔 Updated notifications count:', notifs.length, 'Unread:', unread);
    }, (error) => {
      console.error('🔔 Error in notification listener:', error);
    });

    return () => {
      console.log('🔔 Notification listener: CLEANUP');
      unsubscribe();
    };
  }, [user, isAdmin, isDev, showInfo, playNotificationSound, notifications.length]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notifRef);
      showSuccess('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showWarning('Error al eliminar notificación');
    }
  }, [showSuccess, showWarning]);

  // Eliminar todas las notificaciones
  const deleteAllNotifications = useCallback(async () => {
    try {
      const deletePromises = notifications.map(notif => 
        deleteDoc(doc(db, 'notifications', notif.id))
      );
      await Promise.all(deletePromises);
      showSuccess('Todas las notificaciones eliminadas');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      showWarning('Error al eliminar notificaciones');
    }
  }, [notifications, showSuccess, showWarning]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const updatePromises = notifications
        .filter(notif => !notif.read)
        .map(notif => updateDoc(doc(db, 'notifications', notif.id), { read: true }));
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
