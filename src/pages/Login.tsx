import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Key, ArrowRight } from 'lucide-react';

export function Login() {
  const [loginType, setLoginType] = useState<'admin' | 'resident'>('resident');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (loginType === 'admin') {
        // Simple admin login
        if (password === 'admin123') {
          login('admin');
          navigate('/');
        } else {
          setError('Password admin salah. (Hint: admin123)');
        }
      } else {
        // Resident login using NIK
        const res = await fetch('/api/residents');
        const residents = await res.json();
        const resident = residents.find((r: any) => r.nik === nik);
        
        if (resident) {
          login('resident', resident);
          navigate('/');
        } else {
          setError('NIK tidak ditemukan dalam data warga.');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login.');
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
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 mt-2">Silakan masuk ke akun Anda untuk melanjutkan.</p>
          </div>
          
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                loginType === 'resident' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
              onClick={() => { setLoginType('resident'); setError(''); }}
            >
              Warga
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                loginType === 'admin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
              onClick={() => { setLoginType('admin'); setError(''); }}
            >
              Pengurus RT
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Shield className="shrink-0 mt-0.5" size={16} />
                {error}
              </div>
            )}

            {loginType === 'resident' ? (
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
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
          
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
