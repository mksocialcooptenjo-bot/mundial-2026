import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, query, where, updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  LayoutDashboard, Home, User, Settings, Trophy, Shield, 
  LogOut, Plus, Edit2, Save, Trash2, ChevronRight, 
  Clock, CheckCircle, Play, Star, List, Menu, X, 
  RefreshCw, Globe, Search, Calendar, ChevronDown, Award,
  Target, Zap, Flame, Info, Check
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyB4flONy07VK8e2TBz9FsppAGoKZcV-J1A",
  authDomain: "mundial2026-5762b.firebaseapp.com",
  projectId: "mundial2026-5762b",
  storageBucket: "mundial2026-5762b.firebasestorage.app",
  messagingSenderId: "994271736000",
  appId: "1:994271736000:web:1c8b89d75b908376b53d25",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mundial-2026-pro';

// Constantes de Puntos solicitadas
const POINTS_SYSTEM = {
  EXACT_SCORE: 5,
  GOAL_SCORER: 3,
  CHAMPION: 20,
  FINALISTS: 10,
  SEMIFINALIST: 8,
  QUARTER_FINALIST: 6,
  ROUND_OF_16: 5,
  ROUND_OF_32: 4 // 16avos
};

const TEAM_FLAGS = {
  "USA": "us", "México": "mx", "Canadá": "ca", "Argentina": "ar", "Brasil": "br", 
  "España": "es", "Francia": "fr", "Alemania": "de", "Inglaterra": "gb-eng",
  "Portugal": "pt", "Uruguay": "uy", "Colombia": "co", "Italia": "it", "Marruecos": "ma",
  "Netherlands": "nl", "Belgium": "be", "Croatia": "hr", "Japan": "jp", "South Korea": "kr"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [specialPredictions, setSpecialPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
          const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info'));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            const defaultProfile = { 
              displayName: u.email?.split('@')[0], 
              email: u.email, 
              role: 'user', 
              points: 0,
              exactMatches: 0,
              history: []
            };
            await setDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info'), defaultProfile);
            setUserData(defaultProfile);
          }
        } else {
          setUser(null);
          setUserData(null);
          setCurrentPage('login');
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (snap) => {
      setMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPredictions = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'predictions'), (snap) => {
      setPredictions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSpecials = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'specials'), (doc) => {
      if (doc.exists()) setSpecialPredictions(doc.data());
    });

    return () => {
      unsubMatches();
      unsubUsers();
      unsubPredictions();
      unsubSpecials();
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentPage('home');
    } catch (err) {
      setAuthError('Acceso Denegado: Credenciales no válidas.');
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
      <p className="tracking-widest text-[10px] font-black uppercase opacity-40">Accediendo a la Arena...</p>
    </div>
  );

  const isAdmin = userData?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans">
      {user && currentPage !== 'login' && (
        <Navbar 
          setCurrentPage={setCurrentPage} 
          currentPage={currentPage} 
          handleLogout={() => signOut(auth)} 
          isAdmin={isAdmin}
          userData={userData}
        />
      )}

      <main className="flex-grow">
        {currentPage === 'login' && <LoginPage handleLogin={handleLogin} error={authError} />}
        {user && (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {currentPage === 'home' && <HomePage matches={matches} users={users} setCurrentPage={setCurrentPage} />}
            {currentPage === 'predictions' && <PredictionsPage matches={matches} predictions={predictions} user={user} />}
            {currentPage === 'champions' && <ChampionsPage user={user} specialPredictions={specialPredictions} />}
            {currentPage === 'rankings' && <RankingsPage users={users} user={user} />}
            {currentPage === 'profile' && <ProfilePage user={user} userData={userData} predictions={predictions} />}
          </div>
        )}
      </main>
    </div>
  );
}

function Navbar({ setCurrentPage, currentPage, handleLogout, isAdmin, userData }) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'predictions', label: 'Partidos', icon: Target },
    { id: 'champions', label: 'Especiales', icon: Award },
    { id: 'rankings', label: 'Ranking', icon: List },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="bg-[#0F172A] text-white sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-6 h-24 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentPage('home')}>
          <div className="bg-indigo-600 p-3 rounded-2xl">
            <Trophy size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter">MUNDIAL <span className="text-indigo-400">PRO</span></span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${currentPage === item.id ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
          <div className="ml-6 pl-6 border-l border-white/10 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-indigo-400 font-black uppercase">Puntos</p>
              <p className="text-xl font-black">{userData?.points || 0}</p>
            </div>
            <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LoginPage({ handleLogin, error }) {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative">
       <div className="absolute inset-0 z-0 opacity-30">
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000" className="w-full h-full object-cover" />
       </div>
       <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
             <Trophy size={60} className="text-indigo-500 mx-auto mb-6" />
             <h1 className="text-4xl font-black text-white tracking-tighter italic">MUNDIAL PRO 2026</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Inicia Sesión para Competir</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
             <input name="email" type="email" placeholder="Email Profesional" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-indigo-500" />
             <input name="password" type="password" placeholder="Contraseña" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-indigo-500" />
             {error && <p className="text-red-400 text-xs font-black uppercase text-center">{error}</p>}
             <button className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all">Entrar a la Arena</button>
          </form>
       </div>
    </div>
  );
}

function HomePage({ matches, users, setCurrentPage }) {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black tracking-tighter">Mi Arena</h1>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Temporada Mundialista 2026</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center min-w-[140px]">
              <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Tu Rango</p>
              <p className="text-3xl font-black">#--</p>
           </div>
           <div className="bg-[#0F172A] p-6 rounded-[2rem] shadow-xl text-white text-center min-w-[140px]">
              <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Mis Puntos</p>
              <p className="text-3xl font-black">0</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="text-center md:text-left">
                     <h3 className="text-4xl font-black mb-2 tracking-tighter">Próximo Desafío</h3>
                     <p className="text-slate-400 text-sm font-bold mb-6">No dejes pasar los puntos del próximo encuentro</p>
                     <button onClick={() => setCurrentPage('predictions')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">Lanzar Predicción</button>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="w-24 h-16 bg-slate-100 rounded-xl"></div>
                     <span className="text-4xl font-black text-slate-200 italic">VS</span>
                     <div className="w-24 h-16 bg-slate-100 rounded-xl"></div>
                  </div>
               </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center cursor-pointer hover:bg-indigo-700 transition-all" onClick={() => setCurrentPage('champions')}>
                  <div>
                    <h4 className="text-2xl font-black tracking-tighter">Bracket de Honor</h4>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">16avos a la Final</p>
                  </div>
                  <ChevronRight size={32} />
               </div>
               <div className="bg-amber-400 p-8 rounded-[2.5rem] text-white flex justify-between items-center cursor-pointer hover:bg-amber-500 transition-all" onClick={() => setCurrentPage('rankings')}>
                  <div>
                    <h4 className="text-2xl font-black tracking-tighter">Ranking Global</h4>
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">Top Jugadores</p>
                  </div>
                  <ChevronRight size={32} />
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Award className="text-indigo-600" /> Sistema de Puntos</h3>
            <div className="space-y-4">
               {[
                 { l: 'Marcador Exacto', v: '5 PTS' },
                 { l: 'Goleador (Acierto)', v: '3 PTS' },
                 { l: 'Campeón Mundial', v: '20 PTS' },
                 { l: 'Finalistas', v: '10 PTS' },
                 { l: 'Semifinalistas', v: '8 PTS' },
                 { l: 'Cuartos de Final', v: '6 PTS' },
                 { l: 'Octavos de Final', v: '5 PTS' },
                 { l: '16avos de Final', v: '4 PTS' },
               ].map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.l}</span>
                    <span className="font-black text-indigo-600">{item.v}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function PredictionsPage({ matches, predictions, user }) {
  const [editingId, setEditingId] = useState(null);
  const [scores, setScores] = useState({ home: '', away: '', scorer: '' });

  const savePrediction = async (matchId) => {
    const predRef = doc(db, 'artifacts', appId, 'public', 'data', 'predictions', `${user.uid}_${matchId}`);
    await setDoc(predRef, {
      userId: user.uid,
      matchId,
      homeScore: parseInt(scores.home) || 0,
      awayScore: parseInt(scores.away) || 0,
      scorer: scores.scorer,
      updatedAt: new Date().toISOString()
    });
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
       <div className="text-center">
          <h2 className="text-5xl font-black tracking-tighter">Predicciones de Partidos</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Gana 5 pts por marcador y 3 pts por goleador</p>
       </div>

       <div className="space-y-6">
          {matches.map(match => {
            const pred = predictions.find(p => p.matchId === match.id && p.userId === user.uid);
            return (
              <div key={match.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1 flex items-center justify-end gap-6">
                    <span className="font-black text-xl uppercase italic">{match.home}</span>
                    <div className="w-16 h-10 bg-slate-100 rounded-lg"></div>
                 </div>

                 <div className="flex flex-col items-center gap-4 min-w-[200px]">
                    {editingId === match.id ? (
                      <div className="space-y-4 w-full">
                         <div className="flex items-center justify-center gap-3">
                            <input type="number" value={scores.home} onChange={e => setScores({...scores, home: e.target.value})} className="w-14 h-14 text-center font-black text-2xl rounded-xl border-2 border-indigo-100" />
                            <span className="font-black text-slate-300">:</span>
                            <input type="number" value={scores.away} onChange={e => setScores({...scores, away: e.target.value})} className="w-14 h-14 text-center font-black text-2xl rounded-xl border-2 border-indigo-100" />
                         </div>
                         <input type="text" placeholder="Jugador que marca" value={scores.scorer} onChange={e => setScores({...scores, scorer: e.target.value})} className="w-full p-3 text-xs font-bold rounded-xl border-2 border-indigo-50 text-center" />
                         <button onClick={() => savePrediction(match.id)} className="w-full bg-green-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Confirmar</button>
                      </div>
                    ) : (
                      <div className="text-center">
                         <div className="flex items-center gap-4 mb-2">
                            <span className="text-4xl font-black text-indigo-600">{pred?.homeScore ?? '-'}</span>
                            <span className="text-4xl font-black text-slate-200">:</span>
                            <span className="text-4xl font-black text-indigo-600">{pred?.awayScore ?? '-'}</span>
                         </div>
                         <p className="text-[10px] font-black uppercase text-slate-400">Goleador: {pred?.scorer || '---'}</p>
                         <button onClick={() => { setEditingId(match.id); setScores({ home: pred?.homeScore || '', away: pred?.awayScore || '', scorer: pred?.scorer || '' }); }} className="mt-4 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:underline">Editar Predicción</button>
                      </div>
                    )}
                 </div>

                 <div className="flex-1 flex items-center justify-start gap-6">
                    <div className="w-16 h-10 bg-slate-100 rounded-lg"></div>
                    <span className="font-black text-xl uppercase italic">{match.away}</span>
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
}

function ChampionsPage({ user, specialPredictions }) {
  const [activeTab, setActiveTab] = useState('bracket');

  const saveSpecial = async (key, val) => {
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'specials');
    await setDoc(ref, { [key]: val }, { merge: true });
  };

  const BracketStage = ({ title, slots, stageKey, points }) => (
    <div className="flex flex-col gap-4">
       <div className="text-center mb-2">
          <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">{title}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">{points} PTS/ACIERTO</p>
       </div>
       {Array.from({ length: slots }).map((_, i) => {
         const key = `${stageKey}_${i}`;
         return (
           <input
             key={i}
             placeholder={`Selección...`}
             value={specialPredictions[key] || ''}
             onChange={(e) => saveSpecial(key, e.target.value)}
             className="bg-white border border-slate-100 p-3 rounded-xl text-xs font-black uppercase placeholder:opacity-20 shadow-sm focus:border-indigo-500 outline-none transition-all"
           />
         );
       })}
    </div>
  );

  return (
    <div className="space-y-12">
       <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-5xl font-black tracking-tighter">Predicciones del Torneo</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Completa el camino al título</p>
       </div>

       <div className="flex justify-center gap-4">
          <button onClick={() => setActiveTab('bracket')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bracket' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>Cuadro de Honor (Bracket)</button>
          <button onClick={() => setActiveTab('awards')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'awards' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>Premios Especiales</button>
       </div>

       {activeTab === 'bracket' ? (
         <div className="overflow-x-auto pb-10">
            <div className="flex gap-8 min-w-[1200px]">
               <BracketStage title="16AVOS" slots={16} stageKey="r32" points={POINTS_SYSTEM.ROUND_OF_32} />
               <BracketStage title="OCTAVOS" slots={8} stageKey="r16" points={POINTS_SYSTEM.ROUND_OF_16} />
               <BracketStage title="CUARTOS" slots={4} stageKey="qf" points={POINTS_SYSTEM.QUARTER_FINALIST} />
               <BracketStage title="SEMIS" slots={2} stageKey="sf" points={POINTS_SYSTEM.SEMIFINALIST} />
               <BracketStage title="FINAL" slots={2} stageKey="fn" points={POINTS_SYSTEM.FINALISTS} />
               <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-[4rem] border-4 border-dashed border-indigo-200 ml-8 min-w-[250px]">
                  <Trophy size={64} className="text-indigo-600 mb-6" />
                  <p className="text-[10px] font-black uppercase text-indigo-500 mb-4">CAMPEÓN 20 PTS</p>
                  <input 
                    placeholder="Elegir Campeón" 
                    value={specialPredictions.champion || ''}
                    onChange={(e) => saveSpecial('champion', e.target.value)}
                    className="w-full p-5 bg-white rounded-2xl text-center font-black text-xl border-none shadow-xl uppercase outline-none focus:ring-4 focus:ring-indigo-200"
                  />
               </div>
            </div>
         </div>
       ) : (
         <div className="grid md:grid-cols-3 gap-8">
            {[
              { id: 'golden_boot', title: 'Bota de Oro', icon: Star, color: 'amber' },
              { id: 'golden_glove', title: 'Guante de Oro', icon: Shield, color: 'indigo' },
              { id: 'best_player', title: 'Mejor Jugador', icon: Award, color: 'emerald' },
            ].map((award) => (
              <div key={award.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl text-center group">
                 <award.icon size={48} className={`mx-auto mb-8 text-${award.color}-500 group-hover:scale-110 transition-all`} />
                 <h3 className="text-2xl font-black mb-2 tracking-tighter">{award.title}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-8">Predice el ganador (3 pts)</p>
                 <input 
                   placeholder="Nombre del Jugador" 
                   value={specialPredictions[award.id] || ''}
                   onChange={(e) => saveSpecial(award.id, e.target.value)}
                   className="w-full p-4 bg-slate-50 rounded-2xl text-center font-black uppercase border border-slate-100"
                 />
              </div>
            ))}
         </div>
       )}
    </div>
  );
}

function RankingsPage({ users, user }) {
  const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  return (
    <div className="space-y-10">
       <div className="bg-[#0F172A] p-16 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
             <h1 className="text-7xl font-black italic tracking-tighter">RANKING</h1>
             <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">Los mejores de la Arena Mundialista</p>
          </div>
          <div className="bg-white/10 p-10 rounded-[3rem] text-center min-w-[240px] relative z-10 border border-white/5">
             <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Tu Puesto</p>
             <p className="text-6xl font-black">#{sorted.findIndex(u => u.id === user.uid) + 1 || '--'}</p>
          </div>
       </div>

       <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-50">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-slate-50 border-b">
                   <th className="p-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rango</th>
                   <th className="p-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Jugador</th>
                   <th className="p-10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Puntos</th>
                </tr>
             </thead>
             <tbody>
                {sorted.map((u, idx) => (
                  <tr key={u.id} className={`${u.id === user.uid ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'} transition-all`}>
                     <td className="p-10">
                        <span className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl ${idx < 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
                     </td>
                     <td className="p-10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{(u.displayName || u.email)[0].toUpperCase()}</div>
                           <p className="font-black text-xl italic">{u.displayName || u.email}</p>
                        </div>
                     </td>
                     <td className="p-10 text-right">
                        <p className="text-3xl font-black tracking-tighter">{u.points || 0}</p>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function ProfilePage({ user, userData, predictions }) {
  const userPreds = predictions.filter(p => p.userId === user.uid);
  
  return (
    <div className="max-w-4xl mx-auto space-y-12">
       <div className="bg-white p-12 lg:p-20 rounded-[5rem] shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-40 bg-indigo-600"></div>
          <div className="relative z-10">
             <div className="w-40 h-40 bg-white p-3 rounded-[3rem] shadow-2xl mx-auto mb-8">
                <div className="w-full h-full bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center text-6xl font-black italic shadow-inner">
                   {(userData?.displayName || user.email)[0].toUpperCase()}
                </div>
             </div>
             <h2 className="text-5xl font-black tracking-tighter italic">{userData?.displayName || 'Usuario'}</h2>
             <p className="text-indigo-500 font-black uppercase text-xs tracking-[0.3em] mt-2 mb-12">{user.email}</p>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { l: 'Puntos Totales', v: userData?.points || 0 },
                  { l: 'Partidos Jugados', v: userPreds.length },
                  { l: 'Aciertos Exactos', v: userData?.exactMatches || 0 },
                  { l: 'Rango Global', v: '#--' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-3xl font-black tracking-tighter text-indigo-600">{stat.v}</p>
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2">{stat.l}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>

       <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock className="text-indigo-600" /> Historial de Actividad</h3>
          <div className="space-y-4">
             {userData?.history?.length > 0 ? (
               userData.history.map((h, i) => (
                 <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-black text-sm uppercase italic">{h.description}</p>
                    <span className="text-green-500 font-black">+{h.points} PTS</span>
                 </div>
               ))
             ) : (
               <div className="text-center py-10">
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Aún no hay puntos registrados</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );
}