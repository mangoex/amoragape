import { useState, useMemo, useEffect } from 'react';
import { 
  Heart, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  Info, 
  Layers, 
  Smartphone, 
  MessageSquare, 
  AlertTriangle,
  User,
  Activity,
  HeartHandshake,
  HeartOff,
  Stethoscope,
  Code,
  Sun,
  Moon,
  Bug,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SURVEY_QUESTIONS, SCORE_ZONES, EMOTIONAL_EXERCISES, Question, ScoreZone } from './data';
import { FLUTTER_CODE_PROTOTYPE } from './flutter_code';

// ADAPTIVE FLOW ENGINE helper to rebuild active question sequence dynamically based on answers
export function getActiveQuestionsForAnswers(
  questionsList: Question[], 
  currentAnswers: Record<string, number>,
  surveyId?: string
): Question[] {
  if (!questionsList || questionsList.length === 0) return [];
  
  if (surveyId && surveyId !== 'cero-amor') {
    // Return all questions sequentially for other surveys
    return questionsList;
  }

  // Base Phase: The first 10 questions of Domain 1 (Q01 - Q10)
  const baseQuestions = questionsList.filter(q => q.dominio === 1).slice(0, 10);
  const allDom1 = questionsList.filter(q => q.dominio === 1);
  const allDom2 = questionsList.filter(q => q.dominio === 2);
  const allDom3 = questionsList.filter(q => q.dominio === 3);

  // Check if the base questions of Domain 1 are all answered
  let finishedBase = true;
  let baseScore = 0;

  baseQuestions.forEach(q => {
    const val = currentAnswers[q.id];
    if (val === undefined) {
      finishedBase = false;
    } else {
      baseScore += val;
    }
  });

  if (finishedBase) {
    if (baseScore < 3) {
      // SDD RULE: "Si el puntaje del Dominio 1 base es < 3, saltar al Dominio 3 de forma rápida para descartar riesgo vital"
      // Skip rest of Domain 1 (Q11-Q22) and entire Domain 2
      return [...baseQuestions, ...allDom3];
    } else {
      // Include everything
      return [...allDom1, ...allDom2, ...allDom3];
    }
  }

  // Default flow while still answering the base questions
  return baseQuestions;
}

const getZoneBgClass = (zoneName: string, dark: boolean) => {
  if (dark) {
    const zone = SCORE_ZONES.find(z => z.name === zoneName);
    return zone ? zone.bgLight : 'bg-white/5 border-white/10';
  } else {
    switch(zoneName) {
      case 'Verde': return 'bg-emerald-50/50 border-emerald-200/80 shadow-xs';
      case 'Amarilla': return 'bg-amber-50/50 border-amber-200/80 shadow-xs';
      case 'Roja': return 'bg-rose-50/50 border-rose-200/80 shadow-xs';
      case 'Crítica': return 'bg-red-50/50 border-red-200/80 shadow-xs';
      default: return 'bg-zinc-50 border-zinc-200';
    }
  }
};

const getZoneTextClass = (zoneName: string, dark: boolean) => {
  if (dark) {
    const zone = SCORE_ZONES.find(z => z.name === zoneName);
    return zone ? zone.textColor : 'text-white';
  } else {
    switch(zoneName) {
      case 'Verde': return 'text-emerald-700 font-extrabold';
      case 'Amarilla': return 'text-amber-700 font-extrabold';
      case 'Roja': return 'text-rose-700 font-extrabold';
      case 'Crítica': return 'text-red-700 font-black animate-pulse';
      default: return 'text-zinc-800';
    }
  }
};

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nicomaco_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Persist theme choice
  useEffect(() => {
    localStorage.setItem('nicomaco_theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Simulator Screens: 'splash' | 'onboarding' | 'auth' | 'survey' | 'results' | 'sos'
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'onboarding' | 'auth' | 'survey' | 'results' | 'sos'>('splash');
  
  // App Workspace State
  const [surveyData, setSurveyData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>(SURVEY_QUESTIONS);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surveyIdParam = params.get('survey');

    fetch('/api/surveys')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const selected = surveyIdParam 
            ? data.find((s: any) => s.id === surveyIdParam) 
            : data[0];
          setSurveyData(selected || data[0]);
        }
      })
      .catch(e => console.error("Could not load surveys:", e));
  }, []);

  useEffect(() => {
    if (!surveyData) return;
    
    if (surveyData.id === 'cero-amor') {
      setQuestions(SURVEY_QUESTIONS);
    } else {
      const jsonUrl = surveyData.id === 'cero-amor-paternal' ? '/cero_amor_paternal.json' :
                      surveyData.id === 'cero-amor-maternal' ? '/cero_amor_maternal.json' :
                      '/amor_agape.json';
                      
      fetch(jsonUrl)
        .then(res => res.json())
        .then(json => {
          if (json && json.reactivos) {
            const mapped: Question[] = json.reactivos.map((r: any, idx: number) => {
              // Determine domain
              const domWeight = r.weights.find((w: any) => w.dimension_id.startsWith('dom_'));
              const domainId = domWeight ? domWeight.dimension_id : '';
              const dominio = domainId.includes('directa') || domainId.includes('inter') ? 2 : 1;
              
              // Determine level
              const nivel = idx + 1;
              
              // Determine category
              const dimWeight = r.weights.find((w: any) => w.dimension_id.startsWith('dim_'));
              const category = dimWeight ? dimWeight.dimension_id : 'General';
              
              return {
                id: r.id,
                dominio: dominio as any,
                nivel: nivel,
                categoria: category,
                tipo: 'Directo',
                pregunta: r.statement
              };
            });
            setQuestions(mapped);
          }
        })
        .catch(e => {
          console.error("Could not load survey questions:", e);
          setQuestions([]);
        });
    }
  }, [surveyData]);
  // App Workspace State
  const [userEmail, setUserEmail] = useState('contacto@paciente.nicomaco.org');
  const [userName, setUserName] = useState('Paciente Demo');
  const [authAgreed, setAuthAgreed] = useState(false);
  const [hasCompletedAuth, setHasCompletedAuth] = useState(false);

  // Survey States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [triggeringQuestion, setTriggeringQuestion] = useState<Question | null>(null);
  
  // Custom alerts/toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedFlutter, setCopiedFlutter] = useState(false);

  // Debug QA Menu State
  const [showDebug, setShowDebug] = useState(false);

  // Trigger temporary messages
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // ADAPTIVE FLOW ENGINE: Rebuild active question sequence dynamically
  const activeQuestions = useMemo(() => {
    return getActiveQuestionsForAnswers(questions, answers, surveyData?.id);
  }, [questions, answers, surveyData]);

  const currentQuestion: Question | undefined = activeQuestions[currentQuestionIndex];

  // SCORING ENGINE
  const scoreResults = useMemo(() => {
    let earnedPoints = 0;
    let maxPossiblePoints = 0;

    Object.entries(answers).forEach(([_, score]) => {
      earnedPoints += score as number;
      maxPossiblePoints += 3;
    });

    const isAutoviolence = surveyData?.id === 'cero-amor';
    const scaledScore = isAutoviolence
      ? (maxPossiblePoints > 0 ? Math.round((earnedPoints / maxPossiblePoints) * 186) : 0)
      : earnedPoints;

    const getZoneColor = (name: string) => {
      const n = name.toUpperCase();
      if (n.includes('VERDE')) return '#10B981';
      if (n.includes('AMARILLA') || n.includes('ALERTA') || n.includes('ZONA 1')) return '#D97706';
      if (n.includes('MANIPULACIÓN') || n.includes('ZONA 2')) return '#EA580C';
      if (n.includes('ROJA') || n.includes('ALINEACIÓN') || n.includes('ZONA 3')) return '#DC2626';
      if (n.includes('CRÍTICA') || n.includes('PSICÓLOGICA') || n.includes('ZONA 4')) return '#312E81';
      if (n.includes('GRAVE') || n.includes('ZONA 5')) return '#991B1B';
      if (n.includes('EXTREMA') || n.includes('ZONA 6')) return '#000000';
      return '#7C3AED';
    };

    let matchedZone = {
      name: 'Sin clasificación',
      description: 'Cargando análisis...',
      color: '#7C3AED',
      guidelines: ['Consolidación del amor propio incondicional y prevención primaria.'],
      clinicalApproach: 'Consolidación del amor propio incondicional y prevención primaria.'
    };

    if (isAutoviolence) {
      let matchedStaticZone: ScoreZone = SCORE_ZONES[0];
      if (scaledScore <= 30) matchedStaticZone = SCORE_ZONES[0];
      else if (scaledScore <= 75) matchedStaticZone = SCORE_ZONES[1];
      else if (scaledScore <= 130) matchedStaticZone = SCORE_ZONES[2];
      else matchedStaticZone = SCORE_ZONES[3];

      matchedZone = {
        name: matchedStaticZone.name,
        description: matchedStaticZone.description,
        color: matchedStaticZone.color,
        guidelines: matchedStaticZone.guidelines,
        clinicalApproach: matchedStaticZone.clinicalApproach
      };
    } else if (surveyData && surveyData.levels && surveyData.levels.length > 0) {
      const sorted = [...surveyData.levels].sort((a: any, b: any) => a.minScore - b.minScore);
      const match = sorted.find((lvl: any) => scaledScore >= lvl.minScore && scaledScore <= lvl.maxScore);
      if (match) {
        matchedZone = {
          name: match.name,
          description: match.description || '',
          color: getZoneColor(match.name),
          guidelines: [match.clinicalApproach || 'Seguir indicaciones de Clínica NICÓMACO.'],
          clinicalApproach: match.clinicalApproach || ''
        };
      } else {
        // Fallback to last
        const lastLvl = sorted[sorted.length - 1];
        matchedZone = {
          name: lastLvl.name,
          description: lastLvl.description || '',
          color: getZoneColor(lastLvl.name),
          guidelines: [lastLvl.clinicalApproach || 'Seguir indicaciones de Clínica NICÓMACO.'],
          clinicalApproach: lastLvl.clinicalApproach || ''
        };
      }
    }

    return {
      earnedPoints,
      maxPossiblePoints,
      scaledScore,
      matchedZone
    };
  }, [answers, surveyData, questions]);

  const saveResult = async (finalAnswers: Record<string, number>, finalScore: number, finalZone: string) => {
    if (!surveyData) return;
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: surveyData.id,
          score: finalScore,
          zone: finalZone,
          answers: finalAnswers,
          patient: { name: userName, email: userEmail }
        })
      });
    } catch (e) {
      console.error('Failed to save result', e);
    }
  };

  // Option selection handler
  const handleSelectOption = (score: number) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    const isAutoviolence = surveyData?.id === 'cero-amor';
    const isCriticalTrigger = isAutoviolence
      ? (currentQuestion.dominio === 3 && score >= 2)
      : (currentQuestion.dominio === 2 && score >= 2);

    // CRITICAL QUESTION RULE:
    // "Si el usuario selecciona 2 o 3 en cualquier reactivo del Dominio 3, se detona el protocolo SOS de emergencia inminente."
    if (isCriticalTrigger) {
      setTriggeringQuestion(currentQuestion);
      
      const earned = (Object.values(newAnswers) as number[]).reduce((a: number, b: number) => a + b, 0);
      let matchedZoneName = 'Crítica';
      
      if (isAutoviolence) {
        const maxPossible = Object.keys(newAnswers).length * 3;
        const scaled = Math.round((earned / maxPossible) * 186);
        let matchedZone = SCORE_ZONES[3];
        saveResult(newAnswers, scaled, matchedZone.name);
      } else if (surveyData) {
        const sorted = [...surveyData.levels].sort((a: any, b: any) => a.minScore - b.minScore);
        const lastLvl = sorted[sorted.length - 1];
        matchedZoneName = lastLvl.name;
        saveResult(newAnswers, earned, matchedZoneName);
      }
      
      setCurrentScreen('sos');
      return;
    }

    // Determine what the active questions are based on the NEW answers
    const nextActiveQuestions = getActiveQuestionsForAnswers(questions, newAnswers, surveyData?.id);

    // Move to next question or evaluate finish
    if (currentQuestionIndex < nextActiveQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Completed last question. Check for high composite score redirection to SOS
      const earned = (Object.values(newAnswers) as number[]).reduce((a: number, b: number) => a + b, 0);
      
      if (isAutoviolence) {
        const maxPossible = Object.keys(newAnswers).length * 3;
        const scaled = Math.round((earned / maxPossible) * 186);
        
        let matchedZone = SCORE_ZONES[0];
        if (scaled <= 30) matchedZone = SCORE_ZONES[0];
        else if (scaled <= 75) matchedZone = SCORE_ZONES[1];
        else if (scaled <= 130) matchedZone = SCORE_ZONES[2];
        else matchedZone = SCORE_ZONES[3];

        if (scaled >= 131) {
          // High composite score (Zona Crítica) - find first critical question in Dom 3 answered >= 2 or default
          const firstCritQId = Object.entries(newAnswers).find(([id, val]) => {
            const q = questions.find(sq => sq.id === id);
            return q && q.dominio === 3 && (val as number) >= 2;
          })?.[0];
          const firstCritQ = firstCritQId ? questions.find(q => q.id === firstCritQId) : questions.find(q => q.id === 'Q55');
          setTriggeringQuestion(firstCritQ || questions.find(q => q.id === 'Q55') || null);
          saveResult(newAnswers, scaled, matchedZone.name);
          setCurrentScreen('sos');
        } else {
          saveResult(newAnswers, scaled, matchedZone.name);
          setCurrentScreen('results');
        }
      } else if (surveyData) {
        // Other survey finished
        const sorted = [...surveyData.levels].sort((a: any, b: any) => a.minScore - b.minScore);
        const match = sorted.find((lvl: any) => earned >= lvl.minScore && earned <= lvl.maxScore);
        const matchedZoneName = match ? match.name : sorted[0].name;
        
        const lastLvl = sorted[sorted.length - 1];
        const isLastZone = match && match.id === lastLvl.id;
        
        if (isLastZone) {
          const firstCritQId = Object.entries(newAnswers).find(([id, val]) => {
            const q = questions.find(sq => sq.id === id);
            return q && q.dominio === 2 && (val as number) >= 2;
          })?.[0];
          const firstCritQ = firstCritQId ? questions.find(q => q.id === firstCritQId) : questions[questions.length - 1];
          setTriggeringQuestion(firstCritQ || null);
          saveResult(newAnswers, earned, matchedZoneName);
          setCurrentScreen('sos');
        } else {
          saveResult(newAnswers, earned, matchedZoneName);
          setCurrentScreen('results');
        }
      }
    }
  };

  // Back navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Fast Path Pre-set simulations for review
  const runPresetSimulation = (type: 'green' | 'yellow' | 'red' | 'sos-critical') => {
    if (type === 'green') {
      const greenAnswers: Record<string, number> = {};
      // 10 base questions are answered with 0 (Dominio 1 Score = 0)
      for (let i = 1; i <= 10; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        greenAnswers[id] = 0;
      }
      // Remaining questions of Dominio 3 are also answered with 0
      for (let i = 43; i <= 62; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        greenAnswers[id] = 0;
      }
      setAnswers(greenAnswers);
      saveResult(greenAnswers, 0, 'Verde');
      setCurrentQuestionIndex(0);
      setCurrentScreen('results');
      showToast('Simulación de Zona Verde (AutoAmor Leve) activada.');
    } else if (type === 'yellow') {
      const yellowAnswers: Record<string, number> = {};
      // First 10 questions answered with 1 (Sum = 10, >= 3 triggers full questionnaire)
      for (let i = 1; i <= 10; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        yellowAnswers[id] = 1;
      }
      // Dominio 1 (rest) and Dominio 2 answered with 1
      for (let i = 11; i <= 42; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        yellowAnswers[id] = 1;
      }
      // Dominio 3 answered with 1 (Kept < 2 to avoid triggering direct SOS screen)
      for (let i = 43; i <= 62; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        yellowAnswers[id] = 1;
      }
      setAnswers(yellowAnswers);
      const earned = Object.values(yellowAnswers).reduce((a, b) => a + b, 0);
      const maxPossible = Object.keys(yellowAnswers).length * 3;
      const scaled = Math.round((earned / maxPossible) * 186);
      saveResult(yellowAnswers, scaled, 'Amarilla');
      setCurrentQuestionIndex(0);
      setCurrentScreen('results');
      showToast('Simulación de Zona Amarilla (Autoviolencia Moderada) activada.');
    } else if (type === 'red') {
      const redAnswers: Record<string, number> = {};
      // Set values to sum to ~104 (Zona Roja: 76 to 130)
      for (let i = 1; i <= 10; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        redAnswers[id] = 2; // Sum = 20
      }
      for (let i = 11; i <= 42; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        redAnswers[id] = 2; // Sum = 20 + 64 = 84
      }
      for (let i = 43; i <= 62; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        redAnswers[id] = 1; // Sum = 84 + 20 = 104 (Kept < 2 to prevent direct SOS bypass)
      }
      setAnswers(redAnswers);
      const earned = Object.values(redAnswers).reduce((a, b) => a + b, 0);
      const maxPossible = Object.keys(redAnswers).length * 3;
      const scaled = Math.round((earned / maxPossible) * 186);
      saveResult(redAnswers, scaled, 'Roja');
      setCurrentQuestionIndex(0);
      setCurrentScreen('results');
      showToast('Simulación de Zona Roja (Autoviolencia Severa) activada.');
    } else if (type === 'sos-critical') {
      const sosAnswers: Record<string, number> = {};
      for (let i = 1; i <= 10; i++) {
        const id = `Q${String(i).padStart(2, '0')}`;
        sosAnswers[id] = 1;
      }
      sosAnswers['Q55'] = 3; // Critical question in Dominio 3 gets Always (3) -> triggers immediate hijack
      setAnswers(sosAnswers);
      saveResult(sosAnswers, 186, 'Crítica');
      setCurrentQuestionIndex(0);
      setTriggeringQuestion(SURVEY_QUESTIONS.find(q => q.id === 'Q55') || null);
      setCurrentScreen('sos');
      showToast('Simulación SOS de Emergencia activada por Reactivo Crítico.');
    }
  };

  // Handle Flutter code copying
  const copyFlutterCodeToClipboard = () => {
    navigator.clipboard.writeText(FLUTTER_CODE_PROTOTYPE);
    setCopiedFlutter(true);
    showToast('Código Flutter copiado al portapapeles.');
    setTimeout(() => setCopiedFlutter(false), 2000);
  };

  // Restart Survey
  const restartSurvey = (goToAuth: boolean = false) => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTriggeringQuestion(null);
    if (goToAuth) {
      setHasCompletedAuth(false);
      setAuthAgreed(false);
      setCurrentScreen('onboarding');
    } else if (hasCompletedAuth) {
      setCurrentScreen('survey');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-jet-black text-snow-white' : 'bg-[#F5F4F0] text-zinc-900'} font-sans antialiased overflow-x-hidden flex flex-col selection:bg-gold-accent/30 selection:text-gold-accent transition-colors duration-300`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 ${isDarkMode ? 'bg-dark-zinc text-snow-white border-gold-accent/40' : 'bg-white text-zinc-800 border-[#9E7A44]/40 shadow-xl'} border px-6 py-3 rounded-full flex items-center gap-3 text-sm backdrop-blur-md`}
          >
            <Sparkles className="w-4 h-4 text-gold-accent animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
  
      {/* Main clinical application navbar */}
      <header className={`border-b ${isDarkMode ? 'border-white/[0.06] bg-jet-black/80 text-white' : 'border-zinc-200 bg-[#FAF9F6]/85 text-zinc-900'} backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-indigo to-jade-green flex items-center justify-center shadow-lg shadow-electric-indigo/10">
            <Heart className="w-5 h-5 text-white fill-white/10" />
          </div>
          <div>
            <h1 className={`font-serif text-lg tracking-tight font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'} flex items-center gap-2`}>
              NICÓMACO <span className="text-xs font-sans tracking-widest uppercase text-jade-green font-normal px-2 py-0.5 rounded bg-jade-green/10 border border-jade-green/20">Clínica de Contacto®</span>
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44] font-semibold'} font-mono`}>Autoviolentómetro &middot; Amor Incondicional Ágape</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              showToast(`Modo ${!isDarkMode ? 'Oscuro' : 'Claro'} activado.`);
            }}
            className={`text-xs font-medium p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
              isDarkMode 
                ? 'text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.05]' 
                : 'text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 shadow-xs'
            }`}
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/10 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/10" />
            )}
          </button>

          <button 
            onClick={() => {
              restartSurvey(true);
              showToast('Prueba reiniciada con éxito.');
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
              isDarkMode 
                ? 'text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.05]' 
                : 'text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 shadow-xs'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar App</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Layout */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 lg:p-12 flex flex-col items-center justify-center">
        
        <div className={`w-full rounded-[32px] p-6 md:p-10 lg:p-12 transition-all duration-500 shadow-2xl relative flex flex-col justify-between ${
          isDarkMode 
            ? 'bg-dark-zinc border border-white/[0.08] shadow-[0_0_80px_rgba(197,168,128,0.05)]' 
            : 'bg-white border border-zinc-200 shadow-[0_20px_60px_rgba(158,122,68,0.1)]'
        }`}>

          {/* SCREEN CONTAINER WITH ANIMATED TRANSITIONS */}
          <div className="flex-1 flex flex-col justify-center min-h-[60vh]">
              <AnimatePresence mode="wait">
                
                {/* 1. SPLASH SCREEN */}
                {currentScreen === 'splash' && (
                  <motion.div
                    key="splash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-4"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-gold-accent/20 to-electric-indigo/20 border border-gold-accent/40 flex items-center justify-center mb-8 animate-bounce">
                      <Heart className="w-12 h-12 md:w-16 md:h-16 text-gold-accent fill-gold-accent/20" />
                    </div>
                    <span className={`text-xs md:text-sm tracking-[4px] uppercase ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'} font-bold`}>Clínica Nicómaco</span>
                    <h2 className={`font-serif text-4xl md:text-5xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Cero Amor</h2>
                    <span className={`text-sm md:text-base ${isDarkMode ? 'text-white/40' : 'text-zinc-400'} italic block my-2`}>vs</span>
                    <h3 className={`font-serif text-4xl md:text-5xl font-semibold ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'}`}>Amor Ágape</h3>
                    <p className={`text-sm md:text-base ${isDarkMode ? 'text-white/60' : 'text-zinc-600'} mt-6 leading-relaxed max-w-md mx-auto`}>
                      Herramienta Psicométrica Adaptativa para la Prevención de la Autoviolencia Humana.
                    </p>
                    <button
                      onClick={() => setCurrentScreen('onboarding')}
                      className="mt-10 mx-auto bg-gold-accent hover:bg-gold-accent/90 text-jet-black text-sm md:text-base font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group cursor-pointer"
                    >
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {/* 2. ONBOARDING & ETHICAL AGREEMENT */}
                {currentScreen === 'onboarding' && (
                  <motion.div
                    key="onboarding"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="text-center pt-8">
                      <span className={`text-xs tracking-[3px] uppercase ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'} font-bold`}>Onboarding</span>
                      <h2 className={`font-serif text-3xl md:text-4xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Consentimiento</h2>
                      <p className={`text-sm md:text-base ${isDarkMode ? 'text-white/60' : 'text-zinc-600'} mt-4`}>
                        Lee y acepta los términos clínicos para continuar al test seguro.
                      </p>
                    </div>

                    <div className={`my-10 rounded-2xl p-6 md:p-8 border text-left transition-colors ${
                      isDarkMode ? 'bg-card-zinc border-white/[0.05]' : 'bg-[#FAF9F5] border-zinc-200/80 shadow-xs'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <Stethoscope className={`w-6 h-6 md:w-8 md:h-8 ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'}`} />
                        <span className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white/90' : 'text-zinc-800'}`}>Aviso Clínico de Responsabilidad</span>
                      </div>
                      <p className={`text-sm md:text-base ${isDarkMode ? 'text-white/60' : 'text-zinc-600'} leading-relaxed`}>
                        Este instrumento psicométrico evalúa 31 niveles progresivos de autoviolencia y conductas lesivas. 
                        <strong> No sustituye terapia psiquiátrica</strong> ni atención médica especializada de urgencia. 
                        Toda información proporcionada es 100% confidencial y anónima.
                      </p>
                      
                      <div className={`mt-6 pt-5 border-t flex items-start gap-4 ${isDarkMode ? 'border-white/[0.06]' : 'border-zinc-200'}`}>
                        <input 
                          type="checkbox" 
                          id="agree-disclaimer"
                          checked={authAgreed}
                          onChange={(e) => setAuthAgreed(e.target.checked)}
                          className="mt-1 accent-gold-accent w-5 h-5 rounded cursor-pointer"
                        />
                        <label htmlFor="agree-disclaimer" className={`text-sm md:text-base leading-normal cursor-pointer ${isDarkMode ? 'text-white/80' : 'text-zinc-700'}`}>
                          Acepto de forma voluntaria realizar este tamizaje y comprendo sus límites clínicos preventivos.
                        </label>
                      </div>
                    </div>

                    <button
                      disabled={!authAgreed}
                      onClick={() => setCurrentScreen('auth')}
                      className={`w-full py-4 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authAgreed 
                          ? 'bg-gold-accent hover:bg-gold-accent/90 text-jet-black shadow-lg' 
                          : isDarkMode ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Aceptar y Continuar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* 3. SIMULATED CLINICAL REGISTRATION (PRD ÉPICA 1) */}
                {currentScreen === 'auth' && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="text-center pt-8">
                      <span className="text-xs tracking-[3px] uppercase text-jade-green font-bold">Identidad</span>
                      <h2 className={`font-serif text-3xl md:text-4xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Registro Seguro</h2>
                      <p className={`text-sm md:text-base ${isDarkMode ? 'text-white/60' : 'text-zinc-600'} mt-2`}>
                        Tus datos nos permiten brindarte un informe adaptado personalizado.
                      </p>
                    </div>

                    <div className="my-8 space-y-6 text-left">
                      <div>
                        <label className={`block text-xs md:text-sm ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44] font-semibold'} font-mono mb-2`}>CÓDIGO O SEUDÓNIMO (ANÓNIMO)</label>
                        <div className="relative">
                          <User className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-zinc-400'}`} />
                          <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className={`w-full border rounded-xl py-3 px-12 text-sm md:text-base focus:outline-none transition-all ${
                              isDarkMode 
                                ? 'bg-card-zinc border-white/[0.08] text-white focus:border-gold-accent' 
                                : 'bg-[#FAF9F5] border-zinc-200 text-zinc-800 focus:border-[#9E7A44]'
                            }`}
                            placeholder="Ej. Paciente Anónimo"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs md:text-sm ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44] font-semibold'} font-mono mb-2`}>CORREO ELECTRÓNICO ENCRIPTADO</label>
                        <div className="relative">
                          <Activity className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-zinc-400'}`} />
                          <input 
                            type="email" 
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className={`w-full border rounded-xl py-3 px-12 text-sm md:text-base focus:outline-none transition-all ${
                              isDarkMode 
                                ? 'bg-card-zinc border-white/[0.08] text-white focus:border-gold-accent' 
                                : 'bg-[#FAF9F5] border-zinc-200 text-zinc-800 focus:border-[#9E7A44]'
                            }`}
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-zinc-500'} mt-2`}>
                          Encriptado con algoritmo local SHA-256 para demostración.
                        </p>
                      </div>

                      <div className={`p-4 rounded-xl flex gap-3 border transition-colors ${
                        isDarkMode ? 'bg-jade-green/5 border-jade-green/20 text-jade-green/95' : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                      }`}>
                        <CheckCircle2 className="w-5 h-5 text-jade-green shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base leading-snug">
                          <strong>Base de datos local activa:</strong> No se enviarán credenciales a internet durante esta evaluación.
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setHasCompletedAuth(true);
                        setCurrentScreen('survey');
                        showToast('Registro de paciente completado. Iniciando encuesta.');
                      }}
                      className="w-full bg-gold-accent hover:bg-gold-accent/90 text-jet-black py-4 rounded-xl text-sm md:text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Comenzar Evaluación</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* 4. SURVEY EVALUATION SCREEN (DYNAMIC & ADAPTIVE) */}
                {currentScreen === 'survey' && currentQuestion && (
                  <motion.div
                    key="survey"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    {/* Progress Indicator */}
                    <div>
                      <div className={`flex justify-between items-center text-xs md:text-sm font-mono mb-2 ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>
                        <span>Paso {currentQuestionIndex + 1} de {activeQuestions.length}</span>
                        <span className={`${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'} font-semibold`}>{Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}%</span>
                      </div>
                      <div className={`w-full h-2 md:h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/[0.05]' : 'bg-zinc-200'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-electric-indigo to-jade-green transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                        ></div>
                      </div>

                      {/* Domain Badge & Info */}
                      <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
                        <span className={`text-xs md:text-sm tracking-wider uppercase border px-3 py-1 rounded-md font-bold transition-colors ${
                          isDarkMode 
                            ? 'bg-electric-indigo/15 text-gold-accent border-gold-accent/30' 
                            : 'bg-indigo-50 text-[#9E7A44] border-[#9E7A44]/20'
                        }`}>
                          {currentQuestion.dominio === 1 && "Dom 1: Autoviolencia Psicológica"}
                          {currentQuestion.dominio === 2 && "Dom 2: Autoviolencia Física"}
                          {currentQuestion.dominio === 3 && "Dom 3: Alerta de Alto Riesgo"}
                        </span>
                        <span className={`text-xs md:text-sm italic font-mono ${isDarkMode ? 'text-white/40' : 'text-zinc-400'}`}>ID: {currentQuestion.id}</span>
                      </div>
                    </div>

                    {/* Question Card Box */}
                    <div className={`my-8 border rounded-3xl p-8 md:p-12 flex-1 flex flex-col justify-center text-center transition-all ${
                      isDarkMode ? 'bg-card-zinc border-white/[0.06]' : 'bg-[#FAF9F5] border-zinc-200/80 shadow-sm'
                    }`}>
                      <span className={`text-sm md:text-base tracking-widest uppercase font-mono block mb-4 ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44] font-semibold'}`}>
                        {currentQuestion.categoria} ({currentQuestion.tipo})
                      </span>
                      <h3 className={`font-serif text-2xl md:text-4xl leading-relaxed font-medium ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                        "{currentQuestion.pregunta}"
                      </h3>
                    </div>

                    {/* Likert Scale Selection */}
                    <div className="space-y-3">
                      {[
                        { label: 'Nunca', desc: 'No se presenta', points: 0 },
                        { label: 'Rara Vez', desc: '1 o 2 veces al mes', points: 1 },
                        { label: 'Frecuentemente', desc: '1 a 3 veces por semana', points: 2 },
                        { label: 'Siempre', desc: 'A diario / automatizado', points: 3 },
                      ].map((opt) => (
                        <button
                          key={opt.points}
                          onClick={() => handleSelectOption(opt.points)}
                          className={`w-full border p-4 md:p-5 rounded-2xl transition-all text-left flex items-center justify-between group active:scale-[0.99] cursor-pointer ${
                            isDarkMode 
                              ? 'bg-dark-zinc/80 hover:bg-card-zinc border-white/[0.05] hover:border-gold-accent/50' 
                              : 'bg-white hover:bg-zinc-50 border-zinc-200/85 hover:border-[#9E7A44]/50 shadow-sm'
                          }`}
                        >
                          <div>
                            <span className={`text-sm md:text-lg font-bold block transition-colors ${isDarkMode ? 'text-white group-hover:text-gold-accent' : 'text-zinc-800 group-hover:text-[#9E7A44]'}`}>{opt.label}</span>
                            <span className={`text-xs md:text-sm ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>{opt.desc}</span>
                          </div>
                          <span className={`text-sm font-mono border px-3 py-1.5 rounded-lg ${
                            isDarkMode ? 'text-gold-accent bg-black/30 border-white/5' : 'text-[#9E7A44] bg-zinc-100 border-zinc-200/60'
                          }`}>
                            +{opt.points} pts
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Survey Navigation Controls */}
                    <div className={`mt-8 pt-5 border-t flex justify-between items-center ${isDarkMode ? 'border-white/[0.05]' : 'border-zinc-200'}`}>
                      <button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className={`text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                          currentQuestionIndex === 0 
                            ? isDarkMode ? 'text-white/20 cursor-not-allowed' : 'text-zinc-300 cursor-not-allowed' 
                            : isDarkMode ? 'text-white/60 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-200/80'
                        }`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Atrás</span>
                      </button>
                      
                      <span className={`text-xs md:text-sm italic ${isDarkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                        {currentQuestion.dominio === 3 && <span className="text-rose-400 font-semibold animate-pulse">Reactivo Crítico SOS</span>}
                        {currentQuestion.dominio === 1 && "Fase Inicial Diagnóstica"}
                        {currentQuestion.dominio === 2 && "Fase Física Expandida"}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 5. RESULTS SCREEN */}
                {currentScreen === 'results' && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col justify-between text-left"
                  >
                    <div className="text-center pt-4 md:pt-8">
                      <span className={`text-xs md:text-sm tracking-[3px] uppercase font-bold ${isDarkMode ? 'text-jade-green' : 'text-emerald-700'}`}>Evaluación</span>
                      <h2 className={`font-serif text-3xl md:text-5xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Resultado Clínico</h2>
                    </div>

                    {/* Visual Ring Gauge */}
                    <div className={`my-8 md:my-10 border rounded-3xl p-8 flex flex-col items-center transition-all ${
                      isDarkMode ? 'bg-card-zinc border-white/[0.06]' : 'bg-[#FAF9F5] border-zinc-200/80 shadow-sm'
                    }`}>
                      
                      {/* Score Value Circle */}
                      <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center mb-6">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="50" cy="50" r="42" 
                            stroke={scoreResults.matchedZone.color} 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={263.8}
                            strokeDashoffset={263.8 - (263.8 * scoreResults.scaledScore) / (surveyData?.id === 'cero-amor' ? 186 : (questions.length * 3))}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="text-center">
                          <span className={`text-4xl md:text-6xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{scoreResults.scaledScore}</span>
                          <span className={`text-xs md:text-sm block border-t mt-2 pt-2 font-mono ${isDarkMode ? 'text-white/40 border-white/10' : 'text-zinc-500 border-zinc-200'}`}>de {surveyData?.id === 'cero-amor' ? 186 : (questions.length * 3)} pts</span>
                        </div>
                      </div>

                      {/* Diagnostic Zone Label */}
                      <span className={`text-lg md:text-2xl font-black tracking-wider uppercase ${getZoneTextClass(scoreResults.matchedZone.name, isDarkMode)}`}>
                        Zona {scoreResults.matchedZone.name}
                      </span>
                      <p className={`text-sm md:text-base leading-relaxed text-center mt-4 max-w-lg ${isDarkMode ? 'text-white/70' : 'text-zinc-600'}`}>
                        {scoreResults.matchedZone.description}
                      </p>
                    </div>

                    {/* Guidelines and Transition Path */}
                    <div className="space-y-4 mb-8">
                      <span className={`text-xs md:text-sm tracking-wider uppercase font-bold block mb-3 ${isDarkMode ? 'text-gold-accent' : 'text-[#9E7A44]'}`}>
                        Pautas del Plan Amor Ágape:
                      </span>
                      {scoreResults.matchedZone.guidelines.map((g, idx) => (
                        <div key={idx} className={`flex items-start gap-4 text-sm md:text-base leading-relaxed p-4 rounded-xl border transition-all ${
                          isDarkMode ? 'text-white/80 bg-black/20 border-white/[0.03]' : 'text-zinc-700 bg-white border-zinc-200/60 shadow-xs'
                        }`}>
                          <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-jade-green shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions and WhatsApp Simulation */}
                    <div className="space-y-3">
                      <button
                        onClick={() => showToast('Abriendo enlace seguro para agendar cita con Clínica NICÓMACO...')}
                        className="w-full bg-jade-green hover:bg-jade-green/90 text-white text-sm md:text-base font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md shadow-jade-green/10 cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Agendar Sesión de Consulta</span>
                      </button>

                      <button
                        onClick={() => restartSurvey()}
                        className={`w-full text-sm md:text-base py-3 rounded-xl border transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/[0.05]' 
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border-zinc-200'
                        }`}
                      >
                        Reiniciar Diagnóstico
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 6. CRITICAL SOS SCREEN (HIJACK MODE) */}
                {currentScreen === 'sos' && (
                  <motion.div
                    key="sos"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-1 flex flex-col justify-between text-center py-6"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center mb-6 animate-pulse">
                        <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-red-500" />
                      </div>
                      
                      {triggeringQuestion && (
                        <div className="mb-6 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm max-w-xl mx-auto font-mono flex flex-col gap-1 shadow-sm">
                          <span className="font-extrabold uppercase text-[10px] md:text-xs text-red-300 tracking-wider">Reactivo Detonante</span>
                          <span className={`font-sans text-sm md:text-base font-semibold leading-snug ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                            Nivel {triggeringQuestion.nivel}: {triggeringQuestion.categoria}
                          </span>
                        </div>
                      )}

                      <span className="text-xs md:text-sm tracking-[5px] uppercase text-red-400 font-extrabold animate-pulse">
                        S.O.S - APOYO INMEDIATO
                      </span>
                      <h2 className={`font-serif text-3xl md:text-5xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Tu vida vale oro</h2>
                      <p className={`text-sm md:text-lg leading-relaxed mt-4 max-w-2xl mx-auto ${isDarkMode ? 'text-white/70' : 'text-zinc-600'}`}>
                        Pausamos el cuestionario porque has seleccionado conductas críticas de alto riesgo o autolesión. 
                        <strong> No estás solo(a)</strong>. Mereces un trato lleno de compasión y contención inmediata.
                      </p>
                    </div>

                    <div className="my-10 space-y-4 text-left max-w-2xl mx-auto w-full">
                      <span className="text-xs md:text-sm text-red-400 font-mono block mb-2">LÍNEAS DE CRISIS DE ATENCIÓN GRATUITA (MÉXICO & LATAM):</span>
                      
                      {/* Emergency Line 1 */}
                      <a 
                        href="tel:8009112000"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast('Simulando marcado directo: 800 911 2000');
                        }}
                        className={`block border p-4 md:p-6 rounded-2xl transition-all ${isDarkMode ? 'bg-[#1E121E] hover:bg-[#2D162D] border-red-950' : 'bg-rose-50/40 hover:bg-rose-50 border-rose-100'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                            <span className={`text-base md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Línea de la Vida</span>
                          </div>
                          <span className="text-sm md:text-lg font-mono text-rose-400 font-bold">800 911 2000</span>
                        </div>
                        <p className={`text-xs md:text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-zinc-600'}`}>
                          Servicio federal de contención psicológica confidencial, disponible las 24 horas del año.
                        </p>
                      </a>

                      {/* Emergency Line 2 */}
                      <a 
                        href="tel:5552598121"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast('Simulando marcado directo: 55 5259 8121');
                        }}
                        className={`block border p-4 md:p-6 rounded-2xl transition-all ${isDarkMode ? 'bg-[#121E1E] hover:bg-[#162D2D] border-emerald-950' : 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-100'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                            <span className={`text-base md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>SAPTEL (Cruz Roja)</span>
                          </div>
                          <span className="text-sm md:text-lg font-mono text-emerald-400 font-bold">55 5259 8121</span>
                        </div>
                        <p className={`text-xs md:text-sm mt-2 leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-zinc-600'}`}>
                          Atención especializada por la Cruz Roja Mexicana. Apoyo en crisis psicológica.
                        </p>
                      </a>
                    </div>

                    <div className="space-y-4 max-w-2xl mx-auto w-full">
                      <button
                        onClick={() => showToast('Redirigiendo prioritariamente a terapeutas de NICÓMACO...')}
                        className="w-full bg-gold-accent hover:bg-gold-accent/90 text-jet-black text-sm md:text-base font-bold py-4 rounded-xl transition-all cursor-pointer shadow-lg"
                      >
                        Llamar a Clínica NICÓMACO
                      </button>

                      <button
                        onClick={() => restartSurvey()}
                        className={`w-full text-xs md:text-sm py-3 rounded-xl transition-all cursor-pointer ${
                          isDarkMode ? 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Reiniciar Diagnóstico
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* FLOATING DEBUG QA MENU */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`mb-4 w-72 rounded-2xl border p-4 shadow-2xl ${
                  isDarkMode ? 'bg-dark-zinc border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between mb-4 border-b pb-2 border-white/10">
                  <h4 className="font-bold flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    QA Simulators
                  </h4>
                  <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <button onClick={() => { runPresetSimulation('green'); setShowDebug(false); }} className={`w-full text-left text-xs p-2.5 rounded-lg border flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-emerald-900/30' : 'bg-zinc-50 border-zinc-200 hover:bg-emerald-50'}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zona Verde (Salto)
                  </button>
                  <button onClick={() => { runPresetSimulation('yellow'); setShowDebug(false); }} className={`w-full text-left text-xs p-2.5 rounded-lg border flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-amber-900/30' : 'bg-zinc-50 border-zinc-200 hover:bg-amber-50'}`}>
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Zona Amarilla
                  </button>
                  <button onClick={() => { runPresetSimulation('red'); setShowDebug(false); }} className={`w-full text-left text-xs p-2.5 rounded-lg border flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-rose-900/30' : 'bg-zinc-50 border-zinc-200 hover:bg-rose-50'}`}>
                    <HeartOff className="w-4 h-4 text-rose-500" /> Zona Roja
                  </button>
                  <button onClick={() => { runPresetSimulation('sos-critical'); setShowDebug(false); }} className={`w-full text-left text-xs p-2.5 rounded-lg border flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-red-900/50' : 'bg-zinc-50 border-zinc-200 hover:bg-red-50'}`}>
                    <ShieldAlert className="w-4 h-4 text-red-500" /> SOS (Reactivo Q55)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-3 rounded-full shadow-lg border transition-all hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? 'bg-black text-white/50 border-white/10 hover:text-white hover:border-white/20' 
                : 'bg-white text-zinc-400 border-zinc-200 hover:text-zinc-800'
            }`}
            title="Herramientas de QA"
          >
            <Bug className="w-5 h-5" />
          </button>
        </div>

      {/* Brand Values Info Banner */}
      <footer className={`mt-auto border-t py-8 px-6 text-center text-xs font-mono transition-colors ${
        isDarkMode ? 'border-white/[0.06] bg-jet-black text-white/40' : 'border-zinc-200 bg-[#FAF9F5] text-zinc-500'
      }`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className={`flex justify-center flex-wrap gap-6 ${isDarkMode ? 'text-white/60' : 'text-zinc-600'}`}>
            <span>AESTHETIC: Clinical & Professional</span>
            <span>TONE OF VOICE: Empathetic & Warm</span>
            <span>PRINCIPLE: Transformative & Uplifting</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed">
            "Transforma tu vida hacia el amor verdadero, sano y libre." Módulo desarrollado con apego estricto al Brandbook de la Clínica NICÓMACO.
          </p>
        </div>
      </footer>
    </div>
  );
}
