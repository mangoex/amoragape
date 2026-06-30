import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Settings, GitBranch, Activity, X } from 'lucide-react';

interface SurveyLevel {
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  clinicalApproach: string;
  color: string;
}

interface Survey {
  id: string;
  name: string;
  description: string;
  levels: SurveyLevel[];
  adaptiveRule?: string;
}

export function SurveysManager() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>('1');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/surveys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSurveys(data);
      if(data.length > 0) setExpandedId(data[0].id);
      setLoading(false);
    } catch (e) {
      console.error("Failed to load surveys", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', description: '' });
        fetchSurveys();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al crear violentómetro');
      }
    } catch(e) {
      console.error(e);
      alert('Fallo de red al crear violentómetro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelColors = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('VERDE')) return { border: 'emerald-500', text: 'text-emerald-500' };
    if (n.includes('AMARILLA')) return { border: 'amber-500', text: 'text-amber-500' };
    if (n.includes('ROJA')) return { border: 'red-500', text: 'text-red-500' };
    if (n.includes('CRÍTICA')) return { border: 'rose-700', text: 'text-rose-700' };
    return { border: 'gray-500', text: 'text-gray-700' };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-[#07070F]">Gestión de Violentómetros</h2>
          <p className="text-gray-500 mt-1">Configura las encuestas, sus zonas clínicas y el flujo adaptativo algorítmico.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Nuevo Violentómetro
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Cargando violentómetros...</div>
        ) : (
          surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
              {/* Header */}
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(survey.id)}
              >
                <div>
                  <h3 className="text-xl font-bold text-[#07070F]">{survey.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#7C3AED] transition-colors" onClick={(e) => { e.stopPropagation(); }} title="Editar Encuesta">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); }} title="Eliminar Encuesta">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="w-px h-6 bg-gray-200"></div>
                  <button className="text-gray-400">
                    {expandedId === survey.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>
              </div>

              {/* Contenido Expandido: Zonas y Flujo */}
              {expandedId === survey.id && (
                <div className="p-6 border-t border-gray-100 bg-[#F8F8FF]/50">
                  
                  {/* Flujo Adaptativo */}
                  {survey.adaptiveRule && (
                    <div className="mb-8 bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-inner">
                      <h4 className="text-white font-bold flex items-center gap-2 mb-3">
                        <GitBranch size={18} className="text-[#7C3AED]" /> 
                        Demostración del Flujo Adaptativo (Fórmula SDD)
                      </h4>
                      <p className="text-gray-300 text-sm mb-4">
                        El sistema optimiza el tiempo y fatiga del paciente mediante algoritmos de salto configurables.
                      </p>
                      <div className="flex items-center gap-3 text-xs font-mono bg-black/50 p-3 rounded-lg border border-gray-800 overflow-x-auto">
                        <span className="text-gray-400 px-2 py-1 bg-gray-800 rounded">Dom 1 (Q01-Q08)</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-amber-400 px-2 py-1 border border-amber-900 bg-amber-900/30 rounded">¿Suma &lt; 3?</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 px-2 py-1 border border-emerald-900 bg-emerald-900/30 rounded">Sí: Salto a Dom 3</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-rose-400 px-2 py-1 border border-rose-900 bg-rose-900/30 rounded">No: Muestra Dom 2</span>
                        
                        <button className="ml-auto text-gray-400 hover:text-white"><Edit2 size={14}/></button>
                      </div>
                    </div>
                  )}

                  {/* Matriz de Puntuaciones */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <Activity size={18} className="text-[#7C3AED]" /> 
                        Matriz de Puntuaciones y Zonas Clínicas
                      </h4>
                      <button className="text-[#7C3AED] text-sm font-medium hover:underline flex items-center gap-1">
                        <Plus size={16}/> Añadir Zona
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {survey.levels && survey.levels.map((level, idx) => {
                        const colors = getLevelColors(level.name);
                        return (
                        <div key={idx} className={`p-5 rounded-xl border-l-4 bg-white border border-gray-200 shadow-sm relative group`} style={{ borderLeftColor: `var(--tw-colors-${colors.border})`, borderColor: `var(--tw-colors-${colors.border})` }}>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className={`font-bold ${colors.text}`}>{level.name}</h5>
                            <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {level.minScore} - {level.maxScore} pts
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {level.description}
                          </p>
                          <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
                            <strong className="text-gray-700">Enfoque Clínico:</strong> {level.clinicalApproach}
                          </div>
                          
                          {/* Overlay para editar (hover) */}
                          <button className="absolute top-4 right-20 text-gray-400 hover:text-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 size={16}/>
                          </button>
                        </div>
                      )})}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Encuesta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">Clonar Estructura</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSurvey} className="p-6 space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Se generará un nuevo violentómetro conservando la misma estructura de niveles (Zonas de Riesgo) y fórmulas adaptativas.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Herramienta</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej. Violentómetro Estudiantil"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors font-medium disabled:opacity-70"
                >
                  {isSubmitting ? 'Creando...' : 'Crear y Clonar Estructura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
