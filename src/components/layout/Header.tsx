import { Bell, Search, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export function Header({ title }: { title: string }) {
  const { role, user } = useAuth();
  
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
      <div className="flex items-center justify-between px-8 py-4">
        <h2 className="text-xl font-bold text-slate-800 ml-10 lg:ml-0 tracking-tight">{title}</h2>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari data..." 
              className="pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all w-64"
            />
          </div>
          
          <button className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {role === 'admin' ? 'Ketua RT' : user?.name || 'Warga'}
              </p>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                {role === 'admin' ? 'RT 01 / RW 05' : 'Warga RT 01'}
              </p>
            </div>
            {role === 'resident' ? (
              <Link to="/profile" className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold border border-indigo-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <User size={18} />
              </Link>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                RT
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
