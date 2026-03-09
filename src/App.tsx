import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Truck, 
  Users, 
   BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Store,
  ShieldCheck,
  Key,
  Clock,
  AlertCircle,
  Play,
  Check,
  Info,
  Facebook,
  Instagram,
  MessageCircle,
  Smartphone,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AppSettings } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Categories from './components/Categories';
import Suppliers from './components/Suppliers';
import Customers from './components/Customers';
import Reports from './components/Reports';
import Configuration from './components/Configuration';
import SalesRecords from './components/SalesRecords';
import { useDataSync } from './hooks/useDataSync';

type Section = 'dashboard' | 'pos' | 'inventory' | 'categories' | 'suppliers' | 'customers' | 'reports' | 'settings' | 'sales_records';

function ContactModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>

          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                <Info size={32} />
              </div>
              <p className="text-lg font-medium italic text-gray-600 dark:text-gray-300 leading-relaxed">
                "Lo imposible no es un muro, sino una niebla que se disipa con cada paso que te atreves a dar; porque el futuro siempre guarda un camino para quienes se niegan a dejar de soñar."
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CREADO POR:</h3>
                <p className="text-sm font-bold text-gray-900 dark:text-white">LUIGUI CARLO ARATA V. - ANGELO RODRIGUEZ ALTEZ</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CONTÁCTANOS:</h3>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://www.facebook.com/profile.php?id=61584020012816" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 hover:scale-110 transition-transform"
                    title="Facebook"
                  >
                    <Facebook size={28} fill="currentColor" />
                  </a>
                  <a 
                    href="https://www.instagram.com/possolutiongroup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/50 hover:scale-110 transition-transform"
                    title="Instagram"
                  >
                    <Instagram size={28} />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@possolutiongroup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-400/50 hover:scale-110 transition-transform"
                    title="TikTok"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://wa.me/51921122456" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-200/50 hover:scale-110 transition-transform"
                    title="WhatsApp"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ActivationScreen({ onActivate, onStartDemo, settings, isDemoExpired, onShowContact }: { onActivate: (code: string) => void, onStartDemo: () => void, settings: AppSettings | null, isDemoExpired: boolean, onShowContact: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        onActivate(code);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-8"
      >
        <div className="text-center space-y-4 relative">
          <button 
            onClick={onShowContact}
            className="absolute -top-4 -right-4 p-3 bg-white shadow-lg rounded-2xl text-blue-600 hover:scale-110 transition-transform border border-gray-100"
            title="Información de Contacto"
          >
            <Info size={20} />
          </button>
          <div className="w-20 h-20 bg-green-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-green-200/50">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#1F2937]">Activación del Sistema</h2>
          <p className="text-gray-500 font-medium px-4">
            Bienvenido a <span className="text-green-600 font-bold">{settings?.business_name || 'Sistem Pos Basic'}</span>. Por favor, activa tu licencia para continuar.
          </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CLAVE DE PRODUCTO</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="password"
                placeholder="XXXX - XXXX - XXXX - XXXX"
                className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:border-green-500 focus:bg-white transition-all text-center font-mono tracking-widest uppercase placeholder:text-gray-300"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-200/50 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            ACTIVAR AHORA
          </button>
        </form>

        {!isDemoExpired && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-widest">O TAMBIÉN</span>
            </div>

            <button 
              onClick={onStartDemo}
              className="w-full py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} className="fill-current" />
              INICIAR MODO DEMO
            </button>
          </>
        )}

        <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#92400E]">
            <AlertCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">LIMITACIONES DEL MODO DEMO:</span>
          </div>
          <ul className="text-[10px] text-[#92400E] font-bold space-y-1 list-none opacity-80">
            <li>• Límite de 20 comprobantes de pago diarios.</li>
            <li>• El contador se reinicia cada 24 horas.</li>
            <li>• Disponible únicamente por 5 días desde el primer uso.</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<number | 'all'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isDemoStarted, setIsDemoStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useDataSync(fetchSettings);

  useEffect(() => {
    if (settings) {
      document.documentElement.classList.remove('dark');
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      }
    }
  }, [settings]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package, onClick: () => setInventoryCategoryFilter('all') },
    { id: 'categories', label: 'Categorías', icon: Tags },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'sales_records', label: 'Ventas', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory initialCategoryFilter={inventoryCategoryFilter} />;
      case 'categories': return (
        <Categories 
          onViewProducts={(categoryId) => {
            setInventoryCategoryFilter(categoryId);
            setActiveSection('inventory');
          }} 
        />
      );
      case 'suppliers': return <Suppliers />;
      case 'customers': return <Customers />;
      case 'sales_records': return <SalesRecords />;
      case 'reports': return <Reports />;
      case 'settings': return <Configuration />;
      default: return <Dashboard />;
    }
  };

  const getDemoSecondsLeft = () => {
    if (!settings?.installation_date) return 0;
    const installDate = new Date(settings.installation_date);
    const diffTime = currentTime.getTime() - installDate.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const FIVE_DAYS_SECONDS = 5 * 24 * 60 * 60;
    return Math.max(0, FIVE_DAYS_SECONDS - diffSeconds);
  };

  const formatTimeLeft = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const mins = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  const isDemoExpired = settings?.activation_status === 'demo' && getDemoSecondsLeft() <= 0;
  const isActivated = settings?.activation_status === 'activated';
  const showActivation = !isActivated && (!isDemoStarted || isDemoExpired);

  const handleStartDemo = async () => {
    try {
      // Reset installation date to now for testing purposes
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_date: new Date().toISOString() })
      });
      await fetchSettings();
      setIsDemoStarted(true);
    } catch (err) {
      console.error('Error starting demo:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showActivation) {
    return (
      <>
        <ActivationScreen 
          settings={settings}
          isDemoExpired={isDemoExpired}
          onActivate={() => fetchSettings()}
          onStartDemo={handleStartDemo}
          onShowContact={() => setIsContactModalOpen(true)}
        />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? '280px' : '260px') : (isMobile ? '0px' : '80px'),
          x: isMobile && !isSidebarOpen ? -280 : 0
        }}
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        <div className={cn(
          "p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800",
          !isSidebarOpen && !isMobile && "justify-center px-0"
        )}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden shrink-0">
            {settings?.business_logo ? (
              <img src={settings.business_logo} alt="Logo" className="w-full h-full object-cover bg-white" referrerPolicy="no-referrer" />
            ) : (
              <Store size={24} />
            )}
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-xl tracking-tight text-gray-900 dark:text-white truncate"
            >
              {settings?.business_name || 'Sistem Pos Basic'}
            </motion.span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as Section);
                if ((item as any).onClick) (item as any).onClick();
                if (isMobile) setIsSidebarOpen(false);
              }}
              title={!isSidebarOpen ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                !isSidebarOpen && !isMobile && "justify-center px-0",
                activeSection === item.id 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors shrink-0",
                activeSection === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
              )} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isSidebarOpen && activeSection === item.id && (
                <ChevronRight size={16} className="ml-auto opacity-70 shrink-0" />
              )}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
              {menuItems.find(m => m.id === activeSection)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!isActivated && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <Clock size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">
                    Demo: {formatTimeLeft(getDemoSecondsLeft())} restantes
                  </span>
                </div>
                <button 
                  onClick={() => setActiveSection('settings')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <ShieldCheck size={14} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">Activar Licencia</span>
                </button>
              </div>
            )}
            {!isActivated && (
              <div className="hidden sm:flex items-center gap-3">
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                  title="Información de Contacto"
                >
                  <Info size={20} />
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{settings?.user_name || 'Admin Usuario'}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{settings?.user_role || 'Administrador'}</span>
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded">Demo</span>
                  </div>
                </div>
              </div>
            )}
            {isActivated && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{settings?.user_name || 'Admin Usuario'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{settings?.user_role || 'Administrador'}</span>
              </div>
            )}
            <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img 
                src={settings?.user_avatar || "https://picsum.photos/seed/admin/100/100"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {renderSection()}
          </motion.div>
        </div>

        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      </main>
    </div>
  );
}
