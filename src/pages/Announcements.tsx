import { Bell, Calendar, ChevronRight, Plus, MessageCircle, X, Send } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { Resident, Announcement } from "@/types";
import { useAuth } from "@/context/AuthContext";

export function Announcements() {
  const { role } = useAuth();
  const [residentsList, setResidentsList] = useState<Resident[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", date: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resResidents, resAnnouncements] = await Promise.all([
          fetch('/api/residents'),
          fetch('/api/announcements')
        ]);
        const dataResidents = await resResidents.json();
        const dataAnnouncements = await resAnnouncements.json();
        setResidentsList(dataResidents);
        setAnnouncementsList(dataAnnouncements);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { ...newAnnouncement, date: today };
      
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setAnnouncementsList([created, ...announcementsList]);
        setIsCreateModalOpen(false);
        setNewAnnouncement({ title: "", content: "", date: "" });
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.slice(1);
    }
    return formatted;
  };

  const handleSendWhatsApp = (phone: string, announcement: Announcement) => {
    const formattedPhone = formatPhoneNumber(phone);
    const message = encodeURIComponent(
      `*PENGUMUMAN RT/RW*\n\n` +
      `*${announcement.title}*\n` +
      `${announcement.date}\n\n` +
      `${announcement.content}\n\n` +
      `Terima kasih.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Daftar Pengumuman</h2>
        {role === 'admin' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            Buat Pengumuman
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {announcementsList.map((announcement) => (
          <div 
            key={announcement.id} 
            onClick={() => role === 'admin' && setSelectedAnnouncement(announcement)}
            className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-colors group ${role === 'admin' ? 'cursor-pointer hover:border-indigo-200' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`p-3 bg-indigo-50 text-indigo-600 rounded-lg h-fit transition-colors ${role === 'admin' ? 'group-hover:bg-indigo-600 group-hover:text-white' : ''}`}>
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className={`font-semibold text-slate-800 text-lg transition-colors ${role === 'admin' ? 'group-hover:text-indigo-600' : ''}`}>{announcement.title}</h3>
                  <div className="flex items-center text-sm text-slate-500 mt-1 mb-3">
                    <Calendar size={14} className="mr-1" />
                    {announcement.date}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{announcement.content}</p>
                </div>
              </div>
              {role === 'admin' && (
                <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              )}
            </div>
          </div>
        ))}
        {announcementsList.length === 0 && (
          <p className="text-center text-slate-500 py-8">Belum ada pengumuman.</p>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Buat Pengumuman Baru</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Judul Pengumuman</label>
                <input 
                  type="text" 
                  required
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Kerja Bakti Minggu Ini"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Isi Pengumuman</label>
                <textarea 
                  required
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tuliskan detail pengumuman di sini..."
                />
              </div>

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
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  Simpan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <MessageCircle className="text-green-600" size={20} />
                Broadcast WhatsApp
              </h3>
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <h4 className="font-medium text-slate-800 mb-1">{selectedAnnouncement.title}</h4>
                <p className="text-sm text-slate-600">{selectedAnnouncement.content}</p>
              </div>

              <h4 className="font-medium text-slate-700 mb-3 flex items-center justify-between">
                <span>Daftar Penerima ({residentsList.length} Warga)</span>
              </h4>

              <div className="space-y-2">
                {residentsList.map((resident) => (
                  <div key={resident.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                    <div>
                      <p className="font-medium text-slate-800">{resident.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{resident.phone || "No Phone"}</p>
                    </div>
                    {resident.phone ? (
                      <button 
                        onClick={() => handleSendWhatsApp(resident.phone, selectedAnnouncement)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <Send size={14} />
                        Kirim WA
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic px-3 py-1.5">No Number</span>
                    )}
                  </div>
                ))}
                {residentsList.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Belum ada data warga.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
