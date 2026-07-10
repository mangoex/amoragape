import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, GitBranch, Activity, X, AlertTriangle, ExternalLink } from 'lucide-react';

interface SurveyLevel {
  id?: string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  clinicalApproach: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Survey CRUD State
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyFormData, setSurveyFormData] = useState({ name: '', description: '' });
  const [isSurveySubmitting, setIsSurveySubmitting] = useState(false);

  const [showSurveyDeleteConfirm, setShowSurveyDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

  // Level CRUD State
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SurveyLevel | null>(null);
  const [targetSurveyId, setTargetSurveyId] = useState<string>('');
  const [levelFormData, setLevelFormData] = useState({
    name: '',
    minScore: 0,
    maxScore: 186,
    description: '',
    clinicalApproach: ''
  });
  const [isLevelSubmitting, setIsLevelSubmitting] = useState(false);

  const [showLevelDeleteConfirm, setShowLevelDeleteConfirm] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<{ surveyId: string; levelId: string; name: string } | null>(null);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/surveys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setSurveys(data);
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].id);
      }
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

  // Survey Handlers
  const handleNewSurveyClick = () => {
    setSelectedSurvey(null);
    setSurveyFormData({ name: '', description: '' });
    setShowSurveyModal(true);
  };

  const handleEditSurveyClick = (e: React.MouseEvent, survey: Survey) => {
    e.stopPropagation();
    setSelectedSurvey(survey);
    setSurveyFormData({ name: survey.name, description: survey.description || '' });
    setShowSurveyModal(true);
  };

  const handleDeleteSurveyClick = (e: React.MouseEvent, survey: Survey) => {
    e.stopPropagation();
    setSurveyToDelete(survey);
    setShowSurveyDeleteConfirm(true);
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSurveySubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const isEditing = !!selectedSurvey;
      const url = isEditing ? `/api/surveys/${selectedSurvey.id}` : '/api/surveys';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surveyFormData)
      });

      if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }

      if (res.ok) {
        setShowSurveyModal(false);
        setSelectedSurvey(null);
        setSurveyFormData({ name: '', description: '' });
        fetchSurveys();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar violentómetro');
      }
    } catch(e) {
      console.error(e);
      alert('Fallo de red al guardar violentómetro');
    } finally {
      setIsSurveySubmitting(false);
    }
  };

  const handleDeleteSurvey = async () => {
    if (!surveyToDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/surveys/${surveyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        setShowSurveyDeleteConfirm(false);
        setSurveyToDelete(null);
        fetchSurveys();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al eliminar violentómetro');
      }
    } catch(e) {
      console.error(e);
      alert('Error de red al eliminar violentómetro');
    }
  };

  // Level Handlers
  const handleNewLevelClick = (surveyId: string) => {
    setSelectedLevel(null);
    setTargetSurveyId(surveyId);
    setLevelFormData({
      name: '',
      minScore: 0,
      maxScore: 186,
      description: '',
      clinicalApproach: ''
    });
    setShowLevelModal(true);
  };

  const handleEditLevelClick = (surveyId: string, level: SurveyLevel) => {
    setSelectedLevel(level);
    setTargetSurveyId(surveyId);
    setLevelFormData({
      name: level.name,
      minScore: level.minScore,
      maxScore: level.maxScore,
      description: level.description || '',
      clinicalApproach: level.clinicalApproach || ''
    });
    setShowLevelModal(true);
  };

  const handleDeleteLevelClick = (surveyId: string, levelId: string, name: string) => {
    setLevelToDelete({ surveyId, levelId, name });
    setShowLevelDeleteConfirm(true);
  };

  const handleSubmitLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLevelSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const isEditing = !!selectedLevel;
      const url = isEditing 
        ? `/api/surveys/${targetSurveyId}/levels/${selectedLevel.id}` 
        : `/api/surveys/${targetSurveyId}/levels`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(levelFormData)
      });

      if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }

      if (res.ok) {
        setShowLevelModal(false);
        setSelectedLevel(null);
        fetchSurveys();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar nivel clínico');
      }
    } catch(e) {
      console.error(e);
      alert('Fallo de red al guardar nivel clínico');
    } finally {
      setIsLevelSubmitting(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!levelToDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/surveys/${levelToDelete.surveyId}/levels/${levelToDelete.levelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        setShowLevelDeleteConfirm(false);
        setLevelToDelete(null);
        fetchSurveys();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al eliminar nivel clínico');
      }
    } catch(e) {
      console.error(e);
      alert('Error de red al eliminar nivel clínico');
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
          onClick={handleNewSurveyClick}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Nuevo Violentómetro
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Cargando violentómetros...</div>
        ) : surveys.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">No hay violentómetros registrados.</div>
        ) : (
          surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
              {/* Header */}
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50"
                onClick={() => toggleExpand(survey.id)}
              >
                <div>
                  <h3 className="text-xl font-bold text-[#07070F]">{survey.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <a 
                      href={`/?survey=${survey.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer flex items-center justify-center" 
                      title="Responder / Ver Encuesta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button 
                      className="p-2 text-gray-400 hover:text-[#7C3AED] transition-colors rounded-lg hover:bg-gray-100 cursor-pointer" 
                      onClick={(e) => handleEditSurveyClick(e, survey)} 
                      title="Editar Datos Generales"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer" 
                      onClick={(e) => handleDeleteSurveyClick(e, survey)} 
                      title="Eliminar Violentómetro"
                    >
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
                  
                  {/* Flujo Adaptativo Informativo */}
                  <div className="mb-8 bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-inner">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-3">
                      <GitBranch size={18} className="text-[#7C3AED]" /> 
                      Flujo Adaptativo Configurado (Fórmula SDD)
                    </h4>
                    <p className="text-gray-300 text-sm mb-4">
                      El sistema optimiza la duración de la prueba para prevenir fatiga y proteger emocionalmente al paciente en situaciones extremas.
                    </p>
                    <div className="flex items-center gap-3 text-xs font-mono bg-black/50 p-3 rounded-lg border border-gray-800 overflow-x-auto">
                      <span className="text-gray-400 px-2 py-1 bg-gray-800 rounded">Dom 1 (Q01-Q08)</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-amber-400 px-2 py-1 border border-amber-900 bg-amber-900/30 rounded">¿Suma &lt; 3?</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-emerald-400 px-2 py-1 border border-emerald-900 bg-emerald-900/30 rounded">Sí: Salto a Dom 3</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-rose-400 px-2 py-1 border border-rose-900 bg-rose-900/30 rounded">No: Muestra Dom 2</span>
                    </div>
                  </div>

                  {/* Matriz de Puntuaciones */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <Activity size={18} className="text-[#7C3AED]" /> 
                        Matriz de Puntuaciones y Zonas Clínicas
                      </h4>
                      <button 
                        onClick={() => handleNewLevelClick(survey.id)}
                        className="text-[#7C3AED] text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        <Plus size={16}/> Añadir Zona
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {survey.levels && survey.levels.map((level, idx) => {
                        const colors = getLevelColors(level.name);
                        return (
                          <div key={level.id || idx} className="p-5 rounded-xl border-l-4 bg-white border border-gray-200 shadow-sm relative group" style={{ borderLeftColor: `var(--tw-colors-${colors.border})` }}>
                            
                            {/* Action overlay buttons */}
                            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditLevelClick(survey.id, level)}
                                className="p-1.5 text-gray-400 hover:text-[#7C3AED] hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                title="Editar Zona"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLevelClick(survey.id, level.id || '', level.name)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                title="Eliminar Zona"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="flex justify-between items-start mb-2 pr-12">
                              <h5 className={`font-bold ${colors.text}`}>{level.name}</h5>
                              <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {level.minScore} - {level.maxScore} pts
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {level.description}
                            </p>
                            {level.clinicalApproach && (
                              <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
                                <strong className="text-gray-700">Enfoque Clínico:</strong> {level.clinicalApproach}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar Violentómetro */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">{selectedSurvey ? 'Editar Violentómetro' : 'Clonar Estructura'}</h3>
              <button onClick={() => { setShowSurveyModal(false); setSelectedSurvey(null); }} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitSurvey} className="p-6 space-y-4">
              {!selectedSurvey && (
                <p className="text-sm text-gray-500 mb-4">
                  Se generará un nuevo violentómetro conservando la misma estructura clínica base de niveles y fórmulas adaptativas.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Instrumento</label>
                <input 
                  required
                  type="text" 
                  value={surveyFormData.name}
                  onChange={(e) => setSurveyFormData({...surveyFormData, name: e.target.value})}
                  placeholder="Ej. Autoviolentómetro Laboral"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve</label>
                <textarea 
                  required
                  rows={3}
                  value={surveyFormData.description}
                  onChange={(e) => setSurveyFormData({...surveyFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowSurveyModal(false); setSelectedSurvey(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSurveySubmitting}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors font-medium disabled:opacity-70 cursor-pointer"
                >
                  {isSurveySubmitting ? 'Guardando...' : selectedSurvey ? 'Guardar Cambios' : 'Crear y Clonar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Nivel Clínico */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">{selectedLevel ? 'Editar Zona Clínica' : 'Añadir Zona Clínica'}</h3>
              <button onClick={() => { setShowLevelModal(false); setSelectedLevel(null); }} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitLevel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Zona</label>
                <input 
                  required
                  type="text" 
                  value={levelFormData.name}
                  onChange={(e) => setLevelFormData({...levelFormData, name: e.target.value})}
                  placeholder="Ej. ZONA CRÍTICA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Mínima</label>
                  <input 
                    required
                    type="number" 
                    min={0}
                    max={186}
                    value={levelFormData.minScore}
                    onChange={(e) => setLevelFormData({...levelFormData, minScore: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Máxima</label>
                  <input 
                    required
                    type="number" 
                    min={0}
                    max={186}
                    value={levelFormData.maxScore}
                    onChange={(e) => setLevelFormData({...levelFormData, maxScore: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Diagnóstico</label>
                <textarea 
                  required
                  rows={3}
                  value={levelFormData.description}
                  onChange={(e) => setLevelFormData({...levelFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enfoque Clínico y Recomendaciones</label>
                <textarea 
                  required
                  rows={2}
                  value={levelFormData.clinicalApproach}
                  onChange={(e) => setLevelFormData({...levelFormData, clinicalApproach: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowLevelModal(false); setSelectedLevel(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLevelSubmitting}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors font-medium disabled:opacity-70 cursor-pointer"
                >
                  {isLevelSubmitting ? 'Guardando...' : selectedLevel ? 'Guardar Cambios' : 'Añadir Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrar Violentómetro */}
      {showSurveyDeleteConfirm && surveyToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-bold">¿Eliminar Violentómetro?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar permanentemente el violentómetro <strong>{surveyToDelete.name}</strong>? Esta acción no se puede deshacer y eliminará todas sus zonas clínicas y resultados de pacientes en cascada.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setShowSurveyDeleteConfirm(false); setSurveyToDelete(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteSurvey}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrar Nivel Clínico */}
      {showLevelDeleteConfirm && levelToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-bold">¿Eliminar Zona Clínica?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar permanentemente la zona <strong>{levelToDelete.name}</strong> de este violentómetro? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setShowLevelDeleteConfirm(false); setLevelToDelete(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteLevel}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
