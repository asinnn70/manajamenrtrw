import { Search, Plus, Filter, MoreHorizontal, X, CreditCard, Printer, User, FileText, Download } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { Resident } from "@/types";

export function Residents() {
  const [residentsList, setResidentsList] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Resident, 'id'>>({
    name: "",
    nik: "",
    familyCardNumber: "",
    address: "",
    rt: "",
    rw: "05",
    status: "Tetap",
    phone: "",
    gender: "Laki-laki",
    maritalStatus: "Lajang",
    familyRelationship: "Kepala Keluarga"
  });

  const [mutationData, setMutationData] = useState({
    type: 'Pindah',
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data)) {
        setResidentsList(data);
      } else {
        console.error("Data is not an array:", data);
        setResidentsList([]);
      }
    } catch (error) {
      console.error("Failed to fetch residents:", error);
      setResidentsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const newResident = await response.json();
        setResidentsList([newResident, ...residentsList]);
        setIsModalOpen(false);
        setFormData({
          name: "",
          nik: "",
          familyCardNumber: "",
          address: "",
          rt: "",
          rw: "05",
          status: "Tetap",
          phone: "",
          gender: "Laki-laki",
          maritalStatus: "Lajang",
          familyRelationship: "Kepala Keluarga"
        });
      }
    } catch (error) {
      console.error("Failed to add resident:", error);
    }
  };

  const handleShowCard = (resident: Resident) => {
    setSelectedResident(resident);
    setIsCardModalOpen(true);
  };

  const handleShowProfile = async (resident: Resident) => {
    setSelectedResident(resident);
    setIsProfileModalOpen(true);
    try {
      const response = await fetch(`/api/residents/${resident.id}/family`);
      const data = await response.json();
      setFamilyMembers(data);
    } catch (error) {
      console.error("Failed to fetch family members:", error);
      setFamilyMembers([]);
    }
  };

  const handlePrintCard = () => {
    if (selectedResident) {
      window.open(`/print/card/${selectedResident.id}`, '_blank');
    }
  };

  const handleMutation = (resident: Resident) => {
    setSelectedResident(resident);
    setIsMutationModalOpen(true);
    setMutationData({
      type: 'Pindah',
      date: new Date().toISOString().split('T')[0],
      details: ''
    });
  };

  const submitMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    try {
      const response = await fetch(`/api/residents/${selectedResident.id}/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutationData),
      });

      if (response.ok) {
        setIsMutationModalOpen(false);
        fetchResidents(); // Refresh list
      }
    } catch (error) {
      console.error("Mutation failed:", error);
    }
  };

  const handleExport = () => {
    if (residentsList.length === 0) return;
    
    const headers = [
      "ID", "Nama Lengkap", "NIK", "No. KK", "Alamat", "RT", "RW", 
      "Status", "No. HP", "Jenis Kelamin", "Status Pernikahan", "Hubungan Keluarga"
    ];
    
    const csvContent = [
      headers.join(","),
      ...residentsList.map(r => [
        r.id,
        `"${r.name}"`,
        `"${r.nik}"`,
        `"${r.familyCardNumber || ''}"`,
        `"${r.address}"`,
        r.rt,
        r.rw,
        r.status,
        `"${r.phone || ''}"`,
        r.gender,
        r.maritalStatus,
        r.familyRelationship
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Warga_RT01_RW05_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau NIK..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            Export
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            Tambah Warga
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Nama Lengkap</th>
                <th className="px-6 py-4 font-medium text-slate-500">NIK</th>
                <th className="px-6 py-4 font-medium text-slate-500">L/P</th>
                <th className="px-6 py-4 font-medium text-slate-500">Status Nikah</th>
                <th className="px-6 py-4 font-medium text-slate-500">Hubungan</th>
                <th className="px-6 py-4 font-medium text-slate-500">Alamat</th>
                <th className="px-6 py-4 font-medium text-slate-500">RT/RW</th>
                <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 font-medium text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residentsList.map((resident) => (
                <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{resident.name}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono">{resident.nik}</td>
                  <td className="px-6 py-4 text-slate-500">{resident.gender === 'Laki-laki' ? 'L' : 'P'}</td>
                  <td className="px-6 py-4 text-slate-500">{resident.maritalStatus}</td>
                  <td className="px-6 py-4 text-slate-500">{resident.familyRelationship}</td>
                  <td className="px-6 py-4 text-slate-500">{resident.address}</td>
                  <td className="px-6 py-4 text-slate-500">{resident.rt}/{resident.rw}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${resident.status === 'Tetap' ? 'bg-green-100 text-green-800' : 
                        resident.status === 'Kontrak' ? 'bg-blue-100 text-blue-800' : 
                        resident.status === 'Kost' ? 'bg-orange-100 text-orange-800' :
                        resident.status === 'Pindah' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {resident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button 
                      onClick={() => handleShowProfile(resident)}
                      className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700"
                      title="Lihat Profil"
                    >
                      <User size={18} />
                    </button>
                    <button 
                      onClick={() => handleShowCard(resident)}
                      className="p-1 hover:bg-indigo-50 rounded text-indigo-600 hover:text-indigo-700"
                      title="Kartu Warga"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button 
                      onClick={() => handleMutation(resident)}
                      className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700"
                      title="Mutasi Warga"
                    >
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">Menampilkan 1-{residentsList.length} dari {residentsList.length} warga</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Warga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Tambah Warga Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">NIK</label>
                  <input 
                    type="text" 
                    name="nik"
                    value={formData.nik}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nomor Induk Kependudukan"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">No. KK</label>
                  <input 
                    type="text" 
                    name="familyCardNumber"
                    value={formData.familyCardNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nomor Kartu Keluarga"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status Pernikahan</label>
                  <select 
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Lajang">Lajang</option>
                    <option value="Menikah">Menikah</option>
                    <option value="Janda">Janda</option>
                    <option value="Duda">Duda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hubungan Keluarga</label>
                  <select 
                    name="familyRelationship"
                    value={formData.familyRelationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Famili Lain">Famili Lain</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Alamat</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Alamat lengkap"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">RT</label>
                  <input 
                    type="text" 
                    name="rt"
                    value={formData.rt}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">RW</label>
                  <input 
                    type="text" 
                    name="rw"
                    value={formData.rw}
                    onChange={handleInputChange}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Kost">Kost</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Profil Warga</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Informasi Pribadi</h4>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">Nama Lengkap</p>
                        <p className="font-medium text-slate-900">{selectedResident.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">NIK</p>
                          <p className="font-mono text-sm text-slate-700">{selectedResident.nik}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">No. KK</p>
                          <p className="font-mono text-sm text-slate-700">{selectedResident.familyCardNumber || "-"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Jenis Kelamin</p>
                          <p className="text-sm text-slate-700">{selectedResident.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Status Pernikahan</p>
                          <p className="text-sm text-slate-700">{selectedResident.maritalStatus}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Hubungan Keluarga</p>
                        <p className="text-sm text-slate-700">{selectedResident.familyRelationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">No. Telepon</p>
                        <p className="text-sm text-slate-700">{selectedResident.phone || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Alamat</h4>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-700">{selectedResident.address}</p>
                      <p className="text-sm text-slate-700 mt-1">RT {selectedResident.rt} / RW {selectedResident.rw}</p>
                      <p className="text-sm text-slate-700 mt-1">Status Tempat Tinggal: <span className="font-medium">{selectedResident.status}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Anggota Keluarga</h4>
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {familyMembers.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {familyMembers.map((member) => (
                          <div key={member.id} className="p-3 hover:bg-slate-50 transition-colors">
                            <p className="font-medium text-slate-800 text-sm">{member.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-slate-500">{member.familyRelationship}</span>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{member.gender === 'Laki-laki' ? 'L' : 'P'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Tidak ada anggota keluarga lain yang terdaftar dalam KK yang sama.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kartu Warga Modal */}
      {isCardModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Kartu Warga</h3>
              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div 
                id="resident-card" 
                className="w-full bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden print:shadow-none print:rounded-none"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-wide">KARTU TANDA WARGA</h2>
                      <p className="text-xs text-indigo-100 opacity-80">RUKUN TETANGGA {selectedResident.rt} / RW {selectedResident.rw}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <CreditCard size={20} className="text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Nama Lengkap</p>
                      <p className="font-semibold text-lg">{selectedResident.name}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">NIK</p>
                        <p className="font-mono text-sm">{selectedResident.nik}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Status</p>
                        <p className="text-sm">{selectedResident.status}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Hubungan Keluarga</p>
                      <p className="text-sm">{selectedResident.familyRelationship}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Alamat</p>
                      <p className="text-sm leading-snug opacity-90">{selectedResident.address}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                    <div className="text-[10px] text-indigo-200">
                      Berlaku hingga: <span className="text-white">Seumur Hidup</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-indigo-200 mb-1">Ketua RT {selectedResident.rt}</p>
                      <div className="h-8 w-20 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3 w-full">
                <button 
                  onClick={handlePrintCard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Printer size={18} />
                  Cetak Kartu
                </button>
                <button 
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mutation Modal */}
      {isMutationModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Mutasi Warga</h3>
              <button 
                onClick={() => setIsMutationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitMutation} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                <p className="text-sm font-medium text-slate-900">{selectedResident.name}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{selectedResident.nik}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jenis Mutasi</label>
                <select 
                  value={mutationData.type}
                  onChange={(e) => setMutationData({...mutationData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Pindah">Pindah Domisili</option>
                  <option value="Meninggal">Meninggal Dunia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal</label>
                <input 
                  type="date"
                  value={mutationData.date}
                  onChange={(e) => setMutationData({...mutationData, date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {mutationData.type === 'Pindah' ? 'Alamat Tujuan / Keterangan' : 'Keterangan / Penyebab'}
                </label>
                <textarea 
                  value={mutationData.details}
                  onChange={(e) => setMutationData({...mutationData, details: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  placeholder={mutationData.type === 'Pindah' ? 'Masukkan alamat tujuan pindah...' : 'Masukkan keterangan tambahan...'}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
