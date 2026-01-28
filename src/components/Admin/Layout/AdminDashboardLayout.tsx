import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Bell,
  Shield,
  Globe,
  Palette,
  Share2,
  Phone,
  Link2,
  ChevronDown,
  Crown,
  Zap,
  Mail,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  children?: { name: string; path: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: Tag },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Contact Submissions', path: '/admin/contact-submissions', icon: Mail },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { 
    name: 'Settings', 
    path: '/admin/settings', 
    icon: Settings,
    children: [
      { name: 'Site Settings', path: '/admin/settings/site', icon: Globe },
      { name: 'Theme', path: '/admin/settings/theme', icon: Palette },
      { name: 'Dashboard', path: '/admin/settings/dashboard', icon: Sparkles },
      { name: 'Social Media', path: '/admin/settings/social-media', icon: Share2 },
      { name: 'Contact Info', path: '/admin/settings/contact', icon: Phone },
      { name: 'Footer Links', path: '/admin/settings/footer-links', icon: Link2 }
    ]
  }
];

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { settings } = useAdminDashboardSettings();

  useEffect(() => {
    setSidebarOpen(false);
    // Auto-expand settings if on settings page
    if (location.pathname.includes('/admin/settings')) {
      setExpandedItems(['/admin/settings']);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'A';
  };

  // Get backdrop blur class
  const getBackdropBlurClass = () => {
    switch (settings.backdrop_blur) {
      case 'sm': return 'backdrop-blur-sm';
      case 'md': return 'backdrop-blur-md';
      case 'lg': return 'backdrop-blur-lg';
      case 'xl': return 'backdrop-blur-xl';
      default: return 'backdrop-blur-xl';
    }
  };

  return (
    <div 
      className="min-h-screen"
      data-admin-dashboard="true"
      style={{
        background: `linear-gradient(to bottom right, ${settings.background_gradient_from}, ${settings.background_gradient_via}, ${settings.background_gradient_to})`
      }}
    >
      {/* Mobile Header */}
      <header 
        data-admin-header="true"
        className={`lg:hidden sticky top-0 z-40 ${getBackdropBlurClass()} border-b border-white/10`}
        style={{ backgroundColor: settings.header_background }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Go to home"
          >
            <Home className="w-5 h-5 text-white" />
          </Link>

          <div className="flex items-center gap-2">
              {settings.dashboard_logo_url ? (
                <img 
                  src={settings.dashboard_logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`
                  }}
                >
                  <Crown className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-lg font-bold text-white">{settings.dashboard_name}</span>
            </div>

            <div
            className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white/20"
            style={{
              background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`
            }}
          >
            <span className="text-white text-sm font-semibold">{getInitials()}</span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-admin-sidebar="true"
        className={`fixed top-0 left-0 z-50 h-full w-72 ${getBackdropBlurClass()} shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 border-r border-white/10 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: settings.sidebar_background }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            {settings.dashboard_logo_url ? (
              <img 
                src={settings.dashboard_logo_url} 
                alt="Logo" 
                className="w-10 h-10 rounded-xl object-contain"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`,
                  boxShadow: `0 10px 15px -3px ${settings.primary_color_to}20`
                }}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
            )}
            <span 
              className="text-xl font-bold bg-clip-text text-transparent"
              style={{
                background: `linear-gradient(to right, ${settings.primary_color_from}, ${settings.primary_color_to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {settings.dashboard_name}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Admin Profile Card */}
        <div className="p-4">
          <div 
            className="rounded-2xl p-4 border"
            style={{
              background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`,
              borderColor: `${settings.primary_color_to}30`
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center ring-2 ring-white/20"
                style={{
                  background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`
                }}
              >
                <span className="text-lg font-bold text-white">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.fullName || 'Admin'}
                </p>
                <p 
                  className="text-sm truncate"
                  style={{ color: settings.primary_color_from }}
                >
                  Super Admin
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: `${settings.primary_color_to}20`,
                  color: settings.primary_color_to,
                  borderColor: `${settings.primary_color_to}30`,
                  border: `1px solid ${settings.primary_color_to}30`
                }}
              >
                <Shield className="w-3 h-3" /> Full Access
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.path);
            
            return (
              <div key={item.path}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active ? 'text-white border' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                    style={active ? {
                      background: `linear-gradient(to right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`,
                      borderColor: `${settings.primary_color_to}30`
                    } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        className="w-5 h-5 transition-colors"
                        style={active ? { color: settings.primary_color_from } : {}}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active ? 'text-white border' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                    style={active ? {
                      background: `linear-gradient(to right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`,
                      borderColor: `${settings.primary_color_to}30`
                    } : {}}
                  >
                    <Icon 
                      className="w-5 h-5 transition-colors"
                      style={active ? { color: settings.primary_color_from } : {}}
                    />
                    <span className="font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span 
                        className="ml-auto text-white text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: settings.primary_color_to }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight 
                      className={`w-4 h-4 ml-auto transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
                      style={active ? { color: settings.primary_color_from } : {}}
                    />
                  </Link>
                )}
                
                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            childActive ? '' : 'text-white/50 hover:bg-white/5 hover:text-white'
                          }`}
                          style={childActive ? {
                            backgroundColor: `${settings.primary_color_to}20`,
                            color: settings.primary_color_from
                          } : {}}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span className="text-sm">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-3">
          <div 
            className="rounded-xl p-4 border"
            style={{
              background: `linear-gradient(to bottom right, ${settings.secondary_color_from}20, ${settings.secondary_color_to}20)`,
              borderColor: `${settings.secondary_color_to}30`
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${settings.secondary_color_to}30`
                }}
              >
                <Zap 
                  className="w-5 h-5"
                  style={{ color: settings.secondary_color_from }}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Quick Actions</p>
                <p className="text-xs text-white/60">Add product, user, etc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Desktop Header */}
        <header 
          data-admin-header="true"
          className={`hidden lg:block sticky top-0 z-30 ${getBackdropBlurClass()} border-b border-white/10`}
          style={{ backgroundColor: settings.header_background }}
        >
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <nav className="flex items-center gap-2 text-sm text-white/50 mb-1">
                <Link 
                  to="/admin" 
                  className="transition-colors"
                  style={{ '--hover-color': settings.primary_color_from } as React.CSSProperties & { '--hover-color': string }}
                  onMouseEnter={(e) => e.currentTarget.style.color = settings.primary_color_from}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  Admin
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">{title}</span>
              </nav>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-white/60 mt-1">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-white/60" />
                <span 
                  className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: settings.primary_color_from }}
                ></span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Store</span>
              </Link>
              
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.fullName || 'Admin'}</p>
                  <p 
                    className="text-xs"
                    style={{ color: settings.primary_color_from }}
                  >
                    Super Admin
                  </p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white/20"
                  style={{
                    background: `linear-gradient(to bottom right, ${settings.primary_color_from}, ${settings.primary_color_to})`
                  }}
                >
                  <span className="text-white text-sm font-semibold">{getInitials()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Title */}
        <div 
          className="lg:hidden px-4 py-4 backdrop-blur-sm border-b border-white/10"
          style={{ backgroundColor: settings.header_background }}
        >
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-white/60 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;

