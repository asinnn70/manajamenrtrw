import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Key, ArrowRight, MapPin, Phone, UserPlus } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'resident'>('resident');
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rtCode, setRtCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!rtCode.trim() || !nik.trim() || !name.trim() || !phone.trim() || !password.trim()) {
      setError('Semua kolom harus diisi.');
      setIsLoading(false);
      return;
    }

    try {
      const newResident = {
        nik,
        name,
        phone,
        password,
        rt: rtCode.toUpperCase(),
        status: 'Tetap', // Changed from 'Aktif' to 'Tetap' to match the standard status in Residents.tsx
        familyCardNumber: '',
        address: '',
        rw: '05',
        gender: 'Laki-laki', // Add default gender
        maritalStatus: 'Lajang', // Add default marital status
        familyRelationship: 'Kepala Keluarga' // Add default relationship
      };

      const res = await fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResident)
      });

      if (res.ok) {
        setSuccessMsg('Pendaftaran berhasil! Silakan masuk menggunakan NIK Anda.');
        setIsRegistering(false);
        // Reset form fields except rtCode and nik to make login easier
        setName('');
        setPhone('');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!rtCode.trim()) {
      setError('Kode RT harus diisi.');
      setIsLoading(false);
      return;
    }

    try {
      if (loginType === 'admin') {
        // Super Admin Backdoor
        if (rtCode === 'SUPERADMIN' && password === 'admin123') {
            login('admin', { name: 'Super Administrator', rtId: 'SUPERADMIN' }, 'SUPERADMIN');
            navigate('/');
            return;
        }

        // Strict Admin login using Admins sheet
        const res = await fetch('/api/admins');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const admin = data.find((a: any) => String(a.rtCode).toUpperCase() === rtCode.toUpperCase() && String(a.password) === password);
            
            if (admin) {
              login('admin', { name: admin.name || `Pengurus ${rtCode.toUpperCase()}`, rtId: rtCode.toUpperCase() }, rtCode.toUpperCase());
              navigate('/');
            } else {
              setError('Kode RT atau Password admin salah.');
            }
          } else {
            console.error("Invalid data from GAS:", data);
            setError('Sistem belum dikonfigurasi dengan benar (Sheet Admins tidak ditemukan/Error). Pastikan Google Apps Script sudah diupdate.');
          }
        } else {
          setError('Gagal mengambil data admin dari server.');
        }
      } else {
        // Resident login using NIK and Password
        // Add a timestamp to bypass cache if needed, or rely on the server's cache invalidation
        const res = await fetch(`/api/residents?t=${new Date().getTime()}`);
        const residents = await res.json();
        
        if (Array.isArray(residents)) {
          // Filter by RT first, then check NIK and password
          const resident = residents.find((r: any) => 
            String(r.rt).toUpperCase() === rtCode.toUpperCase() &&
            String(r.nik) === String(nik) && 
            String(r.password) === String(password)
          );
          
          if (resident) {
            login('resident', { ...resident, rtId: rtCode.toUpperCase() }, rtCode.toUpperCase());
            navigate('/');
          } else {
            setError('NIK, Password, atau Kode RT salah.');
          }
        } else {
           console.error("Invalid residents data:", residents);
           setError('Gagal mengambil data warga dari server.');
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Terjadi kesalahan saat login. Periksa koneksi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-12 flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/seed/cityscape/1920/1080?blur=4')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 mb-6 shadow-2xl">
            <Shield className="text-indigo-400" size={24} />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            Sistem Informasi<br/>Manajemen Warga
          </h1>
          <p className="text-lg text-indigo-200/80 max-w-md font-light">
            Platform digital terpadu untuk pengelolaan administrasi, keuangan, dan komunikasi warga tingkat RT/RW.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-400 font-mono uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} RT 01 / RW 05</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
          <span>Kelurahan Sukamaju</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isRegistering ? 'Daftar Warga Baru' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isRegistering ? 'Lengkapi data di bawah ini untuk mendaftar.' : 'Silakan masuk ke akun Anda untuk melanjutkan.'}
            </p>
          </div>
          
          {!isRegistering && (
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  loginType === 'resident' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
                onClick={() => { setLoginType('resident'); setError(''); setSuccessMsg(''); }}
              >
                Warga
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  loginType === 'admin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
                onClick={() => { setLoginType('admin'); setError(''); setSuccessMsg(''); }}
              >
                Pengurus RT
              </button>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Shield className="shrink-0 mt-0.5" size={16} />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Shield className="shrink-0 mt-0.5" size={16} />
                {successMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Kode RT (Workspace)
              </label>
              <input
                type="text"
                required
                value={rtCode}
                onChange={(e) => setRtCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono uppercase"
                placeholder="Contoh: RT01"
              />
            </div>

            {isRegistering ? (
              <>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-indigo-500" />
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <input
                    type="text"
                    required
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono"
                    placeholder="Masukkan 16 digit NIK"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <UserPlus size={16} className="text-indigo-500" />
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Nama sesuai KTP"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-indigo-500" />
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Key size={16} className="text-indigo-500" />
                    Buat Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono tracking-widest"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </>
            ) : loginType === 'resident' ? (
              <>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-indigo-500" />
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <input
                    type="text"
                    required
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono"
                    placeholder="Masukkan 16 digit NIK"
                  />
                  <p className="text-xs text-slate-500 font-medium">Gunakan NIK yang terdaftar di database RT.</p>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Key size={16} className="text-indigo-500" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Key size={16} className="text-indigo-500" />
                  Password Administrator
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-mono tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? 'Memproses...' : isRegistering ? 'Daftar Sekarang' : 'Masuk ke Sistem'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
                setLoginType('resident');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {isRegistering 
                ? "Sudah punya akun? Masuk di sini" 
                : "Belum terdaftar? Daftar sebagai warga baru"}
            </button>
          </div>

          <div className="lg:hidden text-center mt-12">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              &copy; {new Date().getFullYear()} RT 01 / RW 05
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
