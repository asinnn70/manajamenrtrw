import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Resident } from "@/types";
import { CreditCard } from "lucide-react";

export function PrintCard() {
  const { id } = useParams();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const response = await fetch('/api/residents');
        const data = await response.json();
        const found = data.find((r: Resident) => r.id === Number(id));
        setResident(found || null);
      } catch (error) {
        console.error("Failed to fetch resident:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResident();
    }
  }, [id]);

  useEffect(() => {
    if (resident && !loading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [resident, loading]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!resident) {
    return <div className="p-8 text-center">Warga tidak ditemukan</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8 flex justify-center items-start">
      <div id="resident-card" className="w-[400px] bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden print:shadow-none print:rounded-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-wide">KARTU TANDA WARGA</h2>
              <p className="text-xs text-indigo-100 opacity-80">RUKUN TETANGGA {resident.rt} / RW {resident.rw}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Nama Lengkap</p>
              <p className="font-semibold text-lg">{resident.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">NIK</p>
                <p className="font-mono text-sm">{resident.nik}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Status</p>
                <p className="text-sm">{resident.status}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Hubungan Keluarga</p>
              <p className="text-sm">{resident.familyRelationship}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-indigo-200 mb-0.5">Alamat</p>
              <p className="text-sm leading-snug opacity-90">{resident.address}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
            <div className="text-[10px] text-indigo-200">
              Berlaku hingga: <span className="text-white">Seumur Hidup</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-indigo-200 mb-1">Ketua RT {resident.rt}</p>
              <div className="h-8 w-20 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
