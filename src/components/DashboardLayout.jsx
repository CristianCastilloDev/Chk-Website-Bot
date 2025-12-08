import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    ChevronDown,
    DollarSign,
    Shield,
    UserCircle,
    CreditCard,
    Lock,
    Wrench,
    ShoppingCart,
    Heart,
    Database,
    Search,
    Mail,
    MessageSquare,
    MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import './Dashboard.css';

const DashboardLayout = ({ children, currentPage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { canAccessPage, isDev, isAdmin } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        // 1. Overview (Solo admin y dev)
        {
            id: 'overview',
            label: 'Overview',
            icon: LayoutDashboard,
            path: '/dashboard',
            adminOnly: true
        },
        // 2. Analytics con BIN Analytics (con badge NEW)
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            submenu: [
                {
                    id: 'bin-analytics',
                    label: 'BIN Analytics',
                    icon: Search,
                    path: '/bin-analytics',
                    requiresPlan: true,
                    badge: 'NEW'
                }
            ]
        },
        // 3. Panel Admin
        {
            id: 'admin-panel',
            label: 'Panel Admin',
            icon: Settings,
            adminOnly: true,
            submenu: [
                {
                    id: 'users',
                    label: 'Users',
                    icon: Users,
                    path: '/dashboard/users',
                    adminOnly: true
                },
                {
                    id: 'sales',
                    label: 'Sales',
                    icon: ShoppingCart,
                    path: '/dashboard/sales',
                    adminOnly: true
                },
                {
                    id: 'gate-status',
                    label: 'Status Gates',
                    icon: Shield,
                    path: '/admin/gate-status',
                    devOnly: true
                },
                {
                    id: 'lives-admin',
                    label: 'Lives Global',
                    icon: Database,
                    path: '/admin/lives',
                    devOnly: true
                }
            ]
        },
        // 4. Gates
        {
            id: 'gates',
            label: 'Gates',
            icon: Shield,
            path: '/dashboard/gates'
        },
        // 5. Mis Lives
        {
            id: 'my-lives',
            label: 'Mis Lives',
            icon: Heart,
            path: '/gates/my-lives'
        },
        // 6. Herramientas
        {
            id: 'herramientas',
            label: 'Herramientas',
            icon: Wrench,
            submenu: [
                { id: 'email-temp', label: 'Email Temporal', icon: Mail, path: '/dashboard/herramientas/email' },
                { id: 'sms-temp', label: 'SMS Temporal', icon: MessageSquare, path: '/dashboard/herramientas/sms' },
                { id: 'fake-address', label: 'Fake Address', icon: MapPin, path: '/dashboard/herramientas/address' }
            ]
        },
        // 7. Precios
        {
            id: 'pricing',
            label: 'Precios',
            icon: DollarSign,
            path: '/pricing'
        },
        // 8. Configuraciones
        {
            id: 'settings',
            label: 'Configuraciones',
            icon: Settings,
            submenu: [
                { id: 'settings-profile', label: 'Profile', icon: UserCircle, path: '/dashboard/settings' },
                { id: 'settings-billing', label: 'Billing', icon: CreditCard, path: '/dashboard/settings/billing' },
                { id: 'settings-security', label: 'Security', icon: Lock, path: '/dashboard/settings/security' }
            ]
        }
    ];

    const toggleSubmenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    const handleLogout = () => {
        logout();
    };

    const handleNavigation = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const shouldShowMenuItem = (item) => {
        // Dev puede ver todo
        if (isDev()) return true;

        // Admin puede ver items de admin
        if (isAdmin() && item.adminOnly) return true;

        // Filtrar items solo para Dev
        if (item.devOnly) return false;

        // Filtrar items solo para Admin
        if (item.adminOnly && !isAdmin()) return false;

        // Filtrar items que requieren plan activo
        if (item.requiresPlan && !canAccessPage('bin-analytics')) return false;

        return true;
    };

    const isPathActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            {(sidebarOpen || window.innerWidth > 768) && (
                <aside className="sidebar glass">
                    <div className="sidebar-header">
                        <div className="logo gradient-text">
                            <LayoutDashboard size={28} />
                            <span>Dashboard</span>
                        </div>
                        <button
                            className="sidebar-close"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        {menuItems.filter(shouldShowMenuItem).map((item) => (
                            <div key={item.id}>
                                {item.submenu ? (
                                    // Parent menu with submenu
                                    <div className="nav-item-group">
                                        <button
                                            className={`nav-item ${expandedMenus[item.id] ? 'expanded' : ''}`}
                                            onClick={() => toggleSubmenu(item.id)}
                                        >
                                            <div className="nav-item-content">
                                                <item.icon size={20} />
                                                <span>{item.label}</span>
                                            </div>
                                            <div style={{
                                                transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s'
                                            }}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </button>

                                        {expandedMenus[item.id] && (
                                            <div className="submenu">
                                                {item.submenu.filter(shouldShowMenuItem).map((subItem) => (
                                                    <button
                                                        key={subItem.id}
                                                        className={`submenu-item ${isPathActive(subItem.path) ? 'active' : ''}`}
                                                        onClick={() => handleNavigation(subItem.path)}
                                                    >
                                                        <subItem.icon size={16} />
                                                        <span>{subItem.label}</span>
                                                        {subItem.badge && (
                                                            <span style={{
                                                                marginLeft: 'auto',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '12px',
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                {subItem.badge}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Regular menu item
                                    <button
                                        className={`nav-item ${isPathActive(item.path) ? 'active' : ''}`}
                                        onClick={() => handleNavigation(item.path)}
                                    >
                                        <div className="nav-item-content">
                                            <item.icon size={20} />
                                            <span>{item.label}</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        {/* Theme Toggle */}
                        <button
                            className="theme-toggle-sidebar"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun size={18} />
                                    <span>Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon size={18} />
                                    <span>Dark Mode</span>
                                </>
                            )}
                        </button>

                        {/* User Profile */}
                        <div className="user-profile-container">
                            <div className="user-profile">
                                <div
                                    className="user-avatar"
                                    style={{ background: user?.avatar?.color || '#6366f1' }}
                                >
                                    {user?.avatar?.initials || 'U'}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">{user?.name || 'User'}</div>
                                    <div className="user-role">{user?.role || 'client'}</div>
                                </div>
                            </div>
                            <button
                                className="logout-btn"
                                onClick={handleLogout}
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="dashboard-main">
                <header className="dashboard-header glass">
                    <button
                        className="menu-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="header-actions">
                        {/* Credits Display for non-admin users */}
                        {!isAdmin() && user?.credits !== undefined && (
                            <div className="header-credits">
                                <DollarSign size={18} className="credits-icon" />
                                <div className="credits-info">
                                    <span className="credits-amount">{user.credits}</span>
                                    <span className="credits-label">credits</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
