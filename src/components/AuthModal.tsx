import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  X,
  Shield,
  User as UserIcon,
  Store,
  Check,
  LogOut,
  Mail,
  Lock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole, User } from '../types';
import { googleSignIn, logout as firebaseLogout, setAccessToken } from '../services/firebaseAuth';
import { playTapSound } from '../services/soundEffects';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    setCurrentUser,
    users,
    switchRole,
    setGoogleAccessToken,
    pushNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quick' | 'email'>('quick');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleQuickSwitch = (role: UserRole) => {
    playTapSound();
    switchRole(role);
    pushNotification({
      title: 'Akses Peran Diperbarui',
      message: `Anda sekarang masuk sebagai ${role === 'admin' ? 'Super Admin' : role === 'cashier' ? 'Kasir' : 'Pelanggan'}.`,
      type: 'system',
    });
    setIsAuthModalOpen(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!nameInput.trim()) return;

    const loggedUser: User = {
      id: `user-${Date.now()}`,
      name: nameInput,
      email: emailInput || `${nameInput.toLowerCase().replace(/\s+/g, '')}@jajan.com`,
      role: selectedRole,
    };

    setCurrentUser(loggedUser);
    pushNotification({
      title: 'Login Berhasil',
      message: `Selamat datang, ${loggedUser.name}! Akses: ${selectedRole.toUpperCase()}`,
      type: 'system',
    });
    setIsAuthModalOpen(false);
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (!result) return;

      if ('cancelled' in result && result.cancelled) {
        // User deliberately closed the popup window; reset state silently
        return;
      }

      if ('user' in result && result.user) {
        setGoogleAccessToken(result.accessToken);
        setAccessToken(result.accessToken);

        const googleUser: User = {
          id: result.user.uid,
          name: result.user.displayName || 'Pengguna Google',
          email: result.user.email || '',
          role: 'admin', // give admin rights for sheets management
          avatar: result.user.photoURL || undefined,
        };

        setCurrentUser(googleUser);
        pushNotification({
          title: 'Google Auth Sukses',
          message: `Berhasil terhubung ke akun ${googleUser.email}. Fitur sinkronisasi Google Sheets aktif!`,
          type: 'system',
        });
        setIsAuthModalOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan Google Auth. Coba lagi atau gunakan Login Cepat.';
      setGoogleError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDemoGoogleConnect = () => {
    playTapSound();
    const demoToken = 'demo_google_sheets_token_' + Date.now();
    setGoogleAccessToken(demoToken);
    setAccessToken(demoToken);

    const demoGoogleUser: User = {
      id: 'google-demo-user',
      name: 'Owner Jajan (Google Demo)',
      email: 'owner@jajan-kuliner.com',
      role: 'admin',
    };

    setCurrentUser(demoGoogleUser);
    pushNotification({
      title: 'Google Sheets Demo Aktif',
      message: 'Mode integrasi Google Sheets aktif. Anda dapat menguji ekspor laporan transaksi & inventaris.',
      type: 'system',
    });
    setIsAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="apple-glass rounded-3xl w-full max-w-md overflow-hidden relative z-10 border border-white/20 shadow-2xl flex flex-col bg-gray-950/90 text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Sistem Login Terpadu
                </h3>
                <p className="text-[11px] text-gray-400">
                  1 Tempat untuk Admin, Kasir, &amp; Pelanggan
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="w-8 h-8 rounded-full apple-glass-pill flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Current Active Account Box */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{currentUser.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/10 text-amber-300">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  await firebaseLogout();
                  switchRole('customer');
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 transition"
                title="Keluar / Reset"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Google Workspace Integration Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Google Sheets Integration
              </label>

              {/* Official Google Sign-In Styled Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading}
                className="w-full h-11 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 font-medium text-xs rounded-2xl flex items-center justify-center gap-3 shadow-md transition cursor-pointer border border-gray-300 disabled:opacity-50"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-5 h-5 shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>
                  {isGoogleLoading
                    ? 'Menghubungkan ke Google...'
                    : 'Masuk dengan Google (Sinkronisasi Sheets)'}
                </span>
              </button>

              {googleError && (
                <p className="text-[10px] text-rose-400 mt-1">{googleError}</p>
              )}

              <button
                type="button"
                onClick={handleDemoGoogleConnect}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atau Aktifkan Sinkronisasi Sheets Demo (Instan)</span>
              </button>
            </div>

            {/* Quick 1-Click Role Switcher */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Pilih Akun Demo 1-Klik
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('admin')}
                  className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                      SA
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Budi Santoso (Super Admin)</p>
                      <p className="text-[10px] text-indigo-300">
                        Akses penuh: Inventaris, staff, omzet &amp; Google Sheets
                      </p>
                    </div>
                  </div>
                  {currentUser.role === 'admin' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSwitch('cashier')}
                  className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-bold text-xs">
                      KS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Siti Rahmawati (Kasir / POS)</p>
                      <p className="text-[10px] text-amber-300">
                        Proses pesanan masuk, status dapur &amp; konfirmasi bayar
                      </p>
                    </div>
                  </div>
                  {currentUser.role === 'cashier' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSwitch('customer')}
                  className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-gray-950 flex items-center justify-center font-bold text-xs">
                      PL
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Dimas Pratama (Pelanggan)</p>
                      <p className="text-[10px] text-emerald-300">
                        Pesan makanan minuman, keranjang belanja, live tracking
                      </p>
                    </div>
                  </div>
                  {currentUser.role === 'customer' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Custom Manual Login */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Atau Buat / Masuk Akun Kustom
                </span>
                <button
                  onClick={() => setActiveTab(activeTab === 'email' ? 'quick' : 'email')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  {activeTab === 'email' ? 'Tutup Formulir' : 'Buka Formulir'}
                </button>
              </div>

              {activeTab === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Peran Akses</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-gray-900 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="customer">Pelanggan (Customer)</option>
                      <option value="cashier">Kasir Toko (Staff)</option>
                      <option value="admin">Super Admin (Owner)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition cursor-pointer"
                  >
                    Simpan &amp; Masuk
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
