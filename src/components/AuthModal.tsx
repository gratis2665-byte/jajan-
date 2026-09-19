import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  X,
  Shield,
  User as UserIcon,
  LogOut,
  Mail,
  UserPlus,
  LogIn,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { googleSignIn, logout as firebaseLogout } from '../services/firebaseAuth';
import { playTapSound } from '../services/soundEffects';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    setCurrentUser,
    users,
    switchRole,
    registerUser,
    setGoogleAccessToken,
    pushNotification,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    setFormError(null);

    const cleanEmail = emailInput.trim().toLowerCase();

    if (authMode === 'register') {
      if (!nameInput.trim()) {
        setFormError('Nama lengkap wajib diisi');
        return;
      }
      if (!cleanEmail) {
        setFormError('Email wajib diisi');
        return;
      }
      if (!passwordInput || passwordInput.length < 4) {
        setFormError('Password minimal 4 karakter');
        return;
      }

      // Check if email already registered
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        setFormError('Email ini sudah terdaftar. Silakan masuk akun.');
        return;
      }

      const registeredUser = registerUser({
        name: nameInput.trim(),
        email: cleanEmail,
        phone: phoneInput.trim() || undefined,
        password: passwordInput,
        role: 'customer',
      });

      setCurrentUser(registeredUser);
      pushNotification({
        title: 'Akun Berhasil Dibuat',
        message: `Selamat datang, ${registeredUser.name}! Akun Anda berhasil didaftarkan.`,
        type: 'system',
      });
      setIsAuthModalOpen(false);
    } else {
      // Login mode: cari akun yang cocok dari users list jika ada email
      if (!cleanEmail) {
        setFormError('Email wajib diisi');
        return;
      }
      if (!passwordInput) {
        setFormError('Password wajib diisi');
        return;
      }

      const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (foundUser) {
        // Cek kecocokan password jika akun memiliki password
        if (foundUser.password && foundUser.password !== passwordInput) {
          setFormError('Password tidak sesuai. Silakan coba kembali.');
          return;
        }

        setCurrentUser(foundUser);
        pushNotification({
          title: 'Login Berhasil',
          message: `Selamat datang kembali, ${foundUser.name}!`,
          type: 'system',
        });
        setIsAuthModalOpen(false);
      } else {
        // Jika belum terdaftar, buatkan akun baru otomatis
        const activeName = cleanEmail.split('@')[0];
        const loginUser = registerUser({
          name: activeName.charAt(0).toUpperCase() + activeName.slice(1),
          email: cleanEmail,
          password: passwordInput,
          role: 'customer',
        });
        setCurrentUser(loginUser);
        pushNotification({
          title: 'Login Berhasil',
          message: `Selamat datang, ${loginUser.name}!`,
          type: 'system',
        });
        setIsAuthModalOpen(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (!result || result.cancelled) {
        setIsGoogleLoading(false);
        return;
      }

      const { user: firebaseUser, accessToken } = result;

      if (accessToken) {
        setGoogleAccessToken(accessToken);
      }

      // Check if user has email matching admin/owner
      const userEmail = firebaseUser.email || '';
      const isAdmin =
        userEmail.includes('admin') ||
        userEmail.includes('owner') ||
        currentUser.role === 'admin';

      const role: UserRole = isAdmin ? 'admin' : 'customer';

      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Google User',
        email: userEmail,
        role: role,
        avatar: firebaseUser.photoURL || undefined,
      };

      setCurrentUser(newUser);

      pushNotification({
        title: 'Login Google Berhasil',
        message: `Terhubung sebagai ${newUser.name} (${role === 'admin' ? 'Admin' : 'Pelanggan'}). Sinkronisasi Google Sheets aktif.`,
        type: 'system',
      });

      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      console.warn('Google Sign In Error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Gagal menghubungkan Google Sign-In';
      setGoogleError(errorMessage);

      pushNotification({
        title: 'Google Sign In',
        message: 'Gagal terhubung dengan akun Google. Silakan coba kembali.',
        type: 'system',
      });
    } finally {
      setIsGoogleLoading(false);
    }
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
                  Akun &amp; Autentikasi
                </h3>
                <p className="text-[11px] text-gray-400">
                  Masuk dengan Google atau Akun Terdaftar
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
                Google Sign-In
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
                    : 'Masuk dengan Google'}
                </span>
              </button>

              {googleError && (
                <p className="text-[10px] text-rose-400 mt-1">{googleError}</p>
              )}
            </div>

            {/* Email / Akun Login Form */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              {/* Tab Selector: Masuk / Daftar */}
              <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setFormError(null);
                  }}
                  className={`py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                    authMode === 'login'
                      ? 'bg-amber-400 text-gray-950 font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setFormError(null);
                  }}
                  className={`py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                    authMode === 'register'
                      ? 'bg-amber-400 text-gray-950 font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Baru</span>
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
                {formError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap Anda"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">
                      Nomor HP <span className="text-gray-400 text-[10px]">(Opsional / WhatsApp)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={authMode === 'register' ? 'Minimal 4 karakter' : 'Masukkan password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-9 pr-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition cursor-pointer shadow-md"
                >
                  {authMode === 'login' ? 'Masuk ke Sistem' : 'Daftar Akun'}
                </button>

                {authMode === 'login' && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-gray-400">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">
                      Akun Bawaan Staf:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput('admin@jajan.com');
                          setPasswordInput('admin');
                          setFormError(null);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer"
                      >
                        <span className="block font-semibold text-amber-300">Admin</span>
                        <span className="block text-[10px] text-gray-400">admin@jajan.com</span>
                        <span className="block text-[9px] text-gray-400">Pass: admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput('kasir@jajan.com');
                          setPasswordInput('kasir');
                          setFormError(null);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer"
                      >
                        <span className="block font-semibold text-emerald-300">Kasir</span>
                        <span className="block text-[10px] text-gray-400">kasir@jajan.com</span>
                        <span className="block text-[9px] text-gray-400">Pass: kasir</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
