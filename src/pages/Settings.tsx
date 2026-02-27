import { Database, HardDrive, Save, RefreshCw, Trash2, Upload, Cloud, Smartphone, CheckCircle, Copy, QrCode, Power, PowerOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import React from "react";

interface DbStatus {
  status: string;
  type: string;
  residentCount: number;
  location: string;
  details?: string;
}

export function Settings() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [scriptUrl, setScriptUrl] = useState('');
  const [vpsUrl, setVpsUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingVps, setSavingVps] = useState(false);
  const [waStatus, setWaStatus] = useState<{ status: string; qr: string | null; message?: string }>({ status: 'close', qr: null });
  const { role } = useAuth();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/residents');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          status: 'Connected',
          type: 'Google Sheets',
          residentCount: data.length,
          location: 'Google Cloud',
        });
      } else {
        throw new Error('Failed to fetch from Google Sheets');
      }
    } catch (error: any) {
      console.error("Failed to fetch status", error);
      setStatus({
        status: 'Error',
        type: 'Google Sheets',
        residentCount: 0,
        location: 'Periksa URL & Izin Apps Script',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/script-url');
      const data = await res.json();
      setScriptUrl(data.url);
      
      const vpsRes = await fetch('/api/vps-url');
      const vpsData = await vpsRes.json();
      setVpsUrl(vpsData.url);
    } catch (error) {
      console.error("Failed to fetch config URLs", error);
    }
  };

  const fetchWaStatus = async () => {
    if (role !== 'admin') return;
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data);
    } catch (error) {
      console.error("Failed to fetch WA status", error);
    }
  };

  useEffect(() => {
    fetchConfig().then(() => fetchStatus());
    
    if (role === 'admin') {
      fetchWaStatus();
      const interval = setInterval(fetchWaStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleStartWa = async () => {
    try {
      await fetch('/api/whatsapp/start', { method: 'POST' });
      fetchWaStatus();
    } catch (error) {
      console.error("Failed to start WA", error);
    }
  };

  const handleLogoutWa = async () => {
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      fetchWaStatus();
    } catch (error) {
      console.error("Failed to logout WA", error);
    }
  };

  const handleSaveVpsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVps(true);
    try {
      const res = await fetch('/api/vps-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: vpsUrl })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchWaStatus();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setSavingVps(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/script-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scriptUrl })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchStatus();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="text-indigo-600" size={24} />
          Status Database (Google Sheet)
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Status Koneksi</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status?.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {status?.status || 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Tipe Database</span>
              <span className="text-sm font-mono text-slate-700">{status?.type || '-'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Lokasi</span>
              <span className="text-sm font-mono text-slate-700">{status?.location || '-'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Total Data Warga</span>
              <span className="text-sm font-bold text-slate-700">{status?.residentCount || 0}</span>
            </div>
            {status?.details && (
              <div className="mt-3 pt-3 border-t border-red-100 bg-red-50/50 p-2 rounded">
                <span className="text-[10px] font-bold text-red-600 block mb-1 uppercase tracking-wider">Detail Error</span>
                <span className="text-[10px] font-mono text-red-700 break-words leading-tight block">{status.details}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Cloud className="text-indigo-600" size={24} />
          Konfigurasi Google Apps Script
        </h3>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL Web App Google Apps Script</label>
            <input 
              type="text" 
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Deploy script Anda sebagai Web App dan paste URL-nya di sini.
            </p>
          </div>
          <button 
            type="submit"
            disabled={savingConfig}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {savingConfig ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </form>
      </div>

      {role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Smartphone className="text-green-600" size={24} />
            Integrasi Bot WhatsApp
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Status Bot</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  waStatus.status === 'open' ? 'bg-green-100 text-green-700' : 
                  waStatus.status === 'connecting' ? 'bg-amber-100 text-amber-700' : 
                  waStatus.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {waStatus.status === 'open' ? 'Terhubung' : 
                   waStatus.status === 'connecting' ? 'Menghubungkan...' : 
                   waStatus.status === 'error' ? 'Error / Offline' :
                   'Terputus'}
                </span>
              </div>
              
              {waStatus.status === 'open' ? (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                  <p className="text-sm text-slate-600 font-medium">Bot WhatsApp aktif dan siap menerima pesan.</p>
                </div>
              ) : waStatus.qr ? (
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-3 font-medium">Scan QR Code ini dengan WhatsApp Anda:</p>
                  <div className="bg-white p-2 rounded-xl inline-block border border-slate-200 shadow-sm">
                    <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-48 h-48" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-sm text-slate-500">Klik tombol "Mulai Bot" untuk memunculkan QR Code.</p>
                </div>
              )}

              {waStatus.status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  <strong>Error:</strong> {waStatus.message || 'Tidak dapat terhubung ke VPS. Pastikan server VPS berjalan dan port terbuka.'}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <form onSubmit={handleSaveVpsConfig} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL API VPS WhatsApp</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={vpsUrl}
                    onChange={(e) => setVpsUrl(e.target.value)}
                    placeholder="http://103.x.x.x:3001"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    type="submit"
                    disabled={savingVps}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    {savingVps ? "..." : "Simpan"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Masukkan IP dan Port VPS tempat bot WhatsApp berjalan.
                </p>
              </form>

              <p className="text-sm text-slate-600 mb-4">
                Bot WhatsApp memungkinkan warga untuk mengirim laporan dan mengecek status langsung melalui WhatsApp.
              </p>
              
              {(waStatus.status === 'close' || waStatus.status === 'error') && !waStatus.qr && (
                <button 
                  onClick={handleStartWa}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm shadow-green-200"
                >
                  <Power size={18} />
                  Mulai Bot WhatsApp
                </button>
              )}
              
              {(waStatus.status === 'open' || waStatus.qr) && (
                <button 
                  onClick={handleLogoutWa}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <PowerOff size={18} />
                  Hentikan & Logout Bot
                </button>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Penting untuk Vercel:</h4>
                <p className="text-xs text-blue-700">
                  Pengaturan ini hanya tersimpan sementara. Untuk permanen, Anda <strong>wajib</strong> menambahkan variabel <code>VITE_VPS_URL</code> di menu Environment Variables pada dashboard Vercel Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
