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

      // Check existing email
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        setFormError('Email sudah terdaftar. Silakan login.');
        return;
      }

      const newUser = registerUser({
        name: nameInput.trim(),
        email: cleanEmail,
        password: passwordInput,
        role: 'customer',
      });

      setCurrentUser(newUser);
      pushNotification({
        title: 'Registrasi Berhasil',
        message: `Selamat datang, ${newUser.name}! Akun Anda siap digunakan.`,
        type: 'system',
      });
      setIsAuthModalOpen(false);
    } else {
      // Mode Login
      if (!cleanEmail) {
        setFormError('Email wajib diisi');
        return;
      }
      if (!passwordInput) {
        setFormError('Password wajib diisi');
        return;
      }

      const foundUser = users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (foundUser) {
        if (foundUser.password && foundUser.password !== passwordInput) {
          setFormError('Password salah. Silakan coba lagi.');
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
        message: `Terhubung sebagai ${newUser.name} (${role === 'admin' ? 'Admin' : 'Pelanggan'}).`,
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
          className="fixed inset-0 bg-[#361A0C]/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative z-10 border border-[#EFE8DE] shadow-2xl flex flex-col text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#D81A3C] flex items-center justify-center border border-red-100 shadow-2xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1F1A17] tracking-tight font-heading">
                  Akun &amp; Autentikasi
                </h3>
                <p className="text-[11px] text-[#736962]">
                  Masuk dengan Google atau Akun Terdaftar
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="w-8 h-8 rounded-full border border-[#EFE8DE] bg-white flex items-center justify-center text-[#736962] hover:text-[#1F1A17] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 bg-white">
            {/* Current Active Account Box */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DE] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F1A17] flex items-center justify-center text-white font-bold overflow-hidden">
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
                    <span className="text-xs font-bold text-[#1F1A17] font-heading">{currentUser.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-white border border-[#EFE8DE] text-[#D81A3C]">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#736962] truncate max-w-[180px]">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  await firebaseLogout();
                  switchRole('customer');
                }}
                className="p-2 rounded-xl bg-white hover:bg-red-50 text-[#736962] hover:text-[#D81A3C] border border-[#EFE8DE] transition cursor-pointer"
                title="Keluar / Reset"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Google Workspace Integration Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider block">
                Google Sign-In
              </label>

              {/* Official Google Sign-In Styled Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading}
                className="w-full h-11 bg-white hover:bg-[#FAF7F2] active:bg-[#F3ECE1] text-[#1F1A17] font-bold text-xs rounded-full flex items-center justify-center gap-3 shadow-2xs transition cursor-pointer border border-[#EFE8DE] disabled:opacity-50"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4 shrink-0"
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
                <p className="text-[10px] text-red-600 mt-1">{googleError}</p>
              )}
            </div>

            {/* Email / Akun Login Form */}
            <div className="pt-2 border-t border-[#EFE8DE] space-y-3">
              {/* Tab Selector: Masuk / Daftar */}
              <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] rounded-full border border-[#EFE8DE] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setFormError(null);
                  }}
                  className={`py-1.5 rounded-full font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-[#1F1A17] shadow-2xs'
                      : 'text-[#736962] hover:text-[#1F1A17]'
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
                  className={`py-1.5 rounded-full font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-[#1F1A17] shadow-2xs'
                      : 'text-[#736962] hover:text-[#1F1A17]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Baru</span>
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
                {formError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label className="text-[11px] font-bold text-[#52311D] block mb-1">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-[#736962] absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap Anda"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 pl-9 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C] placeholder:text-[#736962]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-[#52311D] block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#736962] absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 pl-9 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C] placeholder:text-[#736962]"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="text-[11px] font-bold text-[#52311D] block mb-1">
                      Nomor HP <span className="text-[#736962] text-[10px] font-normal">(Opsional / WhatsApp)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#736962] absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 pl-9 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C] placeholder:text-[#736962]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-[#52311D] block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#736962] absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={authMode === 'register' ? 'Minimal 4 karakter' : 'Masukkan password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 pl-9 pr-9 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C] placeholder:text-[#736962]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#736962] hover:text-[#1F1A17] p-0.5 rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  {authMode === 'login' ? 'Masuk ke Sistem' : 'Daftar Akun'}
                </button>

                {authMode === 'login' && (
                  <div className="pt-2 border-t border-[#EFE8DE] space-y-2 text-[11px] text-[#736962]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#736962]">
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
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-left transition cursor-pointer"
                      >
                        <span className="block font-bold text-[#D81A3C]">Admin</span>
                        <span className="block text-[10px] text-[#52311D]">admin@jajan.com</span>
                        <span className="block text-[9px] text-[#736962]">Pass: admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput('kasir@jajan.com');
                          setPasswordInput('kasir');
                          setFormError(null);
                        }}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-left transition cursor-pointer"
                      >
                        <span className="block font-bold text-emerald-700">Kasir</span>
                        <span className="block text-[10px] text-[#52311D]">kasir@jajan.com</span>
                        <span className="block text-[9px] text-[#736962]">Pass: kasir</span>
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
