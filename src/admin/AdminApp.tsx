import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  BarChart,
  LogOut 
} from 'lucide-react';

import { Dashboard } from './pages/Dashboard';
import { SurveysManager } from './pages/SurveysManager';
import { ResultsViewer } from './pages/ResultsViewer';
import { UsersManager } from './pages/UsersManager';
import { Login } from './pages/Login';

export function AdminApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token && location.pathname !== '/admin/login') {
      navigate('/admin/login');
    }
  }, [token, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F8FF] text-[#07070F] font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-playfair font-bold text-[#7C3AED]">Amor Ágape</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Admin Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F3F4F6] text-[#7C3AED] font-medium transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/admin/surveys" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-[#F3F4F6] hover:text-[#7C3AED] transition-colors">
            <FileText size={20} />
            Violentómetros
          </Link>
          <Link to="/admin/results" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-[#F3F4F6] hover:text-[#7C3AED] transition-colors">
            <BarChart size={20} />
            Resultados
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-[#F3F4F6] hover:text-[#7C3AED] transition-colors">
            <Users size={20} />
            Usuarios
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-[#F3F4F6] hover:text-[#7C3AED] transition-colors">
            <Settings size={20} />
            Configuración
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            Salir (Cerrar Sesión)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/surveys" element={<SurveysManager />} />
          <Route path="/results" element={<ResultsViewer />} />
          <Route path="/users" element={<UsersManager />} />
        </Routes>
      </main>
    </div>
  );
}
