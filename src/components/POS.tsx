import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft,
  User,
  Ticket,
  X,
  ShoppingCart,
  Store,
  UserPlus,
  ChevronDown,
  Check,
  Download,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, AppSettings, Customer } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useDataSync } from '../hooks/useDataSync';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    business_name: 'Cargando...',
    address: '',
    phone: '',
    email: '',
    currency: 'S/',
    ticket_message: '',
    theme_mode: 'light',
    primary_color: '#22c55e',
    ticket_size: '80mm',
    ticket_font_family: 'monospace',
    ticket_font_bold: false,
    ticket_font_italic: false
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [isQuotation, setIsQuotation] = useState(false);
  const [lastQuotationId, setLastQuotationId] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Serial selection states
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedProductForSerial, setSelectedProductForSerial] = useState<Product | null>(null);
  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [serialSearchQuery, setSerialSearchQuery] = useState('');

  // Customer states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', dni: '', phone: '' });
  const [warranty, setWarranty] = useState('');

  // Multiple payment methods state
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);

  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTicket && (lastSaleId || lastQuotationId)) {
      const saleIdStr = isQuotation 
        ? `#C${String(lastQuotationId).padStart(6, '0')}` 
        : `#V${String(lastSaleId).padStart(6, '0')}`;
      
      QRCode.toDataURL(saleIdStr, { margin: 1, width: 256 })
        .then(setQrDataUrl)
        .catch(err => console.error('Error generating QR code:', err));
    } else {
      setQrDataUrl('');
    }
  }, [showTicket, lastSaleId, lastQuotationId, isQuotation]);

  const fetchData = () => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/customers').then(res => res.json())
    ]).then(([productsData, categoriesData, settingsData, customersData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      setSettings(settingsData);
      setCustomers(customersData);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useDataSync(fetchData);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setShowTicket(false);
        setIsAddingCustomer(false);
        setShowCustomerList(false);
      }
      if (e.key === 'Delete') {
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        if (!isInput) {
          if (cart.length > 0 && window.confirm('¿Limpiar todo el carrito?')) {
            setCart([]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  useEffect(() => {
    const searchBySerial = async () => {
      if (search.length >= 4) { // Minimum length to avoid too many requests
        try {
          // First check if it's an exact product code
          const productByCode = products.find(p => p.code.toLowerCase() === search.toLowerCase());
          if (productByCode) {
            addToCart(productByCode);
            setSearch('');
            return;
          }

          // Then check if it's a serial number
          const res = await fetch(`/api/products/by-serial/${search}`);
          if (res.ok) {
            const product = await res.json();
            // If it's a serial search, we should add it with that specific serial
            if (product.has_serials) {
              addSerializedProductToCart(product, [search]);
            } else {
              addToCart(product);
            }
            setSearch(''); // Clear search after finding
          }
        } catch (e) {
          // Ignore errors, might just be a normal search
        }
      }
    };
    searchBySerial();
  }, [search, products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const addToCart = async (product: Product) => {
    if (product.stock <= 0) return;

    if (product.has_serials) {
      // Fetch available serials
      try {
        const res = await fetch(`/api/products/${product.id}/items`);
        const items = await res.json();
        const available = items.filter((i: any) => i.status === 'available');
        
        if (available.length === 0) {
          alert('No hay números de serie disponibles para este producto');
          return;
        }

        setSelectedProductForSerial(product);
        setAvailableSerials(available);
        setSelectedSerials([]);
        setSerialSearchQuery('');
        setIsSerialModalOpen(true);
      } catch (error) {
        console.error('Error fetching serials:', error);
      }
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addSerializedProductToCart = (product: Product, serials: string[]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Merge serials, avoiding duplicates
        const currentSerials = existing.selectedSerials || [];
        const newSerials = Array.from(new Set([...currentSerials, ...serials]));
        
        // Check stock (available serials)
        if (newSerials.length > product.stock) {
          alert('No hay suficiente stock disponible');
          return prev;
        }

        return prev.map(item => item.id === product.id ? { 
          ...item, 
          quantity: newSerials.length,
          selectedSerials: newSerials
        } : item);
      }
      return [...prev, { ...product, quantity: serials.length, selectedSerials: serials }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);
  const taxRate = 0;
  const tax = 0;
  const total = subtotal;

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = Math.max(0, total - totalPaid);
  const change = totalPaid > total ? totalPaid - total : 0;

  const handleCheckout = async () => {
    try {
      const saleData = {
        items: cart.map(item => ({ 
          id: item.id, 
          quantity: item.quantity, 
          price: item.sale_price,
          serial_numbers: item.selectedSerials || []
        })),
        total,
        subtotal,
        tax,
        payment_method: JSON.stringify(payments),
        customer_id: selectedCustomer?.id || null,
        warranty: warranty
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      const data = await res.json();

      if (res.ok) {
        setLastSaleId(data.id);
        setIsQuotation(false);
        setIsCheckoutOpen(false);
        setShowTicket(true);
        // Refresh products to update stock
        fetch('/api/products').then(res => res.json()).then(setProducts);
      } else {
        alert(data.error || 'Error al procesar la venta');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error de conexión al procesar la venta');
    }
  };

  const handleQuotation = async () => {
    const quotationData = {
      items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.sale_price })),
      total,
      subtotal,
      tax,
      customer_id: selectedCustomer?.id || null
    };

    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotationData)
    });

    if (res.ok) {
      const data = await res.json();
      setLastQuotationId(data.id);
      setIsQuotation(true);
      setIsCheckoutOpen(false);
      setShowTicket(true);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.dni) {
      alert('Por favor, ingrese al menos el Nombre y el DNI');
      return;
    }
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });

      const data = await res.json();

      if (res.ok) {
        const created = { ...newCustomer, id: data.id } as Customer;
        setCustomers(prev => [...prev, created]);
        setSelectedCustomer(created);
        setIsAddingCustomer(false);
        setNewCustomer({ first_name: '', last_name: '', dni: '', phone: '' });
        setCustomerSearch(created.dni);
      } else {
        alert(data.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error de conexión al crear cliente');
    }
  };

  const handlePrint = async () => {
    const printContent = ticketRef.current;
    if (!printContent) return;

    const saleIdStr = isQuotation 
      ? `#C${String(lastQuotationId).padStart(6, '0')}` 
      : `#V${String(lastSaleId).padStart(6, '0')}`;
    
    const windowPrint = window.open('', '', 'left=0,top=0,width=900,height=1000,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    const isA4 = isQuotation || settings?.ticket_size === 'A4';
    const ticketSize = settings?.ticket_size || '80mm';
    const bodyWidth = isA4 ? '100%' : (ticketSize === '80mm' ? '72mm' : '50mm');
    const title = isQuotation ? 'Cotización' : 'Ticket de Venta';
    const primaryColor = settings?.primary_color || '#22c55e';
    const ticketFontFamily = settings?.ticket_font_family === 'courier' ? "'Courier New', Courier, monospace" : (settings?.ticket_font_family || "'Courier New', Courier, monospace");
    const ticketFontWeight = settings?.ticket_font_bold ? 'bold' : 'normal';
    const ticketFontStyle = settings?.ticket_font_italic ? 'italic' : 'normal';

    windowPrint.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { 
              size: ${isA4 ? 'A4' : `${ticketSize} auto`}; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #fff;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
            }
            img {
              width: 200px;
              height: 200px;
              display: block;
              margin: 0 auto;
            }
            .label {
              font-family: sans-serif;
              font-size: 12px;
              font-weight: bold;
              margin-top: 10px;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrDataUrl ? `<img src="${qrDataUrl}" />` : ''}
            <div class="label">VALIDAR COMPROBANTE</div>
            <div style="font-family: sans-serif; font-size: 10px; margin-top: 5px; color: #666;">
              ${saleIdStr}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = settings?.primary_color || '#22c55e';
    const currency = settings?.currency || 'S/';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.business_name || 'MI NEGOCIO', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.address || '', 15, 28);
    doc.text(`Telf: ${settings?.phone || ''} | Email: ${settings?.email || ''}`, 15, 33);

    doc.setFontSize(28);
    doc.text('COTIZACIÓN', 140, 22);
    doc.setFontSize(12);
    doc.text(`#C${String(lastQuotationId).padStart(6, '0')}`, 140, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 35);

    // Client Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 15, 55);
    doc.line(15, 57, 100, 57);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Público General'}`, 15, 65);
    if (selectedCustomer?.dni) doc.text(`DNI/RUC: ${selectedCustomer.dni}`, 15, 70);
    if (selectedCustomer?.phone) doc.text(`Teléfono: ${selectedCustomer.phone}`, 15, 75);
    if (selectedCustomer?.address) doc.text(`Dirección: ${selectedCustomer.address}`, 15, 80);

    // Conditions
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIONES COMERCIALES', 120, 55);
    doc.line(120, 57, 195, 57);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Validez: 7 Días Calendario`, 120, 65);
    doc.text(`Vencimiento: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 120, 70);
    doc.text(`Moneda: ${currency === 'S/' ? 'Soles (PEN)' : currency}`, 120, 75);
    doc.text(`Vendedor: ${settings?.user_name || 'Admin'}`, 120, 80);

    // Table
    const tableData = cart.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      formatCurrency(item.sale_price),
      formatCurrency(item.quantity * item.sale_price)
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['N°', 'Descripción del Producto', 'Cant.', 'P. Unit', 'Total']],
      body: tableData,
      headStyles: { fillColor: primaryColor as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, finalY);
    doc.text(formatCurrency(subtotal), 195, finalY, { align: 'right' });
    
    doc.text('IGV (0%):', 140, finalY + 7);
    doc.text(formatCurrency(0), 195, finalY + 7, { align: 'right' });

    doc.setFillColor(0, 0, 0);
    doc.rect(135, finalY + 12, 65, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('TOTAL NETO:', 140, finalY + 20);
    doc.text(formatCurrency(total), 195, finalY + 20, { align: 'right' });

    // Bank Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('CUENTAS BANCARIAS', 15, finalY);
    doc.setFont('helvetica', 'normal');
    let bankY = finalY + 7;
    if (settings?.bank_bcp) { doc.text(`BCP: ${settings.bank_bcp}`, 15, bankY); bankY += 5; }
    if (settings?.bank_cci) { doc.text(`CCI: ${settings.bank_cci}`, 15, bankY); bankY += 5; }
    if (settings?.bank_yape_plin) { doc.text(`Yape/Plin: ${settings.bank_yape_plin}`, 15, bankY); bankY += 5; }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Esta es una cotización informativa generada por SISTEMA POS BASIC.', 105, 285, { align: 'center' });

    doc.save(`Cotizacion_${String(lastQuotationId).padStart(6, '0')}.pdf`);
  };

  const resetSale = () => {
    if (!isQuotation) {
      setCart([]);
      setPayments([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setWarranty('');
    }
    setShowTicket(false);
    setReceivedAmount('');
    setLastSaleId(null);
    setLastQuotationId(null);
    setIsQuotation(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)]">
      {/* Products Section */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 rounded-2xl border shadow-sm overflow-hidden",
        settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      )}>
        <div className={cn(
          "p-4 border-b space-y-4",
          settings?.theme_mode === 'dark' ? "border-gray-800" : "border-gray-100"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nombre o código..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all",
                settings?.theme_mode === 'dark' ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-900"
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div 
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <button 
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                selectedCategory === 'all' 
                  ? "bg-primary text-white" 
                  : settings?.theme_mode === 'dark'
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                  selectedCategory === cat.id 
                    ? "bg-primary text-white" 
                    : settings?.theme_mode === 'dark'
                      ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={cn(
                  "flex flex-col text-left border rounded-2xl overflow-hidden hover:shadow-xl transition-all group relative",
                  settings?.theme_mode === 'dark' 
                    ? "bg-gray-900 border-gray-800 hover:border-primary" 
                    : "bg-white border-gray-200 hover:border-primary",
                  product.stock <= 0 && "opacity-60 cursor-not-allowed grayscale"
                )}
              >
                <div className={cn(
                  "aspect-[4/3] relative overflow-hidden border-b",
                  settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"
                )}>
                  <img 
                    src={product.image || `https://picsum.photos/seed/${product.id}/400/300`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[10px] font-black text-gray-900 px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                      {product.code}
                    </span>
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                      ¡ÚLTIMOS!
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white font-black text-xs uppercase tracking-widest border-2 border-white px-3 py-1 rounded-lg">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h4 className={cn(
                      "text-sm font-black leading-tight line-clamp-2 group-hover:text-primary transition-colors",
                      settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{product.brand}</p>
                  </div>
                  <div className="flex items-end justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Precio</span>
                      <span className="text-lg font-black text-primary leading-none">
                        {formatCurrency(product.sale_price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-gray-400 font-black uppercase">Stock</span>
                      <span className={cn(
                        "text-xs font-black",
                        product.stock <= 5 ? "text-orange-500" : settings?.theme_mode === 'dark' ? "text-gray-300" : "text-gray-900"
                      )}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Hover Action Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className={cn(
        "w-full lg:w-96 flex flex-col rounded-2xl border shadow-sm overflow-hidden",
        settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      )}>
        <div className={cn(
          "p-4 border-b flex items-center justify-between",
          settings?.theme_mode === 'dark' ? "border-gray-800" : "border-gray-100"
        )}>
          <h3 className={cn(
            "font-bold flex items-center gap-2",
            settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
          )}>
            <ShoppingCart size={20} className="text-primary" />
            Carrito
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCart([])}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
              title="Vaciar Carrito"
            >
              <Trash2 size={16} />
            </button>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} items
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm font-medium">El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                  <img src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-bold truncate",
                    settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
                  )}>{item.name}</h4>
                  <p className="text-xs text-primary font-bold">{formatCurrency(item.sale_price)}</p>
                  
                  {item.selectedSerials && item.selectedSerials.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedSerials.map((sn: string) => (
                        <span key={sn} className="text-[8px] bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono dark:text-gray-400">{sn}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {!item.has_serials ? (
                        <>
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors dark:text-gray-300"><Minus size={12} /></button>
                          <span className="text-xs font-bold w-6 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors dark:text-gray-300"><Plus size={12} /></button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-2">
                          <ShieldCheck size={12} className="text-primary" />
                          <span className="text-xs font-bold dark:text-white">{item.quantity}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={cn(
          "p-4 border-t space-y-3",
          settings?.theme_mode === 'dark' ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"
        )}>
          <div className={cn(
            "flex justify-between text-lg pt-2 border-t",
            settings?.theme_mode === 'dark' ? "border-gray-700" : "border-gray-200"
          )}>
            <span className={cn(
              "font-bold",
              settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
            )}>Total</span>
            <span className="font-black text-primary">{formatCurrency(total)}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            Pagar Ahora
            <ArrowRightLeft size={20} />
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden",
                settings?.theme_mode === 'dark' ? "bg-gray-900" : "bg-white"
              )}
            >
              <div className={cn(
                "p-6 border-b flex items-center justify-between",
                settings?.theme_mode === 'dark' ? "border-gray-800" : "border-gray-100"
              )}>
                <h3 className={cn(
                  "text-xl font-bold",
                  settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
                )}>Finalizar Venta</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400"><X size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Summary & Customer */}
                  <div className="space-y-6">
                    <div className={cn(
                      "text-center p-4 rounded-2xl border shadow-sm",
                      settings?.theme_mode === 'dark' ? "bg-primary/10 border-primary/20" : "bg-green-50 border-green-100"
                    )}>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        settings?.theme_mode === 'dark' ? "text-primary" : "text-green-600"
                      )}>Total a Pagar</p>
                      <h2 className={cn(
                        "text-3xl font-black mt-1",
                        settings?.theme_mode === 'dark' ? "text-white" : "text-green-700"
                      )}>{formatCurrency(total)}</h2>
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border space-y-3",
                      settings?.theme_mode === 'dark' ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Seleccionar Cliente por DNI</label>
                        <button 
                          onClick={() => {
                            const nextState = !isAddingCustomer;
                            setIsAddingCustomer(nextState);
                            if (nextState) {
                              setNewCustomer({ first_name: '', last_name: '', dni: customerSearch, phone: '' });
                            }
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          {isAddingCustomer ? 'Cancelar' : (
                            <>
                              <UserPlus size={14} />
                              Nuevo Cliente
                            </>
                          )}
                        </button>
                      </div>

                      {isAddingCustomer ? (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-xl border space-y-3",
                            settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                          )}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="DNI" 
                              className={cn(
                                "w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary",
                                settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
                              )}
                              value={newCustomer.dni}
                              onChange={(e) => setNewCustomer({...newCustomer, dni: e.target.value})}
                            />
                            <input 
                              type="text" 
                              placeholder="Teléfono" 
                              className={cn(
                                "w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary",
                                settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
                              )}
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="Nombre" 
                              className={cn(
                                "w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary",
                                settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
                              )}
                              value={newCustomer.first_name}
                              onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                            />
                            <input 
                              type="text" 
                              placeholder="Apellido" 
                              className={cn(
                                "w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary",
                                settings?.theme_mode === 'dark' ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
                              )}
                              value={newCustomer.last_name}
                              onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                            />
                          </div>
                          <button 
                            onClick={handleCreateCustomer}
                            className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-colors"
                          >
                            Guardar Cliente
                          </button>
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                              type="text"
                              placeholder="Ingrese DNI para buscar..."
                              className={cn(
                                "w-full pl-9 pr-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                settings?.theme_mode === 'dark' ? "bg-gray-900 border-transparent focus:border-primary text-white" : "bg-white border-gray-200 focus:border-primary text-gray-900"
                              )}
                              value={customerSearch}
                              onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowCustomerList(true);
                                const match = customers.find(c => c.dni === e.target.value);
                                if (match) {
                                  setSelectedCustomer(match);
                                  setShowCustomerList(false);
                                }
                              }}
                              onFocus={() => setShowCustomerList(true)}
                            />

                            <AnimatePresence>
                              {showCustomerList && customerSearch && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className={cn(
                                    "absolute z-50 w-full mt-1 border rounded-xl shadow-xl max-h-48 overflow-y-auto",
                                    settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                                  )}
                                >
                                  {customers
                                    .filter(c => 
                                      (c.dni && c.dni.includes(customerSearch)) ||
                                      `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearch.toLowerCase())
                                    )
                                    .map(c => (
                                      <div 
                                        key={c.id}
                                        className={cn(
                                          "px-4 py-3 cursor-pointer text-sm font-medium transition-colors flex items-center justify-between border-b last:border-0",
                                          settings?.theme_mode === 'dark' ? "hover:bg-gray-700 text-gray-300 border-gray-700" : "hover:bg-green-50 text-gray-700 border-gray-50"
                                        )}
                                        onClick={() => {
                                          setSelectedCustomer(c);
                                          setShowCustomerList(false);
                                          setCustomerSearch(c.dni || '');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-bold">{c.dni || 'S/DNI'}</span>
                                          <span className="text-xs text-gray-500">{c.first_name} {c.last_name}</span>
                                        </div>
                                        {selectedCustomer?.id === c.id && <Check size={14} className="text-primary" />}
                                      </div>
                                    ))}
                                  
                                  {customers.filter(c => (c.dni && c.dni.includes(customerSearch)) || `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center">
                                      <p className="text-xs text-gray-500 mb-2">No se encontró el cliente</p>
                                      <button 
                                        onClick={() => {
                                          setIsAddingCustomer(true);
                                          setNewCustomer({ ...newCustomer, dni: customerSearch });
                                        }}
                                        className="text-xs font-bold text-primary hover:underline"
                                      >
                                        + Crear nuevo cliente con DNI: {customerSearch}
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {selectedCustomer && (
                            <div className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border animate-in fade-in slide-in-from-top-1",
                              settings?.theme_mode === 'dark' ? "bg-primary/10 border-primary/20" : "bg-green-50 border-green-100"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                  <User size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">DNI: {selectedCustomer.dni}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  setCustomerSearch('');
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Payments */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Garantía del Producto (Opcional)</label>
                      <input 
                        type="text"
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border-2 transition-all outline-none font-bold",
                          settings?.theme_mode === 'dark' 
                            ? "bg-gray-800 border-gray-700 text-white focus:border-primary" 
                            : "bg-gray-50 border-gray-100 focus:border-primary focus:bg-white"
                        )}
                        placeholder="Ej. 12 meses de garantía"
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Métodos de Pago</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-green-500' },
                          { id: 'card', label: 'Tarjeta', icon: CreditCard, color: 'text-blue-500' },
                          { id: 'transfer', label: 'Transf.', icon: ArrowRightLeft, color: 'text-purple-500' },
                          { id: 'yape_plin', label: 'Yape/Plin', icon: Ticket, color: 'text-pink-500' },
                        ].map(method => (
                          <button
                            key={method.id}
                            onClick={() => {
                              const amount = pendingAmount;
                              if (amount <= 0) return;
                              setPayments([...payments, { method: method.id, amount }]);
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98]",
                              settings?.theme_mode === 'dark'
                                ? "border-gray-800 hover:border-primary/50 text-gray-300 bg-gray-800/50"
                                : "border-gray-100 hover:border-primary/30 text-gray-700 bg-gray-50"
                            )}
                          >
                            <method.icon size={18} className={method.color} />
                            <span className="text-[10px] font-bold">{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {payments.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Desglose de Pago</label>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                          {payments.map((p, idx) => (
                            <div key={idx} className={cn(
                              "flex items-center justify-between p-2 rounded-xl border shadow-sm",
                              settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  {p.method === 'cash' ? <Banknote size={12} /> : p.method === 'card' ? <CreditCard size={12} /> : p.method === 'transfer' ? <ArrowRightLeft size={12} /> : <Ticket size={12} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">{p.method.replace('_', '/')}</span>
                                  <input 
                                    type="number"
                                    className={cn(
                                      "w-24 px-0 py-0 text-sm font-black bg-transparent border-none focus:ring-0",
                                      settings?.theme_mode === 'dark' ? "text-white" : "text-gray-900"
                                    )}
                                    value={p.amount}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const newPayments = [...payments];
                                      newPayments[idx].amount = val;
                                      setPayments(newPayments);
                                    }}
                                  />
                                </div>
                              </div>
                              <button 
                                onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn(
                        "p-3 rounded-2xl border shadow-sm",
                        settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                      )}>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Pendiente</p>
                        <p className={cn(
                          "text-lg font-black mt-0.5",
                          pendingAmount > 0 ? "text-red-500" : "text-green-500"
                        )}>{formatCurrency(pendingAmount)}</p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl border shadow-sm",
                        settings?.theme_mode === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                      )}>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Vuelto</p>
                        <p className="text-lg font-black text-blue-500 mt-0.5">{formatCurrency(change)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleQuotation}
                        disabled={cart.length === 0}
                        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black py-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm mt-2"
                      >
                        Crear Cotización
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={pendingAmount > 0 || cart.length === 0}
                        className="w-full bg-primary text-white font-black py-3 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all text-sm mt-2"
                      >
                        Confirmar Venta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Modal */}
      <AnimatePresence>
        {showTicket && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300",
                settings?.ticket_size === 'A4' ? "w-full max-w-2xl" : 
                settings?.ticket_size === '58mm' ? "w-full max-w-[280px]" : "w-full max-w-sm"
              )}
            >
              <div className={cn(
                "p-8 flex flex-col items-center justify-center space-y-6 min-h-[400px]"
              )} ref={ticketRef}>
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Comprobante Electrónico</h3>
                  <p className="text-lg font-black text-gray-900">
                    {isQuotation ? 'COTIZACIÓN' : 'VENTA'}: #{isQuotation ? 'C' : 'V'}{String(isQuotation ? lastQuotationId : lastSaleId).padStart(6, '0')}
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-xl group-hover:bg-primary/20 transition-all duration-500" />
                  <div className="relative bg-white p-6 rounded-2xl border-2 border-primary/20 shadow-xl">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        className="w-48 h-48 object-contain" 
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        Generando QR...
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-black text-primary uppercase tracking-widest">Escanear para Validar</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Total: {formatCurrency(total)}</p>
                </div>

                <div className="w-full pt-6 space-y-3 no-print">
                  <div className="flex flex-col gap-2">
                    {isQuotation ? (
                      <button 
                        onClick={handleDownloadPDF}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                      >
                        <Download size={20} />
                        Descargar PDF
                      </button>
                    ) : (
                      <button 
                        onClick={handlePrint}
                        className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98]"
                      >
                        <Ticket size={20} />
                        Imprimir Ticket
                      </button>
                    )}
                    <button 
                      onClick={resetSale}
                      className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                      {isQuotation ? 'Continuar Venta' : 'Nueva Venta'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Serial Selection Modal */}
      <AnimatePresence>
        {isSerialModalOpen && selectedProductForSerial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSerialModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden",
                settings?.theme_mode === 'dark' ? "bg-gray-900" : "bg-white"
              )}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">Seleccionar Series</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase">{selectedProductForSerial.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsSerialModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar número de serie..."
                    className={cn(
                      "w-full pl-11 pr-4 py-3 rounded-2xl border-2 transition-all outline-none font-bold",
                      settings?.theme_mode === 'dark' 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-primary" 
                        : "bg-gray-50 border-gray-100 focus:border-primary focus:bg-white"
                    )}
                    value={serialSearchQuery}
                    onChange={(e) => setSerialSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                  {availableSerials
                    .filter(item => item.serial_number.toLowerCase().includes(serialSearchQuery.toLowerCase()))
                    .length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 font-bold">No se encontraron series</p>
                      </div>
                    ) : (
                      availableSerials
                        .filter(item => item.serial_number.toLowerCase().includes(serialSearchQuery.toLowerCase()))
                        .map(item => {
                          const isSelected = selectedSerials.includes(item.serial_number);
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSerials(prev => prev.filter(s => s !== item.serial_number));
                                } else {
                                  setSelectedSerials(prev => [...prev, item.serial_number]);
                                }
                              }}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                                isSelected 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              <span className="font-mono font-bold">{item.serial_number}</span>
                              {isSelected && <Check size={18} />}
                            </button>
                          );
                        })
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Seleccionados</span>
                    <span className="text-lg font-black text-primary">{selectedSerials.length}</span>
                  </div>
                  <button
                    disabled={selectedSerials.length === 0}
                    onClick={() => {
                      addSerializedProductToCart(selectedProductForSerial, selectedSerials);
                      setIsSerialModalOpen(false);
                    }}
                    className="bg-primary text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    AGREGAR AL CARRITO
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
