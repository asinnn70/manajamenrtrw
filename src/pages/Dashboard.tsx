import { Users, FileText, Wallet, ArrowUpRight, ArrowDownRight, Calendar, MapPin, Clock, Heart, User } from 'lucide-react';
import { financeData, letters, activities } from '@/data/mockData';
import { useEffect, useState } from 'react';
import { Resident, Transaction } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { useAuth } from '@/context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Dashboard() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resResidents, resTransactions] = await Promise.all([
          fetch('/api/residents'),
          fetch('/api/transactions')
        ]);
        if (!resResidents.ok || !resTransactions.ok) throw new Error('Network response was not ok');
        const dataResidents = await resResidents.json();
        const dataTransactions = await resTransactions.json();
        
        if (Array.isArray(dataResidents)) {
          const filteredResidents = user?.rtId
            ? dataResidents.filter((r: Resident) => String(r.rt).toUpperCase() === String(user.rtId).toUpperCase())
            : dataResidents;
          setResidents(filteredResidents);
        }
        if (Array.isArray(dataTransactions)) {
          const filteredTransactions = user?.rtId
            ? dataTransactions.filter((t: any) => {
                if (t.rt) {
                  return String(t.rt).toUpperCase() === String(user.rtId).toUpperCase();
                }
                return true;
              })
            : dataTransactions;
          setTransactions(filteredTransactions);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalResidents = residents.length;
  const pendingLetters = letters.filter(l => l.status === 'Menunggu').length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const processChartData = () => {
    if (transactions.length === 0) return financeData; // Fallback to mock data if no transactions

    const monthlyData: Record<string, { income: number, expense: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthlyData[`${months[d.getMonth()]} ${d.getFullYear()}`] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyData[key]) {
        if (t.type === 'income') monthlyData[key].income += t.amount;
        else monthlyData[key].expense += t.amount;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const chartData = processChartData();

  const residentStatusData = [
    { name: 'Tetap', value: residents.filter(r => r.status === 'Tetap').length },
    { name: 'Kontrak', value: residents.filter(r => r.status === 'Kontrak').length },
    { name: 'Kost', value: residents.filter(r => r.status === 'Kost').length },
  ];

  const maleCount = residents.filter(r => r.gender === 'Laki-laki').length;
  const femaleCount = residents.filter(r => r.gender === 'Perempuan').length;
  const singleCount = residents.filter(r => r.maritalStatus === 'Lajang').length;
  const marriedCount = residents.filter(r => r.maritalStatus === 'Menikah').length;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Warga</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{totalResidents}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <User size={14} className="mr-1.5 text-blue-500" />
              <span className="font-medium">{maleCount} L</span>
            </div>
            <div className="flex items-center text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <User size={14} className="mr-1.5 text-pink-500" />
              <span className="font-medium">{femaleCount} P</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Status Pernikahan</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{marriedCount}</h3>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Menikah</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{singleCount}</h3>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Lajang</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-600">
              <Heart size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Kas Masuk (YTD)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">Rp {totalIncome.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
              <Wallet size={22} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-emerald-600 bg-emerald-50/50 w-fit px-2.5 py-1 rounded-md border border-emerald-100/50">
            <ArrowUpRight size={16} className="mr-1" />
            <span className="font-semibold">+12%</span>
            <span className="text-slate-500 ml-1.5 font-medium">dari tahun lalu</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pengeluaran (YTD)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">Rp {totalExpense.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
              <ArrowDownRight size={22} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-red-600 bg-red-50/50 w-fit px-2.5 py-1 rounded-md border border-red-100/50">
            <span className="font-semibold">+5%</span>
            <span className="text-slate-500 ml-1.5 font-medium">dari bulan lalu</span>
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Kegiatan Berlangsung</h3>
          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Lihat Semua &rarr;</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity.id} className="p-5 rounded-xl border border-slate-200/60 hover:border-indigo-300 hover:shadow-md transition-all group bg-slate-50/50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{activity.title}</h4>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  activity.status === 'Berlangsung' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  activity.status === 'Akan Datang' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  'bg-slate-200 text-slate-700 border border-slate-300'
                }`}>
                  {activity.status}
                </span>
              </div>
              <div className="space-y-2.5 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{activity.date}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-slate-400" />
                  <span>{activity.time}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{activity.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Statistik Keuangan</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(value) => `Rp ${value/1000000}jt`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="income" name="Pemasukan" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Status Kependudukan</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={residentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {residentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {residentStatusData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600 font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-800">{entry.value} <span className="text-slate-400 font-normal text-xs ml-1">Warga</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
