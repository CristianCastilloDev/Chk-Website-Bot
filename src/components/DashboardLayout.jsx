import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    BarChart3,
    Users,
    ShoppingCart,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Shield,
    UserCircle,
    Lock,
    Wrench,
    Heart,
    Database,
    Search,
    Mail,
    MessageSquare,
    MapPin,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import NotificationCenter from './NotificationCenter';
import './Dashboard.css';

const DashboardLayout = ({ children, currentPage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { canAccessPage, isDev, isAdmin } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        // 1. Dashboard (visible to all users)
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            path: '/dashboard'
        },
        // 2. BIN Analytics (no submenu, top-level with badge)
        {
            id: 'bin-analytics',
            label: 'BIN Analytics',
            icon: Search,
            path: '/bin-analytics',
            requiresPlan: true,
            badge: 'NEW'
        },
        // 3. Gates
        {
            id: 'gates',
            label: 'Gates',
            icon: Shield,
            path: '/dashboard/gates'
        },
        // 4. Mis Lives
        {
            id: 'my-lives',
            label: 'Mis Lives',
            icon: Heart,
            path: '/gates/my-lives'
        },
        // 5. Email Temporal
        {
            id: 'email-temp',
            label: 'Email Temporal',
            icon: Mail,
            path: '/dashboard/herramientas/email'
        },
        // 6. SMS
        {
            id: 'sms-temp',
            label: 'SMS',
            icon: MessageSquare,
            path: '/dashboard/herramientas/sms'
        },
        // 7. Fake Address
        {
            id: 'fake-address',
            label: 'Fake Address',
            icon: MapPin,
            path: '/dashboard/herramientas/address'
        },
        // 8. Admin Section - Users
        {
            id: 'users',
            label: 'Usuarios',
            icon: Users,
            path: '/dashboard/users',
            adminOnly: true
        },
        // 7. Admin Section - Orders
        {
            id: 'orders',
            label: 'Órdenes',
            icon: ShoppingCart,
            path: '/dashboard/orders',
            adminOnly: true
        },
        // 8. Earnings (for admins and devs)
        {
            id: 'earnings',
            label: 'Ganancias',
            icon: DollarSign,
            path: '/dashboard/earnings',
            showForRoles: ['admin', 'dev'] // Show for both admin and dev
        },
        // 8. Admin Section - Gate Status
        {
            id: 'gate-status',
            label: 'Status Gates',
            icon: Shield,
            path: '/admin/gate-status',
            adminOnly: true
        },
        // 9. Dev Only - Lives Global
        {
            id: 'lives-admin',
            label: 'Lives Global',
            icon: Database,
            path: '/admin/lives',
            devOnly: true
        },
        // 10. Pricing (for all users)
        {
            id: 'pricing',
            label: 'Precios',
            icon: DollarSign,
            path: '/pricing'
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
        // Only close sidebar on mobile
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
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

    // Calculate remaining days from plan expiration
    const getRemainingDays = (planExpiresAt) => {
        if (!planExpiresAt) return 0;
        const expirationDate = planExpiresAt.toDate ? planExpiresAt.toDate() : new Date(planExpiresAt);
        const now = new Date();
        const diffTime = expirationDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Get badge style based on value
    const getBadgeStyle = (value) => ({
        background: value === 0
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(16, 185, 129, 0.15)',
        border: value === 0
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid rgba(16, 185, 129, 0.3)',
        color: value === 0 ? '#ef4444' : '#10b981'
    });


    return (
        <div className="dashboard-layout">
            {/* Sidebar Toggle Button - Floating on edge */}
            {window.innerWidth > 768 && (
                <button
                    className="sidebar-toggle-floating"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            )}

            {/* Sidebar */}
            {(sidebarOpen || window.innerWidth > 768) && (
                <aside className={`sidebar glass ${sidebarCollapsed ? 'collapsed' : ''} `}>
                    <div className="sidebar-header">
                        <div className="logo">
                            <Home size={28} />
                            {!sidebarCollapsed && <span>Dashboard</span>}
                        </div>
                        <button
                            className="sidebar-close"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        {menuItems.filter(shouldShowMenuItem).map((item, index) => {
                            // Add divider before Email Temporal and Users
                            const showDividerBefore = item.id === 'email-temp' || item.id === 'users';

                            return (
                                <div key={item.id}>
                                    {showDividerBefore && (
                                        <div className="menu-divider"></div>
                                    )}

                                    {item.submenu ? (
                                        // Parent menu with submenu
                                        <div className="nav-item-group">
                                            <button
                                                className={`nav - item ${expandedMenus[item.id] ? 'expanded' : ''} `}
                                                onClick={() => toggleSubmenu(item.id)}
                                            >
                                                <div className="nav-item-content">
                                                    <item.icon size={20} />
                                                    {!sidebarCollapsed && <span>{item.label}</span>}
                                                </div>
                                                {!sidebarCollapsed && (
                                                    <div style={{
                                                        transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s'
                                                    }}>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                )}
                                            </button>

                                            {expandedMenus[item.id] && (
                                                <div className="submenu">
                                                    {item.submenu.filter(shouldShowMenuItem).map((subItem) => (
                                                        <button
                                                            key={subItem.id}
                                                            className={`submenu - item ${isPathActive(subItem.path) ? 'active' : ''} `}
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
                                            className={`nav - item ${isPathActive(item.path) ? 'active' : ''} `}
                                            onClick={() => handleNavigation(item.path)}
                                        >
                                            <div className="nav-item-content">
                                                <item.icon size={20} />
                                                {!sidebarCollapsed && <span>{item.label}</span>}
                                            </div>
                                            {!sidebarCollapsed && item.badge && (
                                                <span style={{
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="sidebar-footer">
                        {/* Upgrade Card
                        <div className="upgrade-card">
                            <div className="upgrade-illustration">
                                📊
                            </div>
                            <div className="upgrade-title">
                                Upgrade for free
                            </div>
                            <button
                                className="upgrade-button"
                                onClick={() => handleNavigation('/pricing')}
                            >
                                Upgrade for free
                            </button>
                        </div> */}

                        {/* User Profile */}
                        <div className="user-profile-container">
                            <div className="user-profile">
                                <div
                                    className="user-avatar"
                                    style={{
                                        background: user?.photoURL ? 'transparent' : (user?.avatar?.color || '#6366f1'),
                                        backgroundImage: user?.photoURL ? `url(${user.photoURL})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {!user?.photoURL && (user?.avatar?.initials || user?.name?.charAt(0) || 'U')}
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
            )
            }

            {
                sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )
            }

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
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Settings Icon */}
                        <button
                            onClick={() => navigate('/dashboard/settings')}
                            title="Settings"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <Settings size={20} />
                        </button>

                        {/* Notification Center - Only for admins and devs */}
                        {(isAdmin() || isDev()) && <NotificationCenter />}

                        {/* User Status Badges */}
                        {user && (
                            <div className="header-badges">
                                {(() => {
                                    try {
                                        const userIsAdmin = user?.role === 'admin' || user?.role === 'dev';

                                        if (userIsAdmin) {
                                            // Unlimited badge for admin/dev
                                            return (
                                                <div
                                                    className="status-badge"
                                                    style={{
                                                        background: 'rgba(249, 115, 22, 0.15)',
                                                        border: '1px solid rgba(249, 115, 22, 0.3)',
                                                        color: '#f97316',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <Shield size={16} />
                                                    <span>Unlimited</span>
                                                </div>
                                            );
                                        }

                                        // Plan and Credits badges for regular users
                                        const remainingDays = getRemainingDays(user?.planExpiresAt);
                                        const credits = user?.credits ?? 0;

                                        // Determine plan name based on plan field or active subscription
                                        let planName = 'Free';
                                        if (user?.plan && user.plan !== 'free') {
                                            // User has explicit plan set
                                            planName = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
                                        } else if (remainingDays > 0) {
                                            // User has active days but no plan field - assume Premium
                                            planName = 'Premium';
                                        }

                                        return (
                                            <>
                                                {/* Plan & Days Badge */}
                                                <div
                                                    className="status-badge"
                                                    style={{
                                                        ...getBadgeStyle(remainingDays),
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <CreditCard size={16} />
                                                    <span>{planName} - {remainingDays} Days</span>
                                                </div>

                                                {/* Credits Badge */}
                                                <div
                                                    className="status-badge"
                                                    style={{
                                                        ...getBadgeStyle(credits),
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <DollarSign size={16} />
                                                    <span>{credits} Credits</span>
                                                </div>
                                            </>
                                        );
                                    } catch (error) {
                                        console.error('Error rendering badges:', error);
                                        return null;
                                    }
                                })()}
                            </div>
                        )}
                    </div>
                </header>

                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div >
    );
};

export default DashboardLayout;
