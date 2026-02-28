import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, X, FileText, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

interface Report {
  id: number;
  residentId: number | string;
  residentName: string;
  title: string;
  description: string;
  date: string;
  status: string;
  image?: string; // Add image property
}

export function Reports() {
  const { role, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  // ... (rest of the component)

  // ... inside Detail Modal ...
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Deskripsi Laporan:</h4>
                    <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-100 whitespace-pre-wrap">
                      {selectedReport.description}
                    </div>
                    
                    {selectedReport.image && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Lampiran Foto:</h4>
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                          <img 
                            src={selectedReport.image} 
                            alt="Lampiran Laporan" 
                            className="w-full h-auto object-contain max-h-96 bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <a 
                          href={selectedReport.image} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 inline-block font-medium"
                        >
                          Buka gambar ukuran penuh
                        </a>
                      </div>
                    )}
                  </div>

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter data based on the logged-in user's RT code
        const filteredData = user?.rtId 
          ? data.filter((report: Report) => {
              // Assuming the report object has an 'rt' property or we can derive it.
              // If the report doesn't have an RT property directly, we might need to fetch residents to cross-reference,
              // but for now, let's assume the backend or the data structure includes it, or we filter by residentId if we know the resident's RT.
              // Since we don't have 'rt' in the Report interface, we'll need to rely on the backend to filter, OR
              // we can just show all reports for now if we can't filter here.
              // Let's add a check if the report has an 'rt' property (even if not in interface)
              const reportRt = (report as any).rt;
              if (reportRt) {
                return String(reportRt).toUpperCase() === String(user.rtId).toUpperCase();
              }
              return true; // If no RT info on report, show it (fallback)
            })
          : data;

        if (role === 'resident' && user) {
          setReports(filteredData.filter((r: Report) => {
            const reportResidentId = String(r.residentId);
            const userId = String(user.id);
            const userNik = user.nik ? String(user.nik) : '';
            
            // Check if report belongs to user by ID (web) or NIK (wa) or Phone (wa fallback)
            const userPhones = user.phone ? String(user.phone).split(',').map(p => p.trim().replace(/\D/g, '')) : [];
            const cleanReportId = reportResidentId.replace(/\D/g, '');
            
            return reportResidentId === userId || 
                   (userNik && reportResidentId === userNik) ||
                   (cleanReportId.length > 5 && userPhones.some(p => p.includes(cleanReportId) || cleanReportId.includes(p)));
          }));
        } else {
          setReports(filteredData.reverse());
        }
      } else {
        console.error("Data is not an array:", data);
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newReport = {
      residentId: user.id,
      residentName: user.name, // Ensure residentName is sent
      title,
      description,
      date: new Date().toISOString().split('T')[0],
      rt: user.rtId || "", // Include RT code for filtering
    };

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });

      if (response.ok) {
        fetchReports();
        setIsAddModalOpen(false);
        setTitle("");
        setDescription("");
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchReports();
        if (selectedReport) {
          setSelectedReport({ ...selectedReport, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Semua" || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai': return 'bg-green-100 text-green-700 border-green-200';
      case 'Diproses': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Ditolak': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Selesai': return <CheckCircle size={16} />;
      case 'Ditolak': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const isWhatsAppReport = (title: string) => title.startsWith('[WA]');

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Warga</h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'admin' ? 'Kelola laporan dan keluhan dari warga (via WhatsApp)' : 'Daftar laporan yang Anda sampaikan via WhatsApp'}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari laporan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => {
              setSelectedReport(report);
              setIsDetailModalOpen(true);
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
          >
            {isWhatsAppReport(report.title) && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <MessageSquare size={12} /> WhatsApp
              </div>
            )}

            <div className="flex justify-between items-start mb-4 mt-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(report.status)}`}>
                {getStatusIcon(report.status)}
                {report.status}
              </div>
              <span className="text-xs text-slate-400 font-medium">{report.date}</span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
              {isWhatsAppReport(report.title) ? report.title.replace('[WA] ', '') : report.title}
            </h3>
            
            <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1 whitespace-pre-line">
              {report.description}
            </p>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-slate-400" />
                {report.residentName}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReport(report);
                  setIsDetailModalOpen(true);
                }}
                className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1"
              >
                Detail <AlertCircle size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {filteredReports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 border-dashed">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Tidak ada laporan ditemukan</p>
            <p className="text-sm">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Add Report Modal Removed */}

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Detail Laporan
                  {isWhatsAppReport(selectedReport.title) && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <MessageSquare size={12} /> via WhatsApp
                    </span>
                  )}
                </h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800">
                        {isWhatsAppReport(selectedReport.title) ? selectedReport.title.replace('[WA] ', '') : selectedReport.title}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(selectedReport.status)}`}>
                        {getStatusIcon(selectedReport.status)}
                        {selectedReport.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={14} /> {selectedReport.date}</span>
                      <span className="flex items-center gap-1"><User size={14} /> {selectedReport.residentName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Deskripsi Laporan:</h4>
                    <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-100 whitespace-pre-wrap">
                      {selectedReport.description}
                    </div>
                  </div>

                  {role === 'admin' && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Update Status Laporan</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(selectedReport.id, status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                              selectedReport.status === status 
                                ? getStatusColor(status)
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
