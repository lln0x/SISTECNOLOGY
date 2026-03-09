import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Calendar, 
  User, 
  CreditCard, 
  X,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sale, AppSettings } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useDataSync } from '../hooks/useDataSync';

export default function SalesRecords() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const fetchSales = () => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(setSales);
  };

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings);
  };

  useEffect(() => {
    fetchSales();
    fetchSettings();
  }, []);

  useDataSync(fetchSales);

  const viewSaleDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/sales/${id}`);
      const data = await res.json();
      setSelectedSale(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  const filteredSales = sales.filter(s => {
    const saleId = `#V${String(s.id).padStart(6, '0')}`;
    const customerName = `${s.customer_id ? `${(s as any).first_name} ${(s as any).last_name}` : 'Público General'}`.toLowerCase();
    return saleId.includes(search) || customerName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Ventas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Consulta el historial detallado de todas tus ventas.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por ID de venta o nombre del cliente..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Venta</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-primary">#V{String(sale.id).padStart(6, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(sale.created_at).toLocaleDateString()}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{new Date(sale.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {sale.customer_id ? `${(sale as any).first_name} ${(sale as any).last_name}` : 'Público General'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(sale.total)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => viewSaleDetails(sale.id)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Ver Detalles"
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
                        <Search size={24} />
                      </div>
                      <p className="text-gray-500 font-bold">No se encontraron ventas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Detalle de Venta</h3>
                    <p className="text-xs font-bold text-primary tracking-widest uppercase">#V{String(selectedSale.id).padStart(6, '0')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(selectedSale.created_at).toLocaleDateString()} - {new Date(selectedSale.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedSale.customer_id ? `${selectedSale.first_name} ${selectedSale.last_name}` : 'Público General'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos</p>
                  <div className="border dark:border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Cant.</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Descripción</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">P. Unit</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-800">
                        {selectedSale.items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.product_name}</span>
                                <span className="text-[10px] text-gray-500 font-medium">SKU: {item.product_code}</span>
                                {item.serial_numbers && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(() => {
                                      try {
                                        const serials = typeof item.serial_numbers === 'string' ? JSON.parse(item.serial_numbers) : item.serial_numbers;
                                        return Array.isArray(serials) && serials.map((sn: string, i: number) => (
                                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[9px] font-bold text-gray-600 dark:text-gray-400 rounded border dark:border-gray-700">
                                            {sn}
                                          </span>
                                        ));
                                      } catch (e) {
                                        return null;
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-sm font-black text-gray-900 dark:text-white text-right">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Métodos de Pago</p>
                      <div className="space-y-1">
                        {(() => {
                          try {
                            const payments = JSON.parse(selectedSale.payment_method);
                            return Array.isArray(payments) ? payments.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                                <span className="uppercase">{p.method.replace('_', '/')}</span>
                                <span>{formatCurrency(p.amount)}</span>
                              </div>
                            )) : <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedSale.payment_method}</span>;
                          } catch (e) {
                            return <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedSale.payment_method}</span>;
                          }
                        })()}
                      </div>
                    </div>
                    {selectedSale.warranty && (
                      <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Garantía</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedSale.warranty}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                      <span>IGV (0%)</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white pt-2 border-t dark:border-gray-800">
                      <span>TOTAL</span>
                      <span>{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
