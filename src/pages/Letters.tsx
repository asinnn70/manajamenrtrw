import { FileText, Clock, CheckCircle, XCircle, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { Letter, Resident } from "@/types";
import { useAuth } from "@/context/AuthContext";

export function Letters() {
  const { role, user } = useAuth();
  const [lettersList, setLettersList] = useState<Letter[]>([]);
  const [residentsList, setResidentsList] = useState<Resident[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [newLetter, setNewLetter] = useState({ 
    type: "Surat Pengantar KTP", 
    resident: role === 'resident' && user ? user.name : "", 
    status: "Proses", 
    content: "" 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLetters, resResidents] = await Promise.all([
          fetch('/api/letters'),
          fetch('/api/residents')
        ]);
        
        const dataLetters = await resLetters.json();
        const dataResidents = await resResidents.json();
        
        if (resLetters.ok && Array.isArray(dataLetters)) {
          // Filter letters based on RT if possible, or just show all for admin if no RT info on letter
          // Ideally, letters should have an RT field. If not, we might need to cross-reference with residents.
          // For now, let's assume we can filter by RT if it exists, otherwise show all for admin.
          const filteredLetters = user?.rtId 
            ? dataLetters.filter((letter: any) => {
                if (letter.rt) {
                  return String(letter.rt).toUpperCase() === String(user.rtId).toUpperCase();
                }
                return true; // Fallback if no RT info
              })
            : dataLetters;

          if (role === 'resident' && user) {
            setLettersList(filteredLetters.filter((l: Letter) => l.resident === user.name));
          } else {
            setLettersList(filteredLetters);
          }
        } else {
          console.error("Failed to fetch letters or invalid format:", dataLetters);
          setLettersList([]);
        }

        if (resResidents.ok && Array.isArray(dataResidents)) {
          const filteredResidents = user?.rtId
            ? dataResidents.filter((r: Resident) => String(r.rt).toUpperCase() === String(user.rtId).toUpperCase())
            : dataResidents;
          setResidentsList(filteredResidents);
        } else {
          console.error("Failed to fetch residents or invalid format:", dataResidents);
          setResidentsList([]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLettersList([]);
        setResidentsList([]);
      }
    };
    fetchData();
  }, [role, user]);

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { ...newLetter, date: today };
      
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setLettersList([created, ...lettersList]);
        setIsCreateModalOpen(false);
        setNewLetter({ 
          type: "Surat Pengantar KTP", 
          resident: role === 'resident' && user ? user.name : "", 
          status: "Proses", 
          content: "" 
        });
      }
    } catch (error) {
      console.error("Failed to create letter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (letter: Letter) => {
    setSelectedLetter(letter);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Semua
          </button>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          Buat Surat Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lettersList.map((letter, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg`}>
                <FileText size={24} />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                {letter.status}
              </span>
            </div>
            
            <h4 className="font-semibold text-slate-800 mb-1">{letter.type}</h4>
            <p className="text-sm text-slate-500 mb-4">Pemohon: {letter.resident}</p>
            
            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                {letter.date}
              </div>
              <button 
                onClick={() => handleViewDetail(letter)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Lihat Detail
              </button>
            </div>
          </div>
        ))}
        {lettersList.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-12">
            Belum ada surat.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Detail Surat</h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900">{selectedLetter.type}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                    {selectedLetter.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">Pemohon: <span className="font-medium text-slate-900">{selectedLetter.resident}</span></p>
                <p className="text-sm text-slate-600">Tanggal: {selectedLetter.date}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">Keterangan / Keperluan</h5>
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[100px]">
                  {selectedLetter.content || "Tidak ada keterangan tambahan."}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Buat Surat Baru</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateLetter} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jenis Surat</label>
                <select 
                  required
                  value={newLetter.type}
                  onChange={e => setNewLetter({...newLetter, type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Surat Pengantar KTP">Surat Pengantar KTP</option>
                  <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                  <option value="Surat Pengantar Nikah">Surat Pengantar Nikah</option>
                  <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu</option>
                  <option value="Surat Keterangan Usaha">Surat Keterangan Usaha</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Pemohon</label>
                {role === 'resident' && user ? (
                  <input 
                    type="text"
                    readOnly
                    value={user.name}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  />
                ) : (
                  <select 
                    required
                    value={newLetter.resident}
                    onChange={e => setNewLetter({...newLetter, resident: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pilih Warga</option>
                    {residentsList.map((r, index) => (
                      <option key={r.nik} value={r.name}>{r.name} - {r.nik}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Keterangan / Keperluan</label>
                <textarea 
                  value={newLetter.content}
                  onChange={e => setNewLetter({...newLetter, content: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                  placeholder="Masukkan keterangan atau keperluan surat..."
                />
              </div>

              {role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status Awal</label>
                  <select 
                    required
                    value={newLetter.status}
                    onChange={e => setNewLetter({...newLetter, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
