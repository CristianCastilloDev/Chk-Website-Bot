import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
    const { user } = useAuth();

    // Verificar si el usuario puede acceder a una página específica
    const canAccessPage = (page) => {
        if (!user) return false;

        // Dev tiene acceso a todo
        if (user.role === 'dev') return true;

        // Admin puede ver Sales, Gates, Herramientas, Settings, Pricing
        if (user.role === 'admin') {
            return ['sales', 'gates', 'herramientas', 'settings', 'pricing'].includes(page);
        }

        // Miembros regulares (role: 'miembro') solo ven Gates, Herramientas, Settings, Pricing
        return ['gates', 'herramientas', 'settings', 'pricing'].includes(page);
    };

    // Verificar si el usuario puede interactuar con Gates/Herramientas
    const canInteract = () => {
        if (!user) return false;

        // Admin y Dev tienen acceso ilimitado
        if (user.role === 'admin' || user.role === 'dev') return true;

        // Miembros regulares necesitan plan activo O créditos
        return hasActiveSubscription() || hasCredits();
    };

    // Verificar si tiene plan activo
    const hasActiveSubscription = () => {
        if (!user || !user.planExpiresAt) return false;

        const expirationDate = user.planExpiresAt.toDate ?
            user.planExpiresAt.toDate() :
            new Date(user.planExpiresAt);

        return expirationDate > new Date();
    };

    // Verificar si tiene créditos
    const hasCredits = () => {
        if (!user) return false;
        return (user.credits || 0) > 0;
    };

    // Verificar si es Dev
    const isDev = () => {
        return user?.role === 'dev';
    };

    // Verificar si es Admin o Dev
    const isAdmin = () => {
        return user?.role === 'admin' || user?.role === 'dev';
    };

    // Verificar si es miembro regular
    const isMiembro = () => {
        return user?.role === 'miembro';
    };

    return {
        canAccessPage,
        canInteract,
        hasActiveSubscription,
        hasCredits,
        isDev,
        isAdmin,
        isMiembro,
        user
    };
};
