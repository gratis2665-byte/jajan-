import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Zap, CheckCircle2, ShoppingBag } from 'lucide-react';

export const TransactionTicker: React.FC = () => {
  const { activities } = useApp();
  const latestActivity = activities[0];

  if (!latestActivity) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
      <div className="apple-glass rounded-2xl px-4 py-2 flex items-center justify-between gap-3 text-xs border border-white/10 overflow-hidden">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Live Aktivitas
          </span>
        </div>

        <div className="flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={latestActivity.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 truncate text-gray-300"
            >
              {latestActivity.type === 'payment_confirmed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="font-medium text-white">{latestActivity.customerName}</span>
              <span className="text-gray-400 truncate">
                {latestActivity.type === 'payment_confirmed'
                  ? `membayar Rp ${latestActivity.total.toLocaleString('id-ID')} via ${latestActivity.paymentMethod}`
                  : `menyelesaikan pesanan #${latestActivity.orderId}`}
              </span>
              <span className="text-gray-400 text-[10px] hidden md:inline shrink-0">
                ({latestActivity.itemsSummary})
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
          {latestActivity.timestamp}
        </div>
      </div>
    </div>
  );
};
