import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, MessageSquareCode, Award, Clock, Layers, 
  TrendingUp, Users, ShieldAlert, GraduationCap, LogOut, 
  UploadCloud, Play, Sparkles, CheckCircle2, AlertTriangle, 
  HelpCircle, Eye, EyeOff, XCircle, FileSpreadsheet, FileText, ChevronRight, Calendar
} from 'lucide-react'

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Document {
  id: number;
  filename: string;
  subject_tag: string;
  vector_store_path: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizAttempt {
  id: number;
  subject: string;
  topic: string;
  score: number;
  total_questions: number;
  difficulty_level: string;
  attempted_at: string;
  name?: string;
  email?: string;
}

interface TopicProgress {
  subject: string;
  topic: string;
  mastery_score: number;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  filename: string;
}

interface CircularMasteryRingProps {
  score: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
}

function CircularMasteryRing({ score, size = 96, strokeWidth = 8, label, subLabel }: CircularMasteryRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score * circumference)

  return (
    <div className="flex flex-col items-center justify-center text-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringTealGrad)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="ringTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ECDC4" />
              <stop offset="100%" stopColor="#6C63FF" />
            </linearGradient>
          </defs>
        </svg>
        {/* Inner text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-white">{Math.round(score * 100)}%</span>
        </div>
      </div>
      {label && (
        <div className="flex flex-col">
          <span className="text-xs font-bold font-header text-slate-300 leading-tight">{label}</span>
          {subLabel && <span className="text-[10px] text-slate-500 font-sans mt-0.5">{subLabel}</span>}
        </div>
      )}
    </div>
  )
}

export default function App() {
  // Authentication & Session state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edusathi_user')
    return saved ? JSON.parse(saved) : null
  })
  
  const [academicCourse, setAcademicCourse] = useState(() => localStorage.getItem('edusathi_course') || '')
  const [academicSem, setAcademicSem] = useState(() => localStorage.getItem('edusathi_sem') || '')
  const [profileComplete, setProfileComplete] = useState(() => localStorage.getItem('edusathi_profile_complete') === 'true')

  // Routing State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null)

  // Shared Global Data Cache
  const [documents, setDocuments] = useState<Document[]>([])
  const [masteryData, setMasteryData] = useState<TopicProgress[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])

  // UI Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load user data on startup/login
  useEffect(() => {
    if (user) {
      localStorage.setItem('edusathi_user', JSON.stringify(user))
      fetchUserData()
    } else {
      localStorage.removeItem('edusathi_user')
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return
    try {
      // Fetch user docs
      const docRes = await fetch(`/api/chat/documents/${user.id}`)
      if (docRes.ok) {
        const data = await docRes.json()
        setDocuments(data.documents || [])
      }

      // Fetch dashboard metrics and mastery
      const dashRes = await fetch(`/api/analytics/dashboard/${user.id}`)
      if (dashRes.ok) {
        const data = await dashRes.json()
        setMasteryData(data.stats?.progress || [])
        setQuizAttempts(data.stats?.history || [])
      }

      // Fetch flashcards
      const fcRes = await fetch(`/api/flashcards/${user.id}`)
      if (fcRes.ok) {
        const data = await fcRes.json()
        setFlashcards(data.flashcards || [])
      }
    } catch (e) {
      console.error('Failed to sync metrics', e)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setAcademicCourse('')
    setAcademicSem('')
    setProfileComplete(false)
    localStorage.clear()
    setActiveTab('dashboard')
  }

  return (
    <div className="relative min-h-screen bg-background text-slate-100 flex flex-col md:flex-row overflow-hidden">
      {/* 1. Cyber Grid overlay */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0"></div>

      {/* 2. Floating Ambient Glow Backgrounds */}
      <div className="absolute top-[5%] left-[8%] w-[450px] h-[450px] bg-violetAccent/10 rounded-full filter blur-[150px] pointer-events-none z-0 drift-blob-1"></div>
      <div className="absolute bottom-[10%] right-[8%] w-[500px] h-[500px] bg-tealAccent/6 rounded-full filter blur-[160px] pointer-events-none z-0 drift-blob-2"></div>

      {/* 3. SVG Network Constellation Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] z-0 overflow-hidden">
        <svg width="100%" height="100%">
          <line x1="10%" y1="15%" x2="35%" y2="28%" stroke="#6C63FF" strokeWidth="1.5" strokeDasharray="5" />
          <line x1="35%" y1="28%" x2="25%" y2="60%" stroke="#4ECDC4" strokeWidth="1.5" strokeDasharray="5" />
          <line x1="25%" y1="60%" x2="55%" y2="45%" stroke="#6C63FF" strokeWidth="1.5" strokeDasharray="5" />
          <line x1="55%" y1="45%" x2="70%" y2="75%" stroke="#4ECDC4" strokeWidth="1.5" strokeDasharray="5" />
          <line x1="70%" y1="75%" x2="90%" y2="30%" stroke="#6C63FF" strokeWidth="1.5" strokeDasharray="5" />
          
          <circle cx="10%" cy="15%" r="4" fill="#6C63FF" className="constellation-node" />
          <circle cx="35%" cy="28%" r="5" fill="#4ECDC4" className="constellation-node" />
          <circle cx="25%" cy="60%" r="4" fill="#6C63FF" className="constellation-node" />
          <circle cx="55%" cy="45%" r="5" fill="#4ECDC4" className="constellation-node" />
          <circle cx="70%" cy="75%" r="4" fill="#6C63FF" className="constellation-node" />
          <circle cx="90%" cy="30%" r="5" fill="#4ECDC4" className="constellation-node" />
        </svg>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center gap-2 transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-tealAccent/15 border-tealAccent/40 text-tealAccent' :
          toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
          'bg-slate-800 border-slate-700 text-slate-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
           toast.type === 'error' ? <XCircle className="w-5 h-5" /> : 
           <HelpCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main app routing routing layout */}
      {!user ? (
        <AuthScreen 
          onLogin={(userData, isNewUser) => {
            setUser(userData)
            if (isNewUser) {
              setActiveTourStep(0)
            }
          }} 
          showToast={showToast} 
        />
      ) : (
        <>
          {/* Mobile Header Bar */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-background/80 backdrop-blur-md z-20 sticky top-0 shrink-0">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-violetAccent filter drop-shadow-[0_0_8px_rgba(108,99,255,0.4)]" />
              <span className="font-header font-extrabold text-xl bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent tracking-tight">
                EduSathi
              </span>
            </div>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>

          {/* Mobile Drawer Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              ></div>
              
              <aside className="relative w-72 max-w-[80vw] bg-slate-950/95 border-r border-slate-800 flex flex-col z-50 h-full p-4 transform transition-transform duration-300 shadow-2xl">
                <div className="flex items-center justify-between p-2 mb-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-7 h-7 text-violetAccent" />
                    <span className="font-header font-bold text-lg bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent">
                      EduSathi
                    </span>
                  </div>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="px-3 py-4 border-b border-slate-800/60 flex flex-col gap-1 mb-4">
                  <div className="text-sm font-header font-bold text-slate-200">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  <span className="mt-2 text-[10px] w-max font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-violetAccent/10 border border-violetAccent/30 text-violetAccent font-header">
                    Student
                  </span>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                  <div className="text-[10px] tracking-widest font-bold text-slate-500 uppercase px-3 mb-2 font-header">Learning</div>
                  <NavButton active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} icon={<LayoutDashboard />} label="Dashboard" />
                  <NavButton active={activeTab === 'chat'} onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }} icon={<MessageSquareCode />} label="Chat Tutor" />
                  <NavButton active={activeTab === 'quiz'} onClick={() => { setActiveTab('quiz'); setSidebarOpen(false); }} icon={<Award />} label="Quiz Arena" />
                  <NavButton active={activeTab === 'exam'} onClick={() => { setActiveTab('exam'); setSidebarOpen(false); }} icon={<Clock />} label="Exam Room" />
                  <NavButton active={activeTab === 'flashcards'} onClick={() => { setActiveTab('flashcards'); setSidebarOpen(false); }} icon={<Layers />} label="Flashcards" />
                  <NavButton active={activeTab === 'progress'} onClick={() => { setActiveTab('progress'); setSidebarOpen(false); }} icon={<TrendingUp />} label="Progress Analytics" />
                  <NavButton id="nav-planner" active={activeTab === 'planner'} onClick={() => { setActiveTab('planner'); setSidebarOpen(false); }} icon={<Calendar />} label="Study Planner" />
                  <NavButton active={activeTab === 'paper-analysis'} onClick={() => { setActiveTab('paper-analysis'); setSidebarOpen(false); }} icon={<FileText />} label="Paper Analysis" />
                  <NavButton active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} icon={<Users />} label="Profile Settings" />
                </nav>

                <div className="pt-4 border-t border-slate-800/60">
                  <button 
                    onClick={() => { handleLogout(); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-semibold">Log Out</span>
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden md:flex w-72 glass-panel border-r border-slate-800 flex-col z-10 shrink-0">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-violetAccent filter drop-shadow-[0_0_8px_rgba(108,99,255,0.4)]" />
              <span className="font-header font-extrabold text-2xl bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent tracking-tight">
                EduSathi
              </span>
            </div>

            {/* Profile Brief */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex flex-col gap-1">
              <div className="text-sm font-header font-bold text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
              <span className="mt-2 text-[10px] w-max font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-violetAccent/10 border border-violetAccent/30 text-violetAccent font-header">
                Student
              </span>
            </div>

            {/* Navigation links */}
            <nav id="sidebar-navigation" className="flex-1 px-4 py-6 flex flex-col gap-1">
              <div className="text-[10px] tracking-widest font-bold text-slate-500 uppercase px-3 mb-2 font-header">Learning</div>
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
              <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquareCode />} label="Chat Tutor" />
              <NavButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<Award />} label="Quiz Arena" />
              <NavButton active={activeTab === 'exam'} onClick={() => setActiveTab('exam')} icon={<Clock />} label="Exam Room" />
              <NavButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Layers />} label="Flashcards" />
              <NavButton active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} icon={<TrendingUp />} label="Progress Analytics" />
              <NavButton id="nav-planner" active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} icon={<Calendar />} label="Study Planner" />
              <NavButton active={activeTab === 'paper-analysis'} onClick={() => setActiveTab('paper-analysis')} icon={<FileText />} label="Paper Analysis" />
              <NavButton id="nav-profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Users />} label="Profile Settings" />
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-800/60">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-semibold">Log Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTAINER CONTENT */}
          <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 z-10 flex flex-col">
            {activeTab === 'dashboard' && (
              <StudentDashboard user={user} mastery={masteryData} attempts={quizAttempts} setTab={setActiveTab} onRefresh={fetchUserData} />
            )}
            {activeTab === 'chat' && (
              <ChatTutor user={user} docs={documents} onRefresh={fetchUserData} showToast={showToast} />
            )}
            {activeTab === 'quiz' && (
              <QuizArena user={user} docs={documents} onRefresh={fetchUserData} showToast={showToast} />
            )}
            {activeTab === 'exam' && (
              <ExamRoom user={user} docs={documents} onRefresh={fetchUserData} showToast={showToast} />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardDeck user={user} docs={documents} cards={flashcards} onRefresh={fetchUserData} showToast={showToast} />
            )}
            {activeTab === 'progress' && (
              <ProgressAnalytics user={user} mastery={masteryData} attempts={quizAttempts} />
            )}
            {activeTab === 'planner' && (
              <StudyPlanner user={user} showToast={showToast} setTab={setActiveTab} />
            )}
            {activeTab === 'paper-analysis' && (
              <PaperAnalysis user={user} showToast={showToast} />
            )}
            {activeTab === 'profile' && (
              <ProfileSetup 
                user={user} 
                course={academicCourse}
                sem={academicSem}
                setCourse={setAcademicCourse}
                setSem={setAcademicSem}
                onComplete={() => {
                  setProfileComplete(true)
                  localStorage.setItem('edusathi_course', academicCourse)
                  localStorage.setItem('edusathi_sem', academicSem)
                  localStorage.setItem('edusathi_profile_complete', 'true')
                  showToast('Profile updated successfully!', 'success')
                }}
                onStartTour={() => {
                  setActiveTourStep(0)
                  setActiveTab('dashboard')
                }}
              />
            )}
          </main>
        </>
      )}
      {activeTourStep !== null && (
        <TourPopover
          step={TOUR_STEPS[activeTourStep]}
          currentStepIndex={activeTourStep}
          totalSteps={TOUR_STEPS.length}
          onNext={() => {
            if (activeTourStep + 1 < TOUR_STEPS.length) {
              setActiveTourStep(activeTourStep + 1)
            } else {
              setActiveTourStep(null)
              localStorage.setItem('edusathi_tour_completed', 'true')
              showToast('Onboarding complete! Enjoy EduSathi.', 'success')
            }
          }}
          onPrev={() => {
            if (activeTourStep > 0) {
              setActiveTourStep(activeTourStep - 1)
            }
          }}
          onSkip={() => {
            setActiveTourStep(null)
            localStorage.setItem('edusathi_tour_completed', 'true')
            showToast('Walkthrough skipped.', 'info')
          }}
        />
      )}
    </div>
  )
}

// Sidebar Button Component
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  id?: string;
}

function NavButton({ active, onClick, icon, label, id }: NavButtonProps) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-violetAccent/10 border border-violetAccent/30 text-violetAccent font-bold' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
      }`}
    >
      <span className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110 text-violetAccent' : ''}`}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

/* ========================================================================= */
/* PAGE: AUTH SCREEN (Sign In / Register)                                    */
/* ========================================================================= */
function AuthScreen({ onLogin, showToast }: { onLogin: (u: User, isNewUser?: boolean) => void; showToast: any }) {
  const [loading, setLoading] = useState(false)

  const handleGoogleCustomLogin = () => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "278457635677-mockgoogleclientid.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setLoading(true)
              try {
                const res = await fetch('/api/auth/google-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: tokenResponse.access_token, is_access_token: true })
                })
                const data = await res.json()
                if (!res.ok) {
                  showToast(data.detail || 'Google login failed.', 'error')
                } else {
                  showToast(data.is_new_user ? `Welcome to EduSathi, ${data.user.name}!` : `Welcome back, ${data.user.name}!`, 'success')
                  onLogin(data.user, data.is_new_user)
                }
              } catch (e) {
                showToast('Google login connection error.', 'error')
              } finally {
                setLoading(false)
              }
            }
          }
        });
        client.requestAccessToken();
      } catch (e) {
        console.error("GSI token client initialization failed", e);
        showToast("Google client initialization error.", "error");
      }
    } else {
      showToast("Google Identity Services script is not loaded.", "error");
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 flex flex-col gap-6 items-center text-center">
        <div className="text-center flex flex-col gap-2">
          <GraduationCap className="w-16 h-16 text-violetAccent mx-auto filter drop-shadow-[0_0_10px_rgba(108,99,255,0.4)] mb-2" />
          <h1 className="font-header font-extrabold text-4xl bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent">
            EduSathi
          </h1>
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase font-header">Making Your Study Smarter</p>
        </div>

        <div className="w-full h-px bg-slate-800/80 my-2"></div>

        <button 
          type="button" 
          onClick={handleGoogleCustomLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-slate-800 bg-white/5 hover:bg-white/10 hover:border-slate-700 transition-all duration-300 text-base font-semibold text-slate-200 cursor-pointer shadow-lg glow-btn shimmer-button font-header"
        >
          {loading ? (
            <span className="text-sm">Connecting to Google...</span>
          ) : (
            <>
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.94l3.66 2.84c.87-2.6 3.3-4.4 6.16-4.4z" />
              </svg>
              <span>Sign In with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ========================================================================= */
/* INTERACTIVE TOUR CONFIGURATION & COMPONENT                                */
/* ========================================================================= */
interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to EduSathi!',
    content: 'EduSathi is your AI-powered study companion. We have designed a step-by-step interactive walkthrough to show you the key features of the platform. Let\'s explore!',
    placement: 'center',
    icon: <GraduationCap className="w-6 h-6 text-tealAccent filter drop-shadow-[0_0_8px_rgba(78,205,196,0.4)]" />
  },
  {
    target: '#sidebar-navigation',
    title: 'Workspace Navigation',
    content: 'This sidebar is your control deck. You can access Chat Tutor, Adaptive Quiz Arena, Exam Simulations, and Flashcard Suite from here.',
    placement: 'right',
    icon: <LayoutDashboard className="w-5 h-5 text-tealAccent" />
  },
  {
    target: '#nav-planner',
    title: 'AI Study Planner',
    content: 'Click here to set your next exam date and preferred study intensity. The AI will immediately map out daily study cards and practice tests on your calendar.',
    placement: 'right',
    icon: <Calendar className="w-5 h-5 text-tealAccent" />
  },
  {
    target: '#nav-profile',
    title: 'Configure Academic Profile',
    content: 'First things first! Go to Profile Settings to select your Course and Semester. The AI will customize all generated quizzes and questions to match your exact curriculum syllabus.',
    placement: 'right',
    icon: <Users className="w-5 h-5 text-tealAccent" />
  },
  {
    target: '#dashboard-telemetry',
    title: 'Topic Mastery Progression',
    content: 'Here, we analyze your quiz answer records. You will see detailed concentric circular progress telemetry charts indicating your unit mastery scores.',
    placement: 'top',
    icon: <Award className="w-5 h-5 text-tealAccent" />
  },
  {
    target: '#dashboard-quick-actions',
    title: 'Quick Launch Actions',
    content: 'Quickly upload your textbook PDFs to Chat Tutor, attempt adaptive MCQ sessions in Quiz Arena, or enter the timed Exam simulation room from here.',
    placement: 'top',
    icon: <Sparkles className="w-5 h-5 text-tealAccent" />
  }
]

interface TourPopoverProps {
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TourPopover({ step, currentStepIndex, totalSteps, onNext, onPrev, onSkip }: TourPopoverProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  useEffect(() => {
    const updatePosition = () => {
      if (!step.target || step.target === 'body') {
        setCoords(null)
        return
      }
      const el = document.querySelector(step.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    };
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [step])

  let popoverStyle: React.CSSProperties = {}
  if (!coords) {
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999
    }
  } else {
    const gap = 12
    const popoverWidth = 320
    const popoverHeight = 180

    if (step.placement === 'right') {
      popoverStyle = {
        position: 'fixed',
        top: coords.top + coords.height / 2 - popoverHeight / 2,
        left: coords.left + coords.width + gap,
        width: popoverWidth,
        zIndex: 9999
      }
    } else if (step.placement === 'left') {
      popoverStyle = {
        position: 'fixed',
        top: coords.top + coords.height / 2 - popoverHeight / 2,
        left: coords.left - popoverWidth - gap,
        width: popoverWidth,
        zIndex: 9999
      }
    } else if (step.placement === 'top') {
      popoverStyle = {
        position: 'fixed',
        top: coords.top - popoverHeight - gap,
        left: coords.left + coords.width / 2 - popoverWidth / 2,
        width: popoverWidth,
        zIndex: 9999
      }
    } else {
      popoverStyle = {
        position: 'fixed',
        top: coords.top + coords.height + gap,
        left: coords.left + coords.width / 2 - popoverWidth / 2,
        width: popoverWidth,
        zIndex: 9999
      }
    }
    
    if (popoverStyle.left && typeof popoverStyle.left === 'number') {
      if (popoverStyle.left < 10) popoverStyle.left = 10
      if (popoverStyle.left + popoverWidth > window.innerWidth - 10) {
        popoverStyle.left = window.innerWidth - popoverWidth - 10
      }
    }
    if (popoverStyle.top && typeof popoverStyle.top === 'number') {
      if (popoverStyle.top < 10) popoverStyle.top = 10
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[9990] pointer-events-auto overflow-hidden bg-transparent">
        {coords ? (
          <div 
            className="fixed rounded-xl border border-tealAccent shadow-[0_0_20px_rgba(78,205,196,0.55),_0_0_0_9999px_rgba(2,6,23,0.55)] pointer-events-none transition-all duration-300"
            style={{
              top: coords.top - 4,
              left: coords.left - 4,
              width: coords.width + 8,
              height: coords.height + 8,
            }}
          ></div>
        ) : (
          <div className="absolute inset-0 bg-slate-950/60 transition-all duration-300"></div>
        )}
      </div>

      <div 
        style={popoverStyle} 
        className="w-full max-w-[340px] glass-panel border border-slate-700/80 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 animate-scaleUp z-[9999] bg-slate-950/95"
      >
        <div className="flex justify-between items-center shrink-0">
          <span className="text-[10px] font-bold tracking-widest text-tealAccent uppercase font-header">
            Onboarding step {currentStepIndex + 1} of {totalSteps}
          </span>
          <button 
            onClick={onSkip} 
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold font-header"
          >
            Skip Tour
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-header font-bold text-base text-slate-100 flex items-center gap-2.5 leading-snug">
            {step.icon && <span className="shrink-0">{step.icon}</span>}
            <span>{step.title}</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
            {step.content}
          </p>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/80">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex ? 'bg-tealAccent scale-110' : 'bg-slate-700'
                }`}
              ></span>
            ))}
          </div>

          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <button 
                onClick={onPrev}
                className="text-[11px] font-bold px-3 py-1.5 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors font-header"
              >
                Back
              </button>
            )}
            <button 
              onClick={onNext}
              className="text-[11px] font-bold px-3 py-1.5 bg-gradient-to-r from-violetAccent to-tealAccent text-white rounded-lg hover:opacity-95 transition-opacity font-header shadow-lg"
            >
              {currentStepIndex === totalSteps - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ========================================================================= */
/* PAGE: PROFILE SETUP                                                       */
/* ========================================================================= */
interface ProfileSetupProps {
  user: User;
  course: string;
  sem: string;
  setCourse: (c: string) => void;
  setSem: (s: string) => void;
  onComplete: () => void;
  onStartTour?: () => void;
}

function ProfileSetup({ user, course, sem, setCourse, setSem, onComplete, onStartTour }: ProfileSetupProps) {
  const courses = ["BCA", "BBA", "B.Com", "B.Sc Computer Science", "MCA", "MBA", "M.Com"]
  const semesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester"]

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight">Academic Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Configure your course and semester preferences to tailor your learning materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4 relative overflow-hidden laser-border-container">
          <div className="laser-border-line"></div>
          
          <div className="relative mt-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violetAccent to-tealAccent p-1 shadow-[0_0_20px_rgba(108,99,255,0.3)]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Users className="w-10 h-10 text-tealAccent" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-violetAccent p-1.5 rounded-full border-2 border-slate-950">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <h3 className="font-header font-bold text-xl text-slate-200">{user.name}</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{user.email}</p>
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded bg-violetAccent/10 border border-violetAccent/30 text-violetAccent font-header">
            {user.role || 'Student'}
          </span>
          
          <div className="w-full h-px bg-slate-800/80 my-2"></div>
          
          <div className="w-full text-left flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Course</span>
              <span className="text-sm font-semibold text-slate-300 mt-0.5">{course || 'Not Configured'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Semester</span>
              <span className="text-sm font-semibold text-slate-300 mt-0.5">{sem || 'Not Configured'}</span>
            </div>
          </div>

          {onStartTour && (
            <>
              <div className="w-full h-px bg-slate-800/80 my-1"></div>
              <button 
                onClick={onStartTour}
                className="w-full text-xs bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-white px-4 py-2.5 rounded-xl text-slate-300 font-semibold transition-all mt-1 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-tealAccent" />
                Restart Welcome Tour
              </button>
            </>
          )}
        </div>

        {/* Right Side: Setup Form */}
        <div className="md:col-span-2 glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col gap-6">
          <h3 className="font-header font-bold text-lg text-slate-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-tealAccent" />
            Configure Course & Semester
          </h3>
          
          <p className="text-sm text-slate-400 leading-relaxed">
            By setting up your academic parameters, the AI Chat Tutor, Adaptive Quiz Arena, and Exam Room will automatically select contextually matching mock questions and curriculum modules.
          </p>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-header">Select Course</label>
              <select 
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full cursor-pointer"
              >
                <option value="">Choose Course...</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-header">Select Semester</label>
              <select 
                value={sem}
                onChange={e => setSem(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full cursor-pointer"
              >
                <option value="">Choose Semester...</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={onComplete}
                disabled={!course || !sem}
                className="flex-1 glow-btn shimmer-button text-white py-3.5 rounded-xl font-bold font-header disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg hover:shadow-violetAccent/20"
              >
                Save Academic Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
interface StudyPlannerProps {
  user: User;
  showToast: any;
  setTab: (t: string) => void;
}

interface StudyTask {
  id: number;
  plan_id: number;
  date: string;
  title: string;
  activity_type: string;
  estimated_minutes: number;
  completed: number;
}

interface StudyPlan {
  id: number;
  user_id: number;
  course: string;
  sem: string;
  target_exam_date: string;
  daily_time_limit: number;
  intensity_tier: string;
}

function StudyPlanner({ user, showToast, setTab }: StudyPlannerProps) {
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [examDate, setExamDate] = useState('')
  const [dailyLimit, setDailyLimit] = useState(60)
  const [intensity, setIntensity] = useState('balanced')
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-indexed
  const [rescheduling, setRescheduling] = useState(false)

  const fetchPlannerData = async () => {
    try {
      const res = await fetch(`/api/planner/tasks?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan)
        setTasks(data.tasks)
        if (data.plan) {
          setExamDate(data.plan.target_exam_date)
          setDailyLimit(data.plan.daily_time_limit)
          setIntensity(data.plan.intensity_tier)
        }
      }
    } catch (err) {
      showToast('Connection error fetching planner.', 'error')
    }
  }

  useEffect(() => {
    fetchPlannerData()
  }, [user.id])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examDate) {
      showToast('Please specify a target exam date.', 'error')
      return
    }
    try {
      const res = await fetch('/api/planner/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          course: localStorage.getItem('edusathi_course') || 'General',
          sem: localStorage.getItem('edusathi_sem') || '1st Semester',
          target_exam_date: examDate,
          daily_time_limit: dailyLimit,
          intensity_tier: intensity
        })
      })
      if (res.ok) {
        showToast('Study schedule generated successfully!', 'success')
        fetchPlannerData()
      } else {
        showToast('Failed to generate study schedule.', 'error')
      }
    } catch (err) {
      showToast('Network error during setup.', 'error')
    }
  }

  const toggleTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/planner/tasks/${taskId}/toggle`, { method: 'POST' })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: t.completed === 1 ? 0 : 1 } : t))
        showToast('Task updated!', 'success')
      }
    } catch (err) {
      showToast('Failed to update task.', 'error')
    }
  }

  const triggerReschedule = async () => {
    setRescheduling(true)
    try {
      const res = await fetch(`/api/planner/reschedule?user_id=${user.id}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        showToast(`Successfully rescheduled ${data.shifted_count} past task(s) to today!`, 'success')
        fetchPlannerData()
      }
    } catch (e) {
      showToast('Failed to reschedule tasks.', 'error')
    } finally {
      setRescheduling(false)
    }
  }

  // Calendar math helpers
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const firstDayIndex = (y: number, m: number) => new Date(y, m, 1).getDay()
  const totalDays = daysInMonth(currentYear, currentMonth)
  const startOffset = firstDayIndex(currentYear, currentMonth)
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const getTasksForDay = (dayNum: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return tasks.filter(t => t.date === dateStr)
  }

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight flex items-center gap-3">
          <span className="p-2 bg-violetAccent/10 rounded-xl border border-violetAccent/30 text-violetAccent">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          AI Smart Study Planner
        </h1>
        <p className="text-slate-400 text-sm mt-1">Countdown calendar mapped directly to your upcoming exam dates and textbook topics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Setup Study Plan */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6 h-fit relative overflow-hidden laser-border-container">
          <div className="laser-border-line"></div>
          <h3 className="font-header font-bold text-lg text-slate-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-tealAccent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Planner Settings
          </h3>

          <form onSubmit={handleSetup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Exam Target Date</label>
              <input 
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Workload intensity</label>
              <select 
                value={intensity}
                onChange={e => {
                  setIntensity(e.target.value)
                  if (e.target.value === 'chill') setDailyLimit(30)
                  else if (e.target.value === 'balanced') setDailyLimit(60)
                  else if (e.target.value === 'crunch') setDailyLimit(120)
                }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors cursor-pointer w-full"
              >
                <option value="chill">Chill Mode (30m / day)</option>
                <option value="balanced">Balanced Mode (60m / day)</option>
                <option value="crunch">Crunch Mode (120m / day)</option>
                <option value="custom">Custom Duration...</option>
              </select>
            </div>

            {intensity === 'custom' && (
              <div className="flex flex-col gap-1.5 animate-scaleUp">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Custom Daily Budget (Minutes)</label>
                <input 
                  type="number"
                  min="10"
                  max="480"
                  value={dailyLimit}
                  onChange={e => setDailyLimit(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full"
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              className="w-full glow-btn shimmer-button text-white font-bold py-3.5 rounded-xl font-header shadow-lg hover:shadow-violetAccent/20 text-sm mt-2 transition-all"
            >
              Generate Study Schedule
            </button>
          </form>

          {plan && (
            <>
              <div className="h-px bg-slate-800/80 my-1"></div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={triggerReschedule}
                  disabled={rescheduling}
                  className="w-full text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className={`w-4 h-4 text-tealAccent ${rescheduling ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                  </svg>
                  Reschedule Incomplete Tasks
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Month Calendar Grid or Mobile Agenda Checklist */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
          {!plan ? (
            <div className="flex flex-col items-center justify-center text-center p-12 gap-3 min-h-[300px]">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-full text-slate-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-header font-bold text-lg text-slate-300 mt-2">No Active Study Plan</h3>
              <p className="text-slate-500 text-xs max-w-sm">Configure your next exam target date in the left panel to populate your study calendar.</p>
            </div>
          ) : (
            <>
              {/* Desktop View: Full Grid Calendar */}
              <div className="hidden md:flex flex-col flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-header font-bold text-xl text-slate-200">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextMonth} className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-2 flex-1">
                  {/* Fill padding offset cells */}
                  {Array.from({ length: startOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="bg-slate-950/20 border border-transparent rounded-lg min-h-[90px] opacity-20"></div>
                  ))}
                  
                  {/* Month cells */}
                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const dayNum = idx + 1
                    const dayTasks = getTasksForDay(dayNum)
                    const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear
                    
                    return (
                      <div 
                        key={`day-${dayNum}`} 
                        className={`min-h-[95px] p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                          isToday 
                            ? 'bg-violetAccent/5 border-violetAccent shadow-[0_0_10px_rgba(108,99,255,0.15)]' 
                            : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700/60'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isToday ? 'text-violetAccent' : 'text-slate-500'}`}>
                          {dayNum} {isToday && <span className="text-[9px] font-semibold opacity-85 ml-0.5">(Today)</span>}
                        </span>
                        
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px] mt-1 pr-0.5">
                          {dayTasks.map(t => (
                            <button 
                              key={t.id}
                              onClick={() => toggleTask(t.id)}
                              className={`w-full text-left text-[9px] font-semibold p-1.5 rounded transition-all cursor-pointer flex items-center justify-between gap-1 select-none ${
                                t.completed === 1 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through' 
                                  : t.activity_type === 'quiz' 
                                    ? 'bg-tealAccent/10 text-tealAccent border border-tealAccent/20 hover:bg-tealAccent/20' 
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                              }`}
                            >
                              <span className="truncate">{t.title}</span>
                              {t.completed === 1 && (
                                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mobile View: Collapses to Agenda Feed list */}
              <div className="flex md:hidden flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="font-header font-bold text-lg text-slate-200">Daily Agenda Tasks</h3>
                  <span className="text-xs text-tealAccent font-bold bg-tealAccent/5 px-3 py-1 rounded-full border border-tealAccent/20 font-header">
                    {tasks.filter(t => t.completed === 1).length} / {tasks.length} Completed
                  </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {tasks.map(t => {
                    const taskDate = new Date(t.date + 'T00:00:00')
                    const dateLabel = taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    return (
                      <div 
                        key={t.id}
                        onClick={() => toggleTask(t.id)}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
                          t.completed === 1 
                            ? 'bg-emerald-950/10 border-emerald-900/50 text-slate-500' 
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{dateLabel}</span>
                          <span className={`text-sm font-semibold text-slate-200 truncate ${t.completed === 1 ? 'line-through text-slate-500' : ''}`}>
                            {t.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Estimated: {t.estimated_minutes} min</span>
                        </div>

                        <div className="shrink-0">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            t.completed === 1 
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}>
                            {t.completed === 1 && (
                              <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ========================================================================= */
/* PAGE: STUDENT DASHBOARD                                                   */
/* ========================================================================= */
interface StudentDashboardProps {
  user: User;
  mastery: TopicProgress[];
  attempts: QuizAttempt[];
  setTab: (t: string) => void;
  onRefresh: () => void;
}

function StudentDashboard({ user, mastery, attempts, setTab, onRefresh }: StudentDashboardProps) {
  useEffect(() => {
    onRefresh()
  }, [])

  const totalQuizzes = attempts.length
  const avgAccuracy = attempts.length 
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.total_questions * 100), 0) / attempts.length) 
    : 0
  
  const overallMastery = mastery.length
    ? Math.round(mastery.reduce((acc, curr) => acc + curr.mastery_score, 0) / mastery.length * 100)
    : 0

  return (
    <div className="flex flex-col gap-8 flex-1">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hello, {user.name}. Track your study metrics below.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-slate-200 px-4 py-2 rounded-xl text-slate-400 transition-all font-semibold"
        >
          Refresh Stats
        </button>
      </div>

      {/* Streak and Gamification Card with 3D flip interaction */}
      {attempts.length > 0 && (
        <div className="glass-panel laser-border-container p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-slate-700 duration-300">
          <div className="laser-border-line"></div>
          <div className="flex items-center gap-6">
            {/* 3D Flip Badge Container */}
            <div className="perspective-1000 w-16 h-16 cursor-pointer shrink-0">
              <div className="relative w-full h-full transform-style-3d transition-transform duration-500 hover:rotate-y-180">
                {/* Front face (Fire flame SVG) */}
                <div className="absolute inset-0 backface-hidden bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center">
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="url(#streakFlameGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="streakFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#FF5F6D" />
                        <stop offset="100%" stopColor="#FFC371" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2c0 0-4 4.5-4 8.5C8 14.5 12 21 12 21s4-6.5 4-10.5C16 6.5 12 2 12 2zM12 17c-2 0-3-2-3-4 0-2 1.5-4.5 3-5 1.5.5 3 3 3 5 0 2-1 4-3 4z" />
                  </svg>
                </div>
                {/* Back face */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-violetAccent/20 to-tealAccent/20 rounded-xl border border-tealAccent/40 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-tealAccent">MULTIPLIER</span>
                  <span className="text-sm font-extrabold text-white">1.5x XP</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-header font-bold text-lg text-slate-100 flex items-center gap-2">
                Streak Active
              </h4>
              <p className="text-xs text-slate-400">Your streak multipliers are active. Complete your daily tasks to level up.</p>
            </div>
          </div>
          <div className="w-full sm:w-64 text-left sm:text-right flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
              <span>Goal progress</span>
              <span className="text-tealAccent">80% XP</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-violetAccent to-tealAccent rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-header">Quizzes Answered</div>
          <div className="text-3xl font-extrabold text-white mt-2">{totalQuizzes}</div>
          <span className="text-xs text-tealAccent font-medium mt-1">✓ Logged in SQLite</span>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-header">Average Accuracy</div>
          <div className="text-3xl font-extrabold text-white mt-2">{avgAccuracy}%</div>
          <span className="text-xs text-violetAccent font-medium mt-1">Target benchmark: 75%</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-header">Overall Mastery</div>
          <div className="text-3xl font-extrabold text-white mt-2">{overallMastery}%</div>
          <span className="text-xs text-tealAccent font-medium mt-1">Updated dynamically</span>
        </div>
      </div>

      {/* Grid of Main Actions & Mastery Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Mastery Progression (Span 2) */}
        <div id="dashboard-telemetry" className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4 laser-border-container">
          <div className="laser-border-line"></div>
          <h3 className="font-header font-bold text-lg text-slate-200">Topic-wise Mastery Telemetry</h3>
          
          {mastery.length === 0 ? (
            <div className="text-slate-500 text-sm py-4">No mastery analytics recorded yet. Complete some quizzes in Quiz Arena.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
              {mastery.slice(0, 6).map((item, idx) => (
                <CircularMasteryRing
                  key={idx}
                  score={item.mastery_score}
                  label={item.topic}
                  subLabel={item.subject}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Launchpad */}
        <div id="dashboard-quick-actions" className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
          <h3 className="font-header font-bold text-lg text-slate-200">Quick Actions</h3>
          
          <div className="flex flex-col gap-3 mt-2">
            <button 
              onClick={() => setTab('chat')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <MessageSquareCode className="w-5 h-5 text-violetAccent" />
                <span className="text-sm font-semibold text-slate-300">Open RAG Chat</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button 
              onClick={() => setTab('quiz')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-tealAccent" />
                <span className="text-sm font-semibold text-slate-300">Start Quiz Arena</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button 
              onClick={() => setTab('exam')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-slate-300">Enter Exam Room</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ========================================================================= */
/* PAGE: AI CHAT TUTOR (RAG)                                                 */
/* ========================================================================= */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function ChatTutor({ user, docs, onRefresh, showToast }: { user: User; docs: Document[]; onRefresh: () => void; showToast: any }) {
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Document uploads fields
  const [subjectTag, setSubjectTag] = useState('')
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showDocSettings, setShowDocSettings] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileToUpload(e.dataTransfer.files[0])
    }
  }
  
  const [activeRef, setActiveRef] = useState<string | null>(null)

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[Ref \d+\])/g)
    return parts.map((part, index) => {
      const match = part.match(/\[Ref (\d+)\]/)
      if (match) {
        const refNum = match[1]
        const refKey = `ref${refNum}`
        return (
          <button
            key={index}
            onClick={() => setActiveRef(refKey)}
            className="inline-block bg-tealAccent/20 border border-tealAccent/40 hover:bg-tealAccent hover:text-black text-tealAccent px-1.5 py-0.5 rounded text-[10px] font-bold mx-1 transition-all cursor-pointer"
          >
            Ref {refNum}
          </button>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleDocToggle = (id: number) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    )
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileToUpload) return
    if (!subjectTag) {
      showToast('Please provide a subject tag.', 'error')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('user_id', String(user.id))
    formData.append('subject', subjectTag)
    formData.append('file', fileToUpload)

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Failed to ingest PDF.', 'error')
      } else {
        showToast('PDF Ingested and Vector Store populated!', 'success')
        setFileToUpload(null)
        setSubjectTag('')
        onRefresh()
      }
    } catch (e) {
      showToast('Connection failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    if (selectedDocs.length === 0) {
      showToast('Please select at least one study document for reference.', 'error')
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Collect paths of selected documents
    const selectedPaths = docs
      .filter(d => selectedDocs.includes(d.id))
      .map(d => d.vector_store_path)

    try {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          question: userMsg.content,
          store_paths: selectedPaths,
          history: messages
        })
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Query failed.', 'error')
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (err) {
      showToast('Query error.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 flex-1 h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center shrink-0 gap-4">
        <div>
          <h1 className="font-header font-extrabold text-2xl md:text-3xl text-slate-100 tracking-tight">AI Chat Tutor</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Converse with your study documents powered by RAG</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowDocSettings(!showDocSettings)}
          className="lg:hidden text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-slate-300 font-semibold shrink-0"
        >
          {showDocSettings ? 'Back to Chat' : 'Manage Docs'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-hidden relative">
        {/* Left pane: Ingestion & Document selector */}
        <div className={`${showDocSettings ? 'flex' : 'hidden lg:flex'} w-full lg:w-80 flex-col gap-6 shrink-0 overflow-y-auto h-full`}>
          {/* Upload panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-3 laser-border-container">
            <div className="laser-border-line"></div>
            <h3 className="font-header font-bold text-sm text-slate-200">Upload Study Material</h3>
            <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={subjectTag}
                onChange={e => setSubjectTag(e.target.value)}
                placeholder="Subject (E.g. OS, Maths)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violetAccent text-slate-100"
              />
              
              {/* Custom Drag and Drop Container */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 relative ${
                  dragActive 
                    ? 'border-tealAccent bg-tealAccent/5 scale-102' 
                    : fileToUpload 
                    ? 'border-violetAccent/50 bg-slate-900/30' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
                }`}
              >
                <input 
                  type="file"
                  id="chat-file-upload"
                  onChange={e => e.target.files && setFileToUpload(e.target.files[0])}
                  className="hidden"
                  accept=".pdf"
                />
                <label htmlFor="chat-file-upload" className="cursor-pointer flex flex-col items-center w-full">
                  <svg className={`w-10 h-10 mb-2 transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill="none" stroke={dragActive ? '#4ECDC4' : '#6C63FF'} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" className="animate-pulse" />
                    <polyline points="9 15 12 12 15 15" />
                  </svg>
                  <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[180px]">
                    {fileToUpload ? fileToUpload.name : dragActive ? "Release to drop file" : "Drag PDF or click to browse"}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1">PDF up to 10MB</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={uploading || !fileToUpload}
                className="glow-btn shimmer-button text-white py-2 rounded-xl text-xs font-bold font-header flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Processing...' : 'Upload PDF'}
              </button>
            </form>
          </div>

          {/* Doc List panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex-1 flex flex-col min-h-0">
            <h3 className="font-header font-bold text-sm text-slate-200 mb-3 shrink-0">Select Reference Docs</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pr-1">
              {docs.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">No PDFs uploaded yet. Upload one above!</div>
              ) : (
                docs.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => handleDocToggle(doc.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex items-center gap-3 ${
                      selectedDocs.includes(doc.id) 
                        ? 'bg-violetAccent/10 border-violetAccent/40 text-violetAccent' 
                        : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate text-slate-200">{doc.filename}</div>
                      <div className="text-[10px] text-slate-500 font-header font-bold uppercase mt-0.5">{doc.subject_tag}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Chat dialog box */}
        <div className={`${showDocSettings ? 'hidden lg:flex' : 'flex'} flex-1 flex gap-6 min-h-0 h-full`}>
          <div className="flex-1 glass-panel rounded-2xl border border-slate-800/80 flex flex-col min-h-0 overflow-hidden relative">
            {/* Scrollable messages log */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <MessageSquareCode className="w-10 h-10 text-slate-600 animate-bounce" />
                  <div className="text-sm font-semibold">Ready for Academic Queries</div>
                  <div className="text-xs max-w-sm text-center">Select documents on the left and ask a question below. Answers will be grounded strictly in your PDFs.</div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1`}>
                      {m.role === 'user' ? 'You' : 'EduSathi Tutor'}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-violetAccent text-white rounded-tr-none' 
                        : 'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      {m.role === 'user' ? m.content : renderMessageContent(m.content)}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="self-start max-w-[80%] flex flex-col items-start">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">EduSathi Tutor</div>
                  <div className="px-4 py-3 rounded-2xl text-sm bg-slate-900/60 border border-slate-800 text-slate-400 rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-tealAccent rounded-full animate-ping"></span>
                    <span>Ingesting context and thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 shrink-0 flex gap-3 bg-slate-900/20">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about the referenced PDF materials..."
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-violetAccent text-slate-100"
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="glow-btn text-white px-6 py-3.5 rounded-xl font-bold font-header tracking-wider disabled:opacity-50 flex items-center gap-2"
              >
                Send
              </button>
            </form>
          </div>

          {activeRef && (
            <div className="fixed lg:static inset-y-0 right-0 w-80 lg:w-96 glass-panel rounded-l-2xl lg:rounded-2xl border-l lg:border border-slate-800/80 p-5 flex flex-col gap-4 overflow-y-auto z-20 transition-all duration-300 bg-slate-950/95 lg:bg-transparent">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-header font-bold text-sm text-slate-200">📄 Source Reference</h4>
                <button type="button" onClick={() => setActiveRef(null)} className="text-slate-500 hover:text-slate-200">✕</button>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed flex flex-col gap-4">
                <p className={`p-3 rounded-lg border transition-all duration-500 ${activeRef === 'ref1' ? 'bg-amber-500/10 border-amber-500/40 text-slate-200' : 'border-transparent'}`}>
                  <strong>[SECTION 4.2: TCP Reliability]</strong><br />
                  TCP utilizes sequence numbering, checksum validations, and handshakes to secure byte deliveries.
                </p>
                <p className={`p-3 rounded-lg border transition-all duration-500 ${activeRef === 'ref2' ? 'bg-amber-500/10 border-amber-500/40 text-slate-200' : 'border-transparent'}`}>
                  <strong>[SECTION 4.3: UDP Datagrams]</strong><br />
                  UDP drops flow control. Datagrams are streamed asynchronously to minimize latency.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ========================================================================= */
/* PAGE: ADAPTIVE QUIZ ARENA                                                 */
/* ========================================================================= */
function QuizArena({ user, docs, onRefresh, showToast }: { user: User; docs: Document[]; onRefresh: () => void; showToast: any }) {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [nQ, setNQ] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const handleDocToggle = (id: number) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    )
  }

  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  
  // Game session states
  const [sessionIndex, setSessionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [difficultyHistory, setDifficultyHistory] = useState<string[]>([])
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState('medium')

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic) {
      showToast('Please define a quiz topic.', 'error')
      return
    }

    setLoading(true)
    const selectedPaths = docs
      .filter(d => selectedDocs.includes(d.id))
      .map(d => d.vector_store_path)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'General',
          topic,
          difficulty,
          n_questions: nQ,
          store_paths: selectedPaths
        })
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Could not generate quiz questions.', 'error')
      } else {
        setQuestions(data.questions)
        setSessionIndex(0)
        setScore(0)
        setSessionHistory([])
        setDifficultyHistory([difficulty])
        setActiveDifficulty(difficulty)
        setQuizComplete(false)
        setAnswerSubmitted(false)
        setSelectedOption(null)
        showToast('Quiz generated! Good luck.', 'success')
      }
    } catch (e) {
      showToast('Connection failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOption = (option: string) => {
    if (answerSubmitted) return
    setSelectedOption(option)
    setAnswerSubmitted(true)

    const q = questions[sessionIndex]
    const correctLetter = q.answer[0].toUpperCase()
    const selectedLetter = option[0].toUpperCase()
    const isCorrect = correctLetter === selectedLetter

    if (isCorrect) setScore(s => s + 1)

    const newHistoryItem = {
      question: q.question,
      selected: option,
      correct: isCorrect,
      explanation: q.explanation,
      correct_answer: q.answer
    }
    setSessionHistory(prev => [...prev, newHistoryItem])

    // Adapt difficulty dynamically for subsequent questions based on last answers
    const currentAttempts = [...sessionHistory, newHistoryItem]
    if (currentAttempts.length >= 3) {
      const recent = currentAttempts.slice(-3)
      const accuracy = recent.filter(r => r.correct).length / 3.0
      
      let nextDiff = activeDifficulty
      if (accuracy >= 0.8) nextDiff = 'hard'
      else if (accuracy <= 0.4) nextDiff = 'easy'
      else nextDiff = 'medium'
      
      setActiveDifficulty(nextDiff)
      setDifficultyHistory(prev => [...prev, nextDiff])
    }
  }

  const handleNext = async () => {
    if (sessionIndex + 1 >= questions.length) {
      // Quiz complete! Submit to SQLite backend
      setQuizComplete(true)
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            subject: subject || 'General',
            topic,
            score,
            total: questions.length,
            difficulty: activeDifficulty,
            history: sessionHistory
          })
        })
        showToast('Quiz attempt saved!', 'success')
        onRefresh()
      } catch (e) {
        showToast('Failed to save score.', 'error')
      }
    } else {
      setSessionIndex(i => i + 1)
      setSelectedOption(null)
      setAnswerSubmitted(false)
    }
  }

  const resetSession = () => {
    setQuestions([])
    setQuizComplete(false)
  }

  return (
    <div className="flex flex-col gap-6 flex-1 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="font-header font-extrabold text-2xl md:text-3xl text-slate-100 tracking-tight">Quiz Arena</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Adaptive difficulty testing that updates your mastery analytics</p>
        </div>
        {questions.length === 0 && (
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="lg:hidden text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-slate-300 font-semibold shrink-0 font-header"
          >
            {showSettings ? 'Show Info' : 'Configure Quiz'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Sparkles className="w-12 h-12 text-tealAccent animate-spin" />
          <div className="font-header font-bold text-lg text-slate-200">Generating MCQ Questions</div>
          <div className="text-xs text-slate-400">EduSathi AI is reading reference materials and framing queries...</div>
        </div>
      ) : questions.length === 0 ? (
        /* Configuration form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleStartQuiz} className={`${showSettings ? 'flex' : 'hidden lg:flex'} col-span-1 lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4`}>
            <h3 className="font-header font-bold text-lg text-slate-200 mb-2">Configure Quiz Settings</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  placeholder="E.g. Discrete Mathematics" 
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100 font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Topic</label>
                <input 
                  type="text" 
                  value={topic} 
                  onChange={e => setTopic(e.target.value)}
                  placeholder="E.g. Group Theory" 
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Number of Questions</label>
                <input 
                  type="number" 
                  min="3" max="15"
                  value={nQ} 
                  onChange={e => setNQ(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100 font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Starting Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-300 font-sans cursor-pointer"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-300 font-header">Reference Study Materials (Select to query from PDFs)</label>
              {docs.length === 0 ? (
                <div className="text-xs text-slate-500 border border-slate-800/80 p-3 rounded-lg bg-slate-950/40">No uploaded files. Quiz will generate from general subject information.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {docs.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => handleDocToggle(doc.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-300 truncate ${
                        selectedDocs.includes(doc.id) 
                          ? 'bg-violetAccent/10 border-violetAccent/40 text-violetAccent font-semibold' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-500 shrink-0" /> {doc.filename}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={!topic} className="glow-btn shimmer-button text-white py-3.5 rounded-xl font-bold font-header tracking-wide mt-4 disabled:opacity-40">
              Start Quiz Arena
            </button>
          </form>
 
          {/* Info box */}
          <div className={`${showSettings ? 'hidden lg:flex' : 'flex'} glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4 text-sm leading-relaxed text-slate-400`}>
            <h4 className="font-header font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-tealAccent shrink-0" /> Adaptive MCQ Mechanics
            </h4>
            <ul className="list-disc pl-4 flex flex-col gap-3">
              <li>Questions are extracted contextually using RAG search over selected files.</li>
              <li>Every 3 questions, accuracy is assessed. High accuracy (80%+) shifts difficulty to <strong>Hard</strong>, low accuracy (40%-) scales down to <strong>Easy</strong>.</li>
              <li>Mastery tracker compiles scores and saves attempt histories in the SQLite database automatically.</li>
            </ul>
          </div>
        </div>
      ) : quizComplete ? (
        /* Quiz Summary Page */
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center flex flex-col gap-6 max-w-md mx-auto">
          <div className="flex justify-center text-tealAccent">
            <Award className="w-16 h-16 animate-pulse filter drop-shadow-[0_0_10px_rgba(78,205,196,0.3)]" />
          </div>
          <h2 className="font-header font-bold text-2xl text-white">Quiz Completed!</h2>
          
          <div className="flex flex-col gap-2">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent">
              {score} / {questions.length}
            </div>
            <div className="text-sm font-semibold text-tealAccent">
              Accuracy: {Math.round(score / questions.length * 100)}%
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Peak Difficulty: <span className="text-amber-400 uppercase font-semibold">{activeDifficulty}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button onClick={resetSession} className="glow-btn shimmer-button text-white py-3 rounded-xl font-bold font-header">
              Start New Arena Session
            </button>
          </div>
        </div>
      ) : (
        /* Active quiz session */
        <div className="flex flex-col gap-6">
          {/* Progress header */}
          <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs text-slate-300 font-header font-bold">
              QUESTION {sessionIndex + 1} OF {questions.length}
            </span>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-tealAccent">Current Score: {score}</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 uppercase font-bold tracking-widest bg-amber-400/10 px-2 py-0.5 border border-amber-400/20 rounded">
                {activeDifficulty}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violetAccent to-tealAccent transition-all duration-300"
              style={{ width: `${(sessionIndex + 1) / questions.length * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 font-header font-bold text-lg text-slate-100">
            {questions[sessionIndex].question}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {questions[sessionIndex].options.map((opt, idx) => {
              const letter = opt[0].toUpperCase()
              const correctLetter = questions[sessionIndex].answer[0].toUpperCase()
              
              let optStyle = 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
              if (answerSubmitted) {
                if (letter === correctLetter) {
                  optStyle = 'border-tealAccent/60 bg-tealAccent/10 text-tealAccent'
                } else if (selectedOption === opt && letter !== correctLetter) {
                  optStyle = 'border-rose-500/60 bg-rose-500/10 text-rose-400'
                } else {
                  optStyle = 'border-slate-800 bg-slate-900/10 text-slate-500 opacity-60'
                }
              }

              return (
                <button 
                  key={idx}
                  disabled={answerSubmitted}
                  onClick={() => handleSubmitOption(opt)}
                  className={`p-4 rounded-xl border text-left text-sm transition-all duration-300 flex items-center gap-3 ${optStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-xs shrink-0">{letter}</span>
                  <span>{opt.slice(3)}</span>
                </button>
              )
            })}
          </div>

          {/* Explanation drawer when answered */}
          {answerSubmitted && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold font-header tracking-wider uppercase">
                <Sparkles className="w-4 h-4 text-violetAccent" />
                <span>Explanation</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">{questions[sessionIndex].explanation}</p>
              
              <button onClick={handleNext} className="glow-btn text-white py-3 rounded-xl font-bold font-header mt-3">
                {sessionIndex + 1 >= questions.length ? 'Finish & Save results' : 'Next Question'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

/* ========================================================================= */
/* PAGE: TIMED EXAM ROOM                                                     */
/* ========================================================================= */
function ExamRoom({ user, docs, onRefresh, showToast }: { user: User; docs: Document[]; onRefresh: () => void; showToast: any }) {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [nQ, setNQ] = useState(10)
  const [timeLimit, setTimeLimit] = useState(30) // Minutes
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])

  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  
  // Timed exam session states
  const [examActive, setExamActive] = useState(false)
  const [examComplete, setExamComplete] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0) // Seconds
  const [examScore, setExamScore] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer Effect
  useEffect(() => {
    if (!examActive || examComplete) return
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return t - 1
      })
      setElapsedTime(e => e + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [examActive, examComplete])

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic) {
      showToast('Please state the exam topic.', 'error')
      return
    }

    setLoading(true)
    const selectedPaths = docs
      .filter(d => selectedDocs.includes(d.id))
      .map(d => d.vector_store_path)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'General Exam',
          topic,
          difficulty: 'medium', // Exams are locked to Medium default difficulty
          n_questions: nQ,
          store_paths: selectedPaths
        })
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Failed to construct mock exam questions.', 'error')
      } else {
        setQuestions(data.questions)
        setAnswers({})
        setTimeLeft(timeLimit * 60)
        setElapsedTime(0)
        setExamActive(true)
        setExamComplete(false)
        showToast('Exam started! Keep an eye on the countdown.', 'success')
      }
    } catch (e) {
      showToast('Connection failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (qIdx: number, val: string) => {
    setAnswers(prev => ({ ...prev, [qIdx]: val }))
  }

  const handleAutoSubmit = () => {
    showToast('Timer expired! Exam auto-submitted.', 'error')
    handleSubmitExam(true)
  }

  const handleSubmitExam = async (force: boolean = false) => {
    if (!force && Object.keys(answers).length < questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) return
    }

    setExamComplete(true)
    
    // Evaluate scores
    let finalScore = 0
    const historyList = questions.map((q, idx) => {
      const correctLetter = q.answer[0].toUpperCase()
      const selectedVal = answers[idx] || ''
      const selectedLetter = selectedVal ? selectedVal[0].toUpperCase() : ''
      const isCorrect = correctLetter === selectedLetter

      if (isCorrect) finalScore += 1

      return {
        question: q.question,
        selected: selectedVal,
        correct: isCorrect,
        explanation: q.explanation,
        correct_answer: q.answer
      }
    })

    setExamScore(finalScore)

    try {
      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          subject: subject || 'General Exam',
          topic,
          score: finalScore,
          total: questions.length,
          difficulty: 'exam',
          history: historyList
        })
      })
      showToast('Exam results saved!', 'success')
      onRefresh()
    } catch (e) {
      showToast('Could not save exam results.', 'error')
    }
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <div className="flex flex-col gap-6 flex-1 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight">Exam Room</h1>
        <p className="text-slate-400 text-sm mt-1">Timed simulation designed to model university exam environments</p>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Clock className="w-12 h-12 text-amber-400 animate-pulse" />
          <div className="font-header font-bold text-lg text-slate-200">Structuring Simulation Questions</div>
          <div className="text-xs text-slate-400">Loading vectors, compiling test structures...</div>
        </div>
      ) : !examActive ? (
        /* Configuration Panel */
        <div className="grid grid-cols-3 gap-8">
          <form onSubmit={handleStartExam} className="col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <h3 className="font-header font-bold text-lg text-slate-200 mb-2">Configure Mock Exam</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  placeholder="E.g. Computer Networks" 
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Topic</label>
                <input 
                  type="text" 
                  value={topic} 
                  onChange={e => setTopic(e.target.value)}
                  placeholder="E.g. OSI Protocol Model" 
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Questions (5 - 30)</label>
                <input 
                  type="number" 
                  min="5" max="30"
                  value={nQ} 
                  onChange={e => setNQ(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 font-header">Time Limit (Minutes)</label>
                <input 
                  type="number" 
                  min="5" max="120"
                  value={timeLimit} 
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-300 font-header">Ingestion Docs</label>
              {docs.length === 0 ? (
                <div className="text-xs text-slate-500 border border-slate-800/80 p-3 rounded-lg bg-slate-950/40">No uploaded files. Exam will generate from general subject information.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {docs.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => handleDocToggle(doc.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-300 truncate ${
                        selectedDocs.includes(doc.id) 
                          ? 'bg-violetAccent/10 border-violetAccent/40 text-violetAccent font-semibold' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-500 shrink-0" /> {doc.filename}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={!topic} className="glow-btn shimmer-button text-white py-3.5 rounded-xl font-bold font-header tracking-wide mt-4 disabled:opacity-40">
              Start Timed Simulation
            </button>
          </form>

          {/* Regulations */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4 text-xs leading-relaxed text-slate-400">
            <h4 className="font-header font-bold text-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-violetAccent" /> Exam Regulations
            </h4>
            <ul className="list-disc pl-4 flex flex-col gap-3">
              <li>The timer starts counting down instantly and cannot be paused.</li>
              <li>Exiting the tab or page does not stop the timer.</li>
              <li>Once time expires, answers are auto-submitted and locked.</li>
              <li>Answers can be changed freely until the final submit button is triggered.</li>
            </ul>
          </div>
        </div>
      ) : examComplete ? (
        /* Results Summary */
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center flex flex-col gap-4 max-w-md mx-auto">
            <div className="flex justify-center text-amber-400">
              <Clock className="w-16 h-16 animate-pulse filter drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
            </div>
            <h2 className="font-header font-bold text-2xl text-white">Simulation Completed</h2>
            
            <div className="text-4xl font-extrabold bg-gradient-to-r from-violetAccent to-tealAccent bg-clip-text text-transparent">
              {examScore} / {questions.length} ({Math.round(examScore / questions.length * 100)}%)
            </div>
            
            <p className="text-slate-400 text-xs mt-2">
              Time elapsed: <span className="text-amber-400 font-bold">{Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
            </p>

            <button onClick={() => setExamActive(false)} className="glow-btn shimmer-button text-white py-3 rounded-xl font-bold font-header mt-4">
              Return to Exam setup
            </button>
          </div>

          {/* Detailed Review */}
          <div className="flex flex-col gap-4">
            <h3 className="font-header font-bold text-lg text-slate-200">Detailed Question Review</h3>
            {questions.map((q, idx) => {
              const correctLetter = q.answer[0].toUpperCase()
              const selectedVal = answers[idx] || 'Not Answered'
              const selectedLetter = selectedVal ? selectedVal[0].toUpperCase() : ''
              const isCorrect = correctLetter === selectedLetter

              return (
                <div key={idx} className={`glass-panel p-5 rounded-2xl border ${isCorrect ? 'border-tealAccent/30 bg-tealAccent/5' : 'border-rose-500/20 bg-rose-500/5'} flex flex-col gap-2`}>
                  <div className="font-semibold text-sm">Q{idx+1}. {q.question}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Your answer: <span className={isCorrect ? 'text-tealAccent font-bold' : 'text-rose-400 font-bold'}>{selectedVal || '[Not Answered]'}</span> 
                    &nbsp;|&nbsp; Correct answer: <span className="text-tealAccent font-bold">{q.answer}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-2 bg-black/30 p-3 rounded-lg leading-relaxed">{q.explanation}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Active timed exam view */
        <div className="flex flex-col gap-6">
          {/* Floating timer */}
          <div className={`sticky top-0 z-30 p-4 border border-slate-800/80 rounded-xl bg-slate-950/90 flex justify-between items-center ${timeLeft < 120 ? 'text-rose-400 animate-pulse' : 'text-tealAccent'}`}>
            <span className="font-header font-bold text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> TIME REMAINING: {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-slate-400">Answered {Object.keys(answers).length} of {questions.length}</span>
          </div>

          {/* List of questions */}
          <div className="flex flex-col gap-6 mt-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <div className="font-header font-bold text-sm text-slate-200">
                  Q{qIdx + 1}. {q.question}
                </div>
                
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIdx) => (
                    <label 
                      key={oIdx}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all duration-300 ${
                        answers[qIdx] === opt 
                          ? 'bg-violetAccent/10 border-violetAccent/40 text-violetAccent font-semibold' 
                          : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={`exam_radio_${qIdx}`}
                        checked={answers[qIdx] === opt}
                        onChange={() => handleSelectAnswer(qIdx, opt)}
                        className="accent-violetAccent shrink-0"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button onClick={() => handleSubmitExam(false)} className="glow-btn shimmer-button text-white py-3.5 rounded-xl font-bold font-header tracking-wide mt-4">
            Submit Exam Paper
          </button>
        </div>
      )}
    </div>
  )

  function handleDocToggle(id: number) {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    )
  }
}

/* ========================================================================= */
/* PAGE: INTERACTIVE FLASHCARD DECK                                          */
/* ========================================================================= */
function FlashcardDeck({ user, docs, cards, onRefresh, showToast }: { user: User; docs: Document[]; cards: Flashcard[]; onRefresh: () => void; showToast: any }) {
  const [selectedDoc, setSelectedDoc] = useState<number | ''>('')
  const [topicHint, setTopicHint] = useState('')
  const [nCards, setNCards] = useState(10)
  const [loading, setLoading] = useState(false)

  // Tracker for flipped cards
  const [flippedCards, setFlippedCards] = useState<number[]>([])

  const handleToggleFlip = (id: number) => {
    setFlippedCards(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    )
  }

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoc) {
      showToast('Please select a study document.', 'error')
      return
    }

    setLoading(true)
    const docObj = docs.find(d => d.id === selectedDoc)
    if (!docObj) return

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          document_id: docObj.id,
          vector_store_path: docObj.vector_store_path,
          topic_hint: topicHint,
          n_cards: nCards
        })
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Could not generate flashcards.', 'error')
      } else {
        showToast(`Successfully created ${nCards} flashcards!`, 'success')
        setTopicHint('')
        setFlippedCards([])
        onRefresh()
      }
    } catch (e) {
      showToast('Connection failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetAllFlips = () => {
    setFlippedCards([])
  }

  return (
    <div className="flex flex-col gap-6 flex-1 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight">Flashcard Deck</h1>
          <p className="text-slate-400 text-sm mt-1">Generate key definitions and revise rapidly with interactive cards</p>
        </div>
        {cards.length > 0 && (
          <button 
            onClick={resetAllFlips}
            className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-slate-200 px-4 py-2 rounded-xl text-slate-400 transition-all font-semibold"
          >
            Reset Card Flips
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-4 min-h-[350px]">
          <Layers className="w-12 h-12 text-violetAccent animate-bounce" />
          <div className="font-header font-bold text-lg text-slate-200">Extracting Terms and Building Cards</div>
          <div className="text-xs text-slate-400">Consulting LLaMA-3.3 LLM for key definitions...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Generation configurations */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <h3 className="font-header font-bold text-sm text-slate-200">Generate New Flashcard Suite</h3>
            
            <form onSubmit={handleGenerateCards} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 font-header">Select Document</label>
                <select 
                  value={selectedDoc} 
                  onChange={e => setSelectedDoc(e.target.value ? Number(e.target.value) : '')}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violetAccent text-slate-300 w-full"
                >
                  <option value="">Select PDF...</option>
                  {docs.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 font-header">Topic Hint (Optional)</label>
                <input 
                  type="text" 
                  value={topicHint}
                  onChange={e => setTopicHint(e.target.value)}
                  placeholder="E.g. Time Complexities"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 font-header">Quantity</label>
                <input 
                  type="number" 
                  min="5" max="30"
                  value={nCards}
                  onChange={e => setNCards(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-violetAccent text-slate-100"
                />
              </div>

              <button type="submit" disabled={!selectedDoc} className="glow-btn shimmer-button text-white py-2.5 rounded-xl text-xs font-bold font-header disabled:opacity-40 h-max w-full">
                Create Cards
              </button>
            </form>
          </div>

          {/* Cards Grid */}
          {cards.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm glass-panel rounded-2xl border border-slate-800/80">
              No flashcards in your deck. Configure and generate a suite above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map(card => {
                const isFlipped = flippedCards.includes(card.id)
                return (
                  <div 
                    key={card.id}
                    onClick={() => handleToggleFlip(card.id)}
                    className="h-56 perspective-1000 cursor-pointer w-full"
                  >
                    <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* FRONT OF CARD */}
                      <div className="absolute inset-0 w-full h-full backface-hidden glass-panel border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-violetAccent/40 hover:shadow-lg hover:shadow-violetAccent/5 transition-all duration-300">
                        <div>
                           <div className="text-[10px] font-bold text-violetAccent tracking-widest font-header uppercase flex items-center gap-1">
                             <FileText className="w-3.5 h-3.5 text-violetAccent shrink-0" /> Term / Question
                           </div>
                          <div className="text-sm font-header font-bold text-slate-100 leading-relaxed mt-4">{card.front}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/60 pt-3">
                          Click to Flip and Reveal Answer
                        </div>
                      </div>

                      {/* BACK OF CARD */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-panel border border-tealAccent/20 rounded-2xl p-5 flex flex-col justify-between bg-tealAccent/5">
                        <div>
                           <div className="text-[10px] font-bold text-tealAccent tracking-widest font-header uppercase flex items-center gap-1">
                             <Sparkles className="w-3.5 h-3.5 text-tealAccent shrink-0" /> Definition / Answer
                           </div>
                          <div className="text-xs text-slate-300 leading-relaxed mt-4">{card.back}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-header font-semibold truncate text-center border-t border-tealAccent/10 pt-3 flex items-center justify-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" /> {card.filename}
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========================================================================= */
/* PAGE: PROGRESS ANALYTICS & PDF REPORT                                     */
/* ========================================================================= */
function ProgressAnalytics({ user, mastery, attempts }: { user: User; mastery: TopicProgress[]; attempts: QuizAttempt[] }) {
  const downloadReport = () => {
    window.open(`/api/analytics/export-pdf/${user.id}/${encodeURIComponent(user.name)}`, '_blank')
  }

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-header font-extrabold text-2xl md:text-3xl text-slate-100 tracking-tight">Progress Analytics</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Review mastery statistics and export compiled PDF report sheets</p>
        </div>
        {attempts.length > 0 && (
          <button 
            onClick={downloadReport}
            className="glow-btn shimmer-button text-white px-5 py-2.5 rounded-xl font-bold font-header text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileText className="w-4 h-4" />
            Export PDF Report
          </button>
        )}
      </div>

      {/* Syllabus Coverage Heatmap Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
        <h3 className="font-header font-bold text-lg text-slate-200">Syllabus Coverage Heatmap</h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-2">
          {Array.from({ length: 12 }).map((_, idx) => {
            const score = mastery[idx]?.mastery_score || 0
            const color = score >= 0.8 ? 'bg-tealAccent shadow-[0_0_8px_rgba(78,205,196,0.4)]' : score >= 0.5 ? 'bg-violetAccent shadow-[0_0_8px_rgba(108,99,255,0.4)]' : score > 0 ? 'bg-violetAccent/30' : 'bg-slate-900'
            const topicName = mastery[idx]?.topic || `Unit ${idx + 1} Syllabus Core`
            return (
              <div key={idx} className={`aspect-square rounded border border-slate-800 ${color} cursor-pointer hover:scale-110 transition-transform relative group`}>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black/95 text-slate-200 text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 border border-slate-800">
                  {topicName}: {Math.round(score * 100)}% Mastery
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2 mt-2">
          <span>Weakest Area: {mastery.find(m => m.mastery_score < 0.5)?.topic || 'Unmapped Core Units'}</span>
          <span className="text-tealAccent font-semibold">Suggested Action: Attempt Adaptive Quiz Arena</span>
        </div>
      </div>

      {/* Grid: Mastery Levels & Quiz Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Topic progress logs (Span 2) */}
        <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <h3 className="font-header font-bold text-lg text-slate-200">Topic-wise Mastery Telemetry</h3>
          
          <div className="flex flex-col gap-4 mt-2">
            {mastery.length === 0 ? (
              <div className="text-slate-500 text-sm py-4">No mastery records available yet. Complete a quiz to index progress.</div>
            ) : (
              mastery.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 font-header">{item.topic} <span className="text-slate-500">({item.subject})</span></span>
                    <span className={item.mastery_score >= 0.8 ? 'text-tealAccent' : item.mastery_score < 0.5 ? 'text-rose-400' : 'text-amber-400'}>
                      {Math.round(item.mastery_score * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                    <div 
                      className={`h-full rounded-full ${
                        item.mastery_score >= 0.8 ? 'bg-tealAccent' : item.mastery_score < 0.5 ? 'bg-rose-500' : 'bg-violetAccent'
                      }`}
                      style={{ width: `${item.mastery_score * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Weak & Strong Topics Indicators */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-widest text-tealAccent font-header uppercase flex items-center">
              <Award className="w-4 h-4 mr-1.5 text-tealAccent" /> Strong Areas
            </h4>
            <div className="flex flex-col gap-2 mt-1">
              {mastery.filter(m => m.mastery_score >= 0.8).length === 0 ? (
                <span className="text-slate-500 text-xs">No topics mastered yet.</span>
              ) : (
                mastery.filter(m => m.mastery_score >= 0.8).map((m, idx) => (
                  <span key={idx} className="text-xs text-slate-300 bg-tealAccent/5 border border-tealAccent/20 px-2 py-1.5 rounded-lg font-semibold flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-400 shrink-0" /> {m.topic}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-widest text-rose-400 font-header uppercase flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-400" /> Target Areas to Practice
            </h4>
            <div className="flex flex-col gap-2 mt-1">
              {mastery.filter(m => m.mastery_score < 0.5).length === 0 ? (
                <span className="text-slate-500 text-xs">All areas stable. Good job!</span>
              ) : (
                mastery.filter(m => m.mastery_score < 0.5).map((m, idx) => (
                  <span key={idx} className="text-xs text-slate-300 bg-rose-500/5 border border-rose-500/20 px-2 py-1.5 rounded-lg font-semibold flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-rose-400 shrink-0" /> {m.topic}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="font-header font-bold text-lg text-slate-200 mb-4">Quiz Attempt History</h3>
        
        {attempts.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center">No quiz history on file.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-header font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {attempts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-900/20">
                    <td className="py-3.5 px-4">{a.attempted_at.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-3.5 px-4 font-semibold">{a.subject}</td>
                    <td className="py-3.5 px-4">{a.topic}</td>
                    <td className="py-3.5 px-4 text-tealAccent font-bold">{a.score} / {a.total_questions}</td>
                    <td className="py-3.5 px-4 uppercase tracking-wider font-semibold">{a.difficulty_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ========================================================================= */
/* PAGE: PAPER ANALYSIS CONSOLE                                              */
/* ========================================================================= */
function PaperAnalysis({ user, showToast }: { user: User; showToast: any }) {
  const [paperSubject, setPaperSubject] = useState('')
  const [paperFile, setPaperFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [analysisFile, setAnalysisFile] = useState<File | null>(null)
  const [nTopics, setNTopics] = useState(10)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedTopics, setAnalyzedTopics] = useState<any[]>([])

  const [dragActivePaper, setDragActivePaper] = useState(false)
  const [dragActiveAnalysis, setDragActiveAnalysis] = useState(false)

  const handleDragPaper = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActivePaper(true)
    } else if (e.type === "dragleave") {
      setDragActivePaper(false)
    }
  }

  const handleDropPaper = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActivePaper(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPaperFile(e.dataTransfer.files[0])
    }
  }

  const handleDragAnalysis = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAnalysis(true)
    } else if (e.type === "dragleave") {
      setDragActiveAnalysis(false)
    }
  }

  const handleDropAnalysis = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAnalysis(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAnalysisFile(e.dataTransfer.files[0])
    }
  }

  const handlePaperUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paperFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('user_id', String(user.id))
    formData.append('subject', paperSubject || 'question_paper')
    formData.append('file', paperFile)

    try {
      const res = await fetch('/api/chat/upload-paper', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Paper processing failed.', 'error')
      } else {
        showToast(`Question paper indexed successfully! Chunk count: ${data.chunk_count}`, 'success')
        setPaperFile(null)
        setPaperSubject('')
      }
    } catch (e) {
      showToast('Connection failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handlePaperAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!analysisFile) return

    setAnalyzing(true)
    const formData = new FormData()
    formData.append('n_topics', String(nTopics))
    formData.append('file', analysisFile)

    try {
      const res = await fetch('/api/chat/analyze-paper', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.detail || 'Paper analysis failed.', 'error')
      } else {
        setAnalyzedTopics(data.topics || [])
        showToast('AI Topic extraction completed!', 'success')
      }
    } catch (e) {
      showToast('Analysis request failed.', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight">Paper Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Upload question papers to index them in the tutor, and run AI weightage analyses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingest Question Paper */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4 laser-border-container">
          <div className="laser-border-line"></div>
          <h3 className="font-header font-bold text-lg text-slate-200 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Ingest Question Paper
          </h3>
          <p className="text-xs text-slate-400">Index question papers into the vector store so the Chat Tutor can reference them during study sessions.</p>
          <form onSubmit={handlePaperUpload} className="flex flex-col gap-3">
            <input 
              type="text" 
              value={paperSubject}
              onChange={e => setPaperSubject(e.target.value)}
              placeholder="Paper Identifier (E.g. Computer Networks 2025)"
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-violetAccent text-slate-100 transition-colors"
            />
            
            {/* Drag and Drop zone for Ingest */}
            <div 
              onDragEnter={handleDragPaper}
              onDragOver={handleDragPaper}
              onDragLeave={handleDragPaper}
              onDrop={handleDropPaper}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 relative ${
                dragActivePaper 
                  ? 'border-tealAccent bg-tealAccent/5 scale-102' 
                  : paperFile 
                  ? 'border-violetAccent/50 bg-slate-900/30' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
              }`}
            >
              <input 
                type="file"
                id="paper-ingest-upload"
                onChange={e => e.target.files && setPaperFile(e.target.files[0])}
                className="hidden"
                accept=".pdf"
              />
              <label htmlFor="paper-ingest-upload" className="cursor-pointer flex flex-col items-center w-full">
                <svg className={`w-8 h-8 mb-2 transition-transform duration-300 ${dragActivePaper ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill="none" stroke={dragActivePaper ? '#4ECDC4' : '#6C63FF'} strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" className="animate-pulse" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[200px]">
                  {paperFile ? paperFile.name : dragActivePaper ? "Release to drop file" : "Drag PDF or click to browse"}
                </span>
                <span className="text-[9px] text-slate-500 mt-1">PDF up to 10MB</span>
              </label>
            </div>
            
            <button type="submit" disabled={uploading || !paperFile} className="glow-btn shimmer-button text-white py-3 rounded-xl text-xs font-bold font-header flex items-center justify-center gap-2 mt-2 disabled:opacity-40">
              {uploading ? 'Processing & Chunking...' : 'Index Paper'}
            </button>
          </form>
        </div>

        {/* AI Topic Analyzer */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col gap-4 laser-border-container">
          <div className="laser-border-line"></div>
          <h3 className="font-header font-bold text-lg text-slate-200 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            AI Topic Analyzer
          </h3>
          <p className="text-xs text-slate-400">Analyze syllabus or past question papers to extract topic frequency weightages using DeepSeek-R1 reasoning models.</p>
          <form onSubmit={handlePaperAnalysis} className="flex flex-col gap-3">
            {/* Drag and Drop zone for Analysis */}
            <div 
              onDragEnter={handleDragAnalysis}
              onDragOver={handleDragAnalysis}
              onDragLeave={handleDragAnalysis}
              onDrop={handleDropAnalysis}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 relative ${
                dragActiveAnalysis 
                  ? 'border-tealAccent bg-tealAccent/5 scale-102' 
                  : analysisFile 
                  ? 'border-tealAccent/50 bg-slate-900/30' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
              }`}
            >
              <input 
                type="file"
                id="paper-analysis-upload"
                onChange={e => e.target.files && setAnalysisFile(e.target.files[0])}
                className="hidden"
                accept=".pdf"
              />
              <label htmlFor="paper-analysis-upload" className="cursor-pointer flex flex-col items-center w-full">
                <svg className={`w-8 h-8 mb-2 transition-transform duration-300 ${dragActiveAnalysis ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill="none" stroke={dragActiveAnalysis ? '#4ECDC4' : '#6C63FF'} strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" className="animate-pulse" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[200px]">
                  {analysisFile ? analysisFile.name : dragActiveAnalysis ? "Release to drop file" : "Drag PDF or click to browse"}
                </span>
                <span className="text-[9px] text-slate-500 mt-1">PDF up to 10MB</span>
              </label>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                <span>Topics limit</span>
                <span>{nTopics}</span>
              </div>
              <input 
                type="range" min="5" max="20"
                value={nTopics} onChange={e => setNTopics(Number(e.target.value))}
                className="accent-violetAccent"
              />
            </div>
            <button type="submit" disabled={analyzing || !analysisFile} className="glow-btn shimmer-button text-white py-3 rounded-xl text-xs font-bold font-header flex items-center justify-center gap-2 mt-2 disabled:opacity-40">
              {analyzing ? 'Extracting Weightages...' : 'Extract Frequency Map'}
            </button>
          </form>
        </div>
      </div>

      {/* Analyzed topics list */}
      {analyzedTopics.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
          <h3 className="font-header font-bold text-lg text-slate-200 mb-4">📊 Syllabus Weightage Map</h3>
          <div className="flex flex-col gap-3">
            {analyzedTopics.map((t, idx) => {
              const colors = t.importance === 'high' ? '#4ECDC4' : t.importance === 'medium' ? '#FFB700' : '#9E9EC0'
              const borderLeftColors = t.importance === 'high' ? 'border-l-[#4ECDC4]' : t.importance === 'medium' ? 'border-l-[#FFB700]' : 'border-l-[#9E9EC0]'
              return (
                <div key={idx} className={`p-4 border-l-4 rounded bg-slate-900/40 border-slate-800/80 flex justify-between items-center ${borderLeftColors}`}>
                  <div>
                    <h4 className="font-header font-bold text-sm text-slate-200">{t.topic}</h4>
                    <p className="text-xs text-slate-400 mt-1">{t.explanation || t.justification}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-900 border border-slate-800" style={{ color: colors }}>
                    {t.importance}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


