import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center px-5 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: "linear-gradient(135deg,#4f7fff,#9b5cff)" }}>
        <span className="text-2xl font-bold text-white">404</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page not found</h1>
      <p className="text-sm text-slate-400 mb-8 max-w-xs">The page you're looking for doesn't exist or was moved.</p>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <ChevronLeft size={14} /> Go back
        </button>
        <button onClick={() => navigate("/")}
          className="px-4 py-2.5 rounded-xl wave-gradient text-white text-sm font-medium shadow-sm hover:opacity-90 transition-all">
          Go home
        </button>
      </div>
    </div>
  );
}
