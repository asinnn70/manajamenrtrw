import { Database, HardDrive, Save, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import React from "react";

interface DbStatus {
  status: string;
  type: string;
  residentCount: number;
  location: string;
  configSource?: string;
  databaseUrl?: string;
}

export function Settings() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [dbConfig, setDbConfig] = useState({ url: '', authToken: '' });
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data);
      } else {
        setDbStatus({
          status: 'Error',
          type: data.type || 'Unknown',
          residentCount: 0,
          location: data.message || 'Gagal terhubung ke database'
        });
      }
    } catch (error) {
      console.error("Failed to fetch DB status", error);
      setDbStatus({
        status: 'Error',
        type: '-',
        residentCount: 0,
        location: 'Terjadi kesalahan koneksi'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/db-config');
      const data = await res.json();
      setDbConfig(data);
    } catch (error) {
      console.error("Failed to fetch DB config", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchStatus();
      } else {
        alert(`Gagal: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error("Save config failed:", error);
      alert("Terjadi kesalahan koneksi saat menyimpan konfigurasi.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleReset = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data warga? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        alert("Database berhasil direset.");
        fetchStatus();
      } else {
        alert("Gagal mereset database.");
      }
    } catch (error) {
      console.error("Reset failed:", error);
      alert("Terjadi kesalahan saat mereset database.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });

      try {
        const res = await fetch('/api/residents/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          const result = await res.json();
          alert(result.message);
          fetchStatus();
        } else {
          const error = await res.json();
          alert(`Gagal import: ${error.error}`);
        }
      } catch (error) {
        console.error("Import failed:", error);
        alert("Terjadi kesalahan saat import data.");
      }
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="text-indigo-600" size={24} />
          Pengaturan Database
        </h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Status Koneksi</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dbStatus?.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {dbStatus?.status || 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Tipe Database</span>
              <span className="text-sm font-mono text-slate-700">{dbStatus?.type || '-'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Lokasi File</span>
              <span className="text-sm font-mono text-slate-700">{dbStatus?.location || '-'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Total Data Warga</span>
              <span className="text-sm font-bold text-slate-700">{dbStatus?.residentCount || 0}</span>
            </div>
            {dbStatus?.configSource && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Sumber Konfigurasi</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase">{dbStatus.configSource}</span>
              </div>
            )}
            {dbStatus?.databaseUrl && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-[10px] font-medium text-slate-400 block mb-1 uppercase tracking-wider">Database URL Aktif</span>
                <span className="text-[9px] font-mono text-slate-500 break-all leading-tight block bg-white p-1.5 rounded border border-slate-100">{dbStatus.databaseUrl}</span>
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
            
            <button 
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <Save size={18} />
              Backup Database
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Upload size={18} />
                Import CSV
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />

              <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
                Reset Data
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-2">
              Format CSV: name,nik,address,rt,rw,status,phone
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="text-indigo-600" size={24} />
          Konfigurasi Supabase (PostgreSQL)
        </h3>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supabase Connection String (URI)</label>
            <input 
              type="text" 
              value={dbConfig.url}
              onChange={(e) => setDbConfig({ ...dbConfig, url: e.target.value })}
              placeholder="postgres://postgres.[user]:[pass]@[host]:5432/postgres"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Dapatkan di Supabase Dashboard: Project Settings &gt; Database &gt; Connection string &gt; URI
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Auth Token (Opsional)</label>
            <input 
              type="password" 
              value={dbConfig.authToken}
              onChange={(e) => setDbConfig({ ...dbConfig, authToken: e.target.value })}
              placeholder="Hanya jika diperlukan oleh proxy/pooler Anda"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            type="submit"
            disabled={savingConfig}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {savingConfig ? "Menghubungkan..." : "Simpan Konfigurasi"}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
            🚀 Solusi Koneksi Supabase (Vercel)
          </h4>
          <div className="text-xs text-indigo-700 space-y-3">
            <p className="p-2 bg-white rounded border border-indigo-100">
              <strong>1. Gunakan Port 6543 (Transaction Pooler):</strong><br />
              Vercel sering memblokir port <code>5432</code>. Pastikan URL Anda menggunakan port <strong>6543</strong>.
            </p>
            <p>
              <strong>2. Masalah Timeout:</strong><br />
              Jika muncul "Kesalahan koneksi", biasanya karena Vercel membatasi waktu eksekusi (10 detik). Pastikan database Supabase Anda tidak sedang dalam status "Paused".
            </p>
            <p>
              <strong>3. Environment Variable:</strong><br />
              Sangat disarankan memasukkan <code>SUPABASE_DB_URL</code> langsung di Dashboard Vercel agar koneksi lebih stabil dan permanen.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HardDrive className="text-slate-600" size={24} />
          Informasi Sistem
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Versi Aplikasi</span>
            <span className="text-sm font-medium text-slate-800">v1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Environment</span>
            <span className="text-sm font-medium text-slate-800">Development</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Server Time</span>
            <span className="text-sm font-medium text-slate-800">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
