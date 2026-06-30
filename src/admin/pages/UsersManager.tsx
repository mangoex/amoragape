import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Shield } from 'lucide-react';

export function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-[#07070F]">Directorio de Usuarios</h2>
          <p className="text-gray-500 mt-1">Administra los accesos de pacientes y personal de la clínica.</p>
        </div>
        <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <UserPlus size={18} />
          Registrar Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <th className="px-6 py-4 font-medium">Nombre Completo</th>
              <th className="px-6 py-4 font-medium">Correo Electrónico</th>
              <th className="px-6 py-4 font-medium">Rol</th>
              <th className="px-6 py-4 font-medium">Fecha de Registro</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-[#07070F] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-sm font-bold text-gray-600">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  {user.name || 'Sin nombre'}
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  {user.role === 'ADMIN' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#7C3AED] bg-[#F3F4F6] px-2 py-1 rounded-full w-fit">
                      <Shield size={12} /> Administrador
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full w-fit">
                      Paciente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-gray-700 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
