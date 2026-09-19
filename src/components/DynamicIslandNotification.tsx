import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, ShoppingBag, Truck, X } from 'lucide-react';

export const DynamicIslandNotification: React.FC = () => {
  const { activeIslandNotification, dismissIslandNotification, setActiveTrackOrderId } = useApp();

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {activeIslandNotification && (
          <motion.div
            initial={{ y: -60, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -50, scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="dynamic-island pointer-events-auto rounded-full py-2.5 px-5 max-w-md w-full shadow-2xl flex items-center justify-between gap-3 text-white border border-white/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-inner">
                {activeIslandNotification.type === 'payment' ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : activeIslandNotification.type === 'order_status' ? (
                  <Truck className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-white tracking-wide truncate">
                  {activeIslandNotification.title}
                </p>
                <p className="text-[11px] text-gray-300 truncate">
                  {activeIslandNotification.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeIslandNotification.orderId && (
                <button
                  onClick={() => {
                    if (activeIslandNotification.orderId) {
                      setActiveTrackOrderId(activeIslandNotification.orderId);
                      dismissIslandNotification();
                    }
                  }}
                  className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full transition cursor-pointer"
                >
                  Lacak
                </button>
              )}
              <button
                onClick={dismissIslandNotification}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
