import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Gamepad2, Users, Volume2, VolumeX, Sparkles, Plus, Check, X, 
  Play, RefreshCw, Copy, Share2, HelpCircle, Shield, Award, Crown,
  UserCheck, Flame, MessageSquare, FastForward, ArrowRight, Settings,
  RotateCcw, Search, ExternalLink, Heart, Smile, CheckCircle2, XCircle
} from 'lucide-react';

// ==========================================
// SOUND ENGINE (Web Audio API Synthesizer)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, gainVal = 0.1) {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error(e);
    }
  }

  click() {
    this.playTone(600, 'sine', 0.05, 0.15);
  }

  stopWheel() {
    this.playTone(800, 'square', 0.15, 0.2);
    setTimeout(() => this.playTone(1200, 'triangle', 0.2, 0.25), 100);
  }

  tick() {
    this.playTone(400, 'sine', 0.03, 0.05);
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.1, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.15), 80); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.2), 160); // G5
  }

  wrong() {
    this.playTone(200, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.25, 0.2), 120);
  }

  win() {
    const notes = [400, 500, 600, 800, 1000];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.15, 0.2), idx * 90);
    });
  }
}

const sounds = new SoundEngine();

// ==========================================
// GEORGIAN ALPHABET & DATA LIBRARIES
// ==========================================
const GEO_ALPHABET = [
  'ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ', 'ი', 'კ', 
  'ლ', 'მ', 'ნ', 'ო', 'პ', 'ჟ', 'რ', 'ს', 'ტ', 'უ', 
  'ფ', 'ქ', 'ღ', 'ყ', 'შ', 'ჩ', 'ც', 'ძ', 'წ', 'ჭ', 'ხ', 'ჯ', 'ჰ'
];

const CATEGORY_GROUPS = [
  {
    name: 'ძირითადი კატეგორიები',
    items: ['სახელი', 'გვარი', 'ქალაქი', 'ქვეყანა', 'სოფელი', 'მდინარე', 'ტბა', 'მთა', 'დედაქალაქი']
  },
  {
    name: 'ცოცხალი სამყარო',
    items: ['ცხოველი', 'ფრინველი', 'თევზი', 'მწერი', 'მცენარე', 'ყვავილი', 'ხილი', 'ბოსტნეული']
  },
  {
    name: 'საკვები და სასმელი',
    items: ['კერძი', 'ქართული კერძი', 'დესერტი', 'ტკბილეული', 'სასმელი', 'რძის პროდუქტი']
  },
  {
    name: 'ადამიანები და პროფესიები',
    items: ['პროფესია', 'ცნობილი ადამიანი', 'მსახიობი', 'მომღერალი', 'სპორტსმენი', 'მწერალი']
  },
  {
    name: 'ნივთები და ყოველდღიურობა',
    items: ['ნივთი', 'ავეჯი', 'ტანსაცმელი', 'ტექნიკა', 'სათამაშო', 'მუსიკალური ინსტრუმენტი', 'ტრანსპორტი']
  },
  {
    name: 'კულტურა და გართობა',
    items: ['ფილმი', 'სერიალი', 'მულტფილმი', 'წიგნი', 'სიმღერა', 'კომპიუტერული თამაში']
  }
];

const AVATARS = ['👾', '🕹️', '👑', '🚀', '🐱', '🦊', '🐼', '🦁', '🤖', '👻', '🦄', '🐲'];
const REACTION_EMOJIS = ['😂', '🔥', '👏', '😎', '🤯', '❤️', '👍', '🎉'];

// Sample HANGMAN preset words for random game pick or reference
const HANGMAN_SAMPLE_WORDS = [
  'პინგვინი', 'კომპიუტერი', 'საქართველო', 'მზესუმზირა', 'ველოსიპედი', 
  'ტელევიზორი', 'ლიმონათი', 'ჩანჩქერი', 'აკვაპარკი', 'კოსმონავტი'
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'city', 'hangman', 'leaderboard', 'rules', 'profile'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // User Profile State
  const [user, setUser] = useState({
    id: 'user_' + Math.floor(Math.random() * 10000),
    name: 'გიორგი_90s',
    avatar: '👾',
    color: '#FF007F',
    isRegistered: false,
    score: 1250,
    wins: 14,
    gamesPlayed: 28,
    achievements: ['პირველი გამარჯვება', '5 გამარჯვება', 'ქალაქობანას ოსტატი']
  });

  // Multiplayer Room State
  const [currentRoom, setCurrentRoom] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Audio mute handler sync
  const toggleSound = () => {
    sounds.muted = soundEnabled; // sync with engine
    setSoundEnabled(!soundEnabled);
  };

  // Trigger floating reaction
  const sendReaction = (emoji) => {
    sounds.click();
    const id = Date.now() + Math.random();
    const newReaction = {
      id,
      emoji,
      left: Math.random() * 70 + 15,
      bottom: 20
    };
    setFloatingReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  // Helper to create a room
  const handleCreateRoom = (gameType, roomSettings) => {
    sounds.click();
    const code = '90S-' + Math.floor(1000 + Math.random() * 9000);
    const newRoom = {
      code,
      gameType, // 'city' or 'hangman'
      hostId: user.id,
      players: [
        { id: user.id, name: user.name, avatar: user.avatar, isReady: true, score: 0 },
        { id: 'bot_1', name: 'ნიკა_Arcade', avatar: '🚀', isReady: true, score: 0 },
        { id: 'bot_2', name: 'ანი_Retro', avatar: '🐱', isReady: true, score: 0 }
      ],
      settings: roomSettings,
      status: 'lobby' // 'lobby', 'playing', 'evaluating', 'finished'
    };
    setCurrentRoom(newRoom);
    setActiveTab(gameType);
    setCreateRoomOpen(false);
  };

  // Join Room by Code
  const handleJoinRoom = (code) => {
    sounds.click();
    if (!code) return;
    const newRoom = {
      code: code.toUpperCase(),
      gameType: 'city',
      hostId: 'host_99',
      players: [
        { id: 'host_99', name: 'სალომე_Retro', avatar: '👑', isReady: true, score: 0 },
        { id: user.id, name: user.name, avatar: user.avatar, isReady: true, score: 0 },
      ],
      settings: {
        categories: ['სახელი', 'გვარი', 'ქალაქი', 'ცხოველი', 'მცენარე'],
        timerSeconds: 60,
        rounds: 3,
        direction: 'clockwise'
      },
      status: 'lobby'
    };
    setCurrentRoom(newRoom);
    setActiveTab('city');
    setJoinRoomModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden flex flex-col">
      {/* 90s Retro Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[radial-gradient(#ff007f_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* FLOATING EMOJI REACTIONS OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map(r => (
          <div 
            key={r.id} 
            className="absolute text-4xl animate-bounce transition-all duration-1000 ease-out"
            style={{ left: `${r.left}%`, bottom: `${r.bottom}%`, opacity: 0.9 }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-pink-500/30 px-4 py-3 shadow-lg shadow-purple-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => { sounds.click(); setActiveTab('home'); }}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 transform group-hover:rotate-6 transition-transform shadow-lg shadow-pink-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400 drop-shadow-[0_2px_4px_rgba(255,0,127,0.5)]">
                90s GAME CLUB
              </span>
              <span className="block text-[10px] font-bold text-pink-400 tracking-widest uppercase">
                ქალაქობანა & ჩამოხრჩობანა
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <NavBtn active={activeTab === 'home'} onClick={() => { sounds.click(); setActiveTab('home'); }}>
              🏠 მთავარი
            </NavBtn>
            <NavBtn active={activeTab === 'city'} onClick={() => { sounds.click(); setActiveTab('city'); }}>
              🏙️ ქალაქობანა
            </NavBtn>
            <NavBtn active={activeTab === 'hangman'} onClick={() => { sounds.click(); setActiveTab('hangman'); }}>
              🪢 ჩამოხრჩობანა
            </NavBtn>
            <NavBtn active={activeTab === 'leaderboard'} onClick={() => { sounds.click(); setActiveTab('leaderboard'); }}>
              🏆 რეიტინგები
            </NavBtn>
            <NavBtn active={activeTab === 'rules'} onClick={() => { sounds.click(); setActiveTab('rules'); }}>
              📖 წესები
            </NavBtn>
          </nav>

          {/* User Controls & Sound */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSound}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-yellow-400 border border-slate-700 transition-transform active:scale-95 shadow-md"
              title="ხმის ჩართვა/გამორთვა"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            <button 
              onClick={() => { sounds.click(); setActiveTab('profile'); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 border border-pink-500/40 shadow-inner transition-transform active:scale-95"
            >
              <span className="text-2xl">{user.avatar}</span>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-pink-300 truncate max-w-[100px]">{user.name}</div>
                <div className="text-[10px] text-yellow-400 font-mono">⭐ {user.score} ქ</div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 z-10 flex flex-col">
        {activeTab === 'home' && (
          <HomeView 
            setActiveTab={setActiveTab}
            setCreateRoomOpen={setCreateRoomOpen}
            setJoinRoomModalOpen={setJoinRoomModalOpen}
            user={user}
          />
        )}

        {activeTab === 'city' && (
          <CityGameModule 
            room={currentRoom} 
            setRoom={setCurrentRoom}
            user={user}
            setCreateRoomOpen={setCreateRoomOpen}
            sendReaction={sendReaction}
          />
        )}

        {activeTab === 'hangman' && (
          <HangmanGameModule 
            room={currentRoom}
            setRoom={setCurrentRoom}
            user={user}
            setCreateRoomOpen={setCreateRoomOpen}
            sendReaction={sendReaction}
          />
        )}

        {activeTab === 'leaderboard' && <LeaderboardView />}
        {activeTab === 'rules' && <RulesView />}
        {activeTab === 'profile' && <ProfileCabinetView user={user} setUser={setUser} />}
      </main>

      {/* QUICK EMOJI BAR (AVAILABLE IN ACTIVE ROOMS) */}
      {currentRoom && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border-2 border-pink-500/60 rounded-full px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce-short">
          <span className="text-xs font-bold text-pink-400 mr-1 hidden sm:inline">რეაქცია:</span>
          {REACTION_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => sendReaction(emoji)}
              className="text-2xl hover:scale-130 transition-transform active:scale-90 p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/90 py-6 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-400">90s GAME CLUB</span> — ქართული რეტრო ონლაინ თამაშების სივრცე
          </div>
          <div>© 2026 ყველა უფლება დაცულია. დამზადებულია სიყვარულით ❤️</div>
        </div>
      </footer>

      {/* CREATE ROOM MODAL */}
      {createRoomOpen && (
        <CreateRoomModal 
          onClose={() => setCreateRoomOpen(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {/* JOIN ROOM MODAL */}
      {joinRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setJoinRoomModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-black text-pink-400 mb-2 flex items-center gap-2">
              <Users className="w-6 h-6" /> ოთახში შესვლა კოდით
            </h3>
            <p className="text-xs text-slate-400 mb-4">შეიყვანე მეგობრის მიერ გაზიარებული უნიკალური ოთახის კოდი:</p>
            
            <input 
              type="text" 
              placeholder="მაგ: 90S-4821" 
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-yellow-300 uppercase focus:border-pink-500 outline-none mb-4"
            />

            <button 
              onClick={() => handleJoinRoom(roomCodeInput)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-500/30 transition-all active:scale-95"
            >
              შესვლა & თამაში
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Nav Button Component
function NavBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
        active 
          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-105' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
      }`}
    >
      {children}
    </button>
  );
}

// ==========================================
// HOME VIEW COMPONENT
// ==========================================
function HomeView({ setActiveTab, setCreateRoomOpen, setJoinRoomModalOpen, user }) {
  return (
    <div className="space-y-10 py-4">
      
      {/* HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 border-2 border-pink-500/40 p-8 md:p-12 shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold animate-pulse">
            <Sparkles className="w-4 h-4" /> 1990-იანების არკადული რეტრო კლუბი
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            გაიხსენე ბავშვობა. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400">
              გამოიწვიე მეგობრები!
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            შეკრიბე მეგობრები, შექმენი ოთახი, გააზიარე კოდი და ითამაშე ქართული ლეგენდარული თამაშები 3D რეტრო ატმოსფეროში!
          </p>

          <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
            <button 
              onClick={() => { sounds.click(); setCreateRoomOpen(true); }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> ოთახის შექმნა
            </button>
            <button 
              onClick={() => { sounds.click(); setJoinRoomModalOpen(true); }}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-pink-500 text-slate-200 font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5 text-cyan-400" /> კოდით შემოსვლა
            </button>
          </div>
        </div>

        {/* 3D Decorative Graphics Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="w-48 h-48 bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 rounded-3xl p-1 rotate-6 hover:rotate-0 transition-all duration-500 shadow-2xl shadow-pink-500/40 cursor-pointer">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center p-4 text-center space-y-2">
              <span className="text-6xl animate-bounce">🕹️</span>
              <span className="text-xs font-black text-yellow-300 uppercase tracking-wider">GAME CLUB 90S</span>
              <span className="text-[10px] text-pink-400 font-mono">ONLINE MULTIPLAYER</span>
            </div>
          </div>
        </div>
      </div>

      {/* GAME CARDS CATALOG SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-pink-400" /> აირჩიე თამაში
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* GAME 1 CARD: ქალაქობანა */}
          <div className="group bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-purple-500/30 hover:border-pink-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-pink-500/20 transition-all"></div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🏙️</span>
                <span className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  2-8 მოთამაშე
                </span>
              </div>
              <h3 className="text-2xl font-black text-pink-400 group-hover:text-pink-300 transition-colors mb-2">
                ქალაქობანა (Categories)
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                აირჩიე კატეგორიები, დაატრიალე ანბანის ბორბალი, გააჩერე ასო და შეავსე ცხრილი მეგობრებზე სწრაფად!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
              <button 
                onClick={() => { sounds.click(); setCreateRoomOpen(true); }}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md shadow-pink-500/20 transition-all active:scale-95"
              >
                ითამაშე ახლა
              </button>
            </div>
          </div>

          {/* GAME 2 CARD: ჩამოხრჩობანა */}
          <div className="group bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🪢</span>
                <span className="px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  1v1 ან ჯგუფი
                </span>
              </div>
              <h3 className="text-2xl font-black text-cyan-400 group-hover:text-cyan-300 transition-colors mb-2">
                ჩამოხრჩობანა (Hangman)
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                ჩაიფიქრე სიტყვა ან გამოიცანი მეგობრის მიერ დამალული სიტყვა, სანამ რეტრო ნახატი დასრულდება!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
              <button 
                onClick={() => { sounds.click(); setCreateRoomOpen(true); }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-cyan-500/20 transition-all active:scale-95"
              >
                ითამაშე ახლა
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK STATS & ONLINE COMMUNITY HUB */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox title="აქტიური ოთახები" value="12" icon="🎮" color="text-pink-400" />
        <StatBox title="ონლაინ მოთამაშეები" value="48" icon="⚡" color="text-yellow-400" />
        <StatBox title="ჩემი ქულები" value={user.score.toString()} icon="⭐" color="text-cyan-400" />
        <StatBox title="მოგებები" value={`${user.wins} / ${user.gamesPlayed}`} icon="🏆" color="text-emerald-400" />
      </div>
    </div>
  );
}

function StatBox({ title, value, icon, color }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-md">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{title}</div>
        <div className={`text-lg font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}

// ==========================================
// CITY GAME (ქალაქობანა) MODULE
// ==========================================
function CityGameModule({ room, setRoom, user, setCreateRoomOpen, sendReaction }) {
  // Game Setup & Options
  const [categories, setCategories] = useState([
    'სახელი', 'გვარი', 'ქალაქი', 'ქვეყანა', 'ცხოველი', 'მცენარე'
  ]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [wheelIndex, setWheelIndex] = useState(0);

  // Round Mechanics State
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'spinning', 'writing', 'evaluating', 'round_summary'
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState({});
  const [roundScores, setRoundScores] = useState({});
  const [evaluationVotes, setEvaluationVotes] = useState({});

  const timerRef = useRef(null);

  // Wheel Cycling Effect
  useEffect(() => {
    let interval = null;
    if (isWheelSpinning) {
      interval = setInterval(() => {
        setWheelIndex(prev => (prev + 1) % GEO_ALPHABET.length);
        sounds.tick();
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isWheelSpinning]);

  // Timer Tick Effect
  useEffect(() => {
    if (gameState === 'writing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          if (prev <= 10) sounds.tick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  // Start Letter Selection (Classic Stop)
  const startWheelSpin = () => {
    sounds.click();
    setIsWheelSpinning(true);
    setGameState('spinning');
  };

  // Stop Wheel & Pick Letter
  const stopWheelSpin = () => {
    sounds.stopWheel();
    setIsWheelSpinning(false);
    const chosen = GEO_ALPHABET[wheelIndex];
    setSelectedLetter(chosen);
    
    // Initialize empty answers
    const initAns = {};
    categories.forEach(cat => initAns[cat] = '');
    setAnswers(initAns);

    setTimeLeft(room?.settings?.timerSeconds || 60);
    setGameState('writing');
  };

  // Time expired -> Submit answers to Evaluation
  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    sounds.click();
    setGameState('evaluating');
    
    // Default mock evaluation (All words filled starting with letter get green by default)
    const votes = {};
    categories.forEach(cat => {
      const val = (answers[cat] || '').trim();
      const isCorrect = val.length > 0 && val.toLowerCase().startsWith(selectedLetter.toLowerCase());
      votes[cat] = isCorrect ? 'green' : 'red';
    });
    setEvaluationVotes(votes);
  };

  // Vote toggle for Evaluation
  const toggleVote = (cat, vote) => {
    sounds.click();
    setEvaluationVotes(prev => ({ ...prev, [cat]: vote }));
  };

  // Calculate Round Score
  const calculateFinalScores = () => {
    sounds.win();
    let score = 0;
    categories.forEach(cat => {
      if (evaluationVotes[cat] === 'green') {
        score += 10; // 10 points for valid answer
      }
    });
    setRoundScores({ [user.id]: score, 'bot_1': Math.floor(Math.random() * 4) * 10 });
    setGameState('round_summary');
  };

  // If no active room exists, present Lobby Creator Trigger
  if (!room) {
    return (
      <div className="bg-slate-900 border-2 border-pink-500/40 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 space-y-6">
        <span className="text-6xl">🏙️</span>
        <h2 className="text-3xl font-black text-pink-400">ქალაქობანა (Categories)</h2>
        <p className="text-slate-300 text-sm">
          ითამაშე მეგობრებთან ონლაინ! აირჩიე კატეგორიები, დაატრიალე ანბანის ბორბალი და დააგროვე მაქსიმალური ქულები!
        </p>
        <button 
          onClick={() => setCreateRoomOpen(true)}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black shadow-lg shadow-pink-500/30 transition-all hover:scale-105"
        >
          შექმენი ოთახი და ითამაშე
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ROOM HEADER INFO BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏙️</span>
          <div>
            <div className="text-xs font-bold text-pink-400">ოთახის კოდი:</div>
            <div className="text-lg font-mono font-black text-yellow-300 flex items-center gap-2">
              {room.code}
              <button 
                onClick={() => { sounds.click(); navigator.clipboard.writeText(room.code); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Player Avatars List */}
        <div className="flex items-center gap-2">
          {room.players.map(p => (
            <div key={p.id} className="relative group" title={p.name}>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-pink-500/40 flex items-center justify-center text-xl shadow-md">
                {p.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900"></div>
            </div>
          ))}
        </div>
      </div>

      {/* GAMEPLAY STAGE RENDERER */}

      {/* STAGE 1: SPINNING WHEEL / STOP MECHANIC */}
      {(gameState === 'lobby' || gameState === 'spinning') && (
        <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-8 text-center space-y-8 shadow-2xl relative">
          <h2 className="text-2xl font-black text-white">
            ასოს არჩევის ავთენტური „სტოპ“ მექანიკა
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            დააჭირეთ „დატრიალებას“, რის შემდეგაც ინდიკატორი დაიწყებს ანბანის გაბრაზებულ გადარჩევას. „სტოპზე“ დაჭერით აირჩევა რაუნდის ასო!
          </p>

          {/* Wheel Selector Visual */}
          <div className="relative max-w-2xl mx-auto py-8">
            <div className="text-8xl font-black text-yellow-300 drop-shadow-[0_4px_12px_rgba(255,215,0,0.6)] animate-pulse">
              {GEO_ALPHABET[wheelIndex]}
            </div>

            {/* Carousel strip */}
            <div className="flex justify-center gap-2 mt-6 overflow-hidden py-2 px-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              {GEO_ALPHABET.slice(Math.max(0, wheelIndex - 4), wheelIndex + 5).map((char, i) => (
                <span 
                  key={i} 
                  className={`text-xl font-bold px-3 py-1 rounded-lg ${
                    char === GEO_ALPHABET[wheelIndex] 
                      ? 'bg-pink-500 text-white scale-125 shadow-md shadow-pink-500/50' 
                      : 'text-slate-500'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isWheelSpinning ? (
              <button 
                onClick={startWheelSpin}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-lg shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <Play className="w-5 h-5" /> დატრიალება
              </button>
            ) : (
              <button 
                onClick={stopWheelSpin}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black text-xl shadow-xl shadow-red-500/40 animate-bounce active:scale-95"
              >
                🛑 სტოპ!
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: WRITING ANSWERS */}
      {gameState === 'writing' && (
        <div className="bg-slate-900 border-2 border-pink-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
          
          {/* Active Round Info Bar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-pink-500/20 border border-pink-500/50 rounded-xl">
                <span className="text-xs text-pink-300 font-bold block">არჩეული ასო</span>
                <span className="text-3xl font-black text-yellow-300">{selectedLetter}</span>
              </div>
              <div>
                <h3 className="font-bold text-white">შეავსეთ პასუხების ცხრილი</h3>
                <p className="text-xs text-slate-400">ყველა სიტყვა უნდა იწყებოდეს ასოზე „{selectedLetter}“</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className={`text-center px-6 py-2 rounded-2xl border-2 font-mono font-black text-2xl ${
              timeLeft <= 10 ? 'border-red-500 text-red-400 animate-ping-short bg-red-950/40' : 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
            }`}>
              ⏱️ {timeLeft} წმ
            </div>
          </div>

          {/* Response Form Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <label className="text-xs font-bold text-pink-400 block">{cat}:</label>
                <input 
                  type="text"
                  placeholder={`სიტყვა ასოზე ${selectedLetter}...`}
                  value={answers[cat] || ''}
                  onChange={(e) => setAnswers({ ...answers, [cat]: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-pink-500 outline-none text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleTimeUp}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              დასრულება & გაგზავნა
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: EVALUATION SCREEN (GREEN / RED VOTING) */}
      {gameState === 'evaluating' && (
        <div className="bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl">⚖️</span>
            <h2 className="text-2xl font-black text-yellow-300">პასუხების შეფასების ეტაპი</h2>
            <p className="text-xs text-slate-400">
              შეაფასეთ თქვენი პასუხები. მწვანე ნიშნავს სწორს (+10 ქულა), წითელი — არასწორს (0 ქულა).
            </p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {categories.map((cat, idx) => {
              const val = answers[cat] || '';
              const currentVote = evaluationVotes[cat];

              return (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-400">{cat}</div>
                    <div className="text-lg font-bold text-white">{val || <span className="text-slate-600 italic">ცარიელია</span>}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleVote(cat, 'green')}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                        currentVote === 'green'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> სწორი (+10)
                    </button>
                    <button 
                      onClick={() => toggleVote(cat, 'red')}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                        currentVote === 'red'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-105'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> არასწორი (0)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={calculateFinalScores}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-slate-950 font-black text-base shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
            >
              შედეგების დათვლა
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: ROUND SUMMARY */}
      {gameState === 'round_summary' && (
        <div className="bg-slate-900 border-2 border-pink-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-black text-pink-400">რაუნდი დასრულდა!</h2>
          
          <div className="max-w-md mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold border-b border-slate-800 pb-2">
              <span className="text-slate-400">მოთამაშე</span>
              <span className="text-slate-400">მიღებული ქულა</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{user.avatar}</span>
                <span className="font-bold text-white">{user.name}</span>
              </div>
              <span className="font-mono font-black text-yellow-300 text-lg">+{roundScores[user.id] || 0} ქ</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span className="font-bold text-white">ნიკა_Arcade</span>
              </div>
              <span className="font-mono font-black text-yellow-300 text-lg">+{roundScores['bot_1'] || 0} ქ</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => { sounds.click(); setGameState('spinning'); }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-pink-500/30 transition-all active:scale-95"
            >
              შემდეგი რაუნდი
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// HANGMAN GAME (ჩამოხრჩობანა) MODULE
// ==========================================
function HangmanGameModule({ room, setRoom, user, setCreateRoomOpen, sendReaction }) {
  const [word, setWord] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuessesCount, setWrongGuessesCount] = useState(0);
  const [gameState, setGameState] = useState('setting_word'); // 'setting_word', 'guessing', 'won', 'lost'

  const MAX_ATTEMPTS = 9;

  // Set word by author/host
  const handleSetWord = (e) => {
    e.preventDefault();
    if (!inputWord.trim()) return;
    sounds.click();
    setWord(inputWord.trim().toLowerCase());
    setGuessedLetters([]);
    setWrongGuessesCount(0);
    setGameState('guessing');
  };

  // Guess letter action
  const handleGuessLetter = (letter) => {
    if (guessedLetters.includes(letter) || gameState !== 'guessing') return;

    sounds.click();
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      sounds.wrong();
      const newWrong = wrongGuessesCount + 1;
      setWrongGuessesCount(newWrong);

      if (newWrong >= MAX_ATTEMPTS) {
        setGameState('lost');
      }
    } else {
      sounds.correct();
      // Check if all letters guessed
      const isComplete = word.split('').every(l => newGuessed.includes(l));
      if (isComplete) {
        sounds.win();
        setGameState('won');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* WORD SETTING SCREEN */}
      {gameState === 'setting_word' && (
        <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl space-y-6 text-center">
          <span className="text-6xl">🪢</span>
          <h2 className="text-2xl font-black text-cyan-400">ჩამოხრჩობანა — სიტყვის ჩაფიქრება</h2>
          <p className="text-xs text-slate-400">
            შეიყვანეთ ქართული არსებითი სახელი. სიტყვა დამალული იქნება მეტოქისთვის!
          </p>

          <form onSubmit={handleSetWord} className="space-y-4">
            <input 
              type="text" 
              placeholder="მაგ: პინგვინი"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-bold text-yellow-300 focus:border-cyan-400 outline-none"
            />
            
            <div className="flex gap-2 justify-center">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                სიტყვის ჩაფიქრება & დაწყება
              </button>
            </div>
          </form>

          {/* Quick Preset Choice */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500 block mb-2">ან აირჩიე შემთხვევითი სიტყვა:</span>
            <button 
              onClick={() => {
                const randomWord = HANGMAN_SAMPLE_WORDS[Math.floor(Math.random() * HANGMAN_SAMPLE_WORDS.length)];
                setInputWord(randomWord);
              }}
              className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-900/60 transition-colors"
            >
              🎲 შემთხვევითი სიტყვა
            </button>
          </div>
        </div>
      )}

      {/* GUESSING SCREEN */}
      {(gameState === 'guessing' || gameState === 'won' || gameState === 'lost') && (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* HANGMAN STAGE DRAWING (SVG Canvas) */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-4 left-4">
              მცდელობა: <span className="text-pink-400 font-black">{wrongGuessesCount} / {MAX_ATTEMPTS}</span>
            </h3>

            {/* SVG Retro Drawing */}
            <svg className="w-64 h-64 text-pink-400" viewBox="0 0 200 200">
              {/* Gallows Base */}
              {wrongGuessesCount >= 1 && <path d="M20 180 L180 180" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
              {wrongGuessesCount >= 2 && <path d="M50 180 L50 20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
              {wrongGuessesCount >= 3 && <path d="M50 20 L130 20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />}
              {wrongGuessesCount >= 4 && <path d="M130 20 L130 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
              
              {/* Figure Stage Parts */}
              {wrongGuessesCount >= 5 && <circle cx="130" cy="65" r="15" stroke="currentColor" strokeWidth="4" fill="none" />}
              {wrongGuessesCount >= 6 && <path d="M130 80 L130 130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
              {wrongGuessesCount >= 7 && <path d="M130 95 L110 115" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
              {wrongGuessesCount >= 8 && <path d="M130 95 L150 115" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
              {wrongGuessesCount >= 9 && <path d="M130 130 L110 160" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
              {wrongGuessesCount >= 9 && <path d="M130 130 L150 160" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
            </svg>

            {/* Game Result Modals */}
            {gameState === 'won' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
                <span className="text-6xl animate-bounce">🎉</span>
                <h3 className="text-3xl font-black text-emerald-400">გამარჯვება!</h3>
                <p className="text-sm text-slate-300">შენ წარმატებით გამოიცანი სიტყვა!</p>
                <button 
                  onClick={() => setGameState('setting_word')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg"
                >
                  ახალი თამაში
                </button>
              </div>
            )}

            {gameState === 'lost' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
                <span className="text-6xl">💀</span>
                <h3 className="text-3xl font-black text-red-500">წაგება!</h3>
                <p className="text-sm text-slate-300">
                  ჩაფიქრებული სიტყვა იყო: <span className="font-bold text-yellow-300 uppercase">{word}</span>
                </p>
                <button 
                  onClick={() => setGameState('setting_word')}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg"
                >
                  თავიდან სცადე
                </button>
              </div>
            )}
          </div>

          {/* HIDDEN WORD DASHES & GEORGIAN KEYBOARD */}
          <div className="space-y-8 bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
            
            {/* Hidden Word Display */}
            <div className="flex flex-wrap justify-center gap-2 py-4">
              {word.split('').map((char, idx) => (
                <div 
                  key={idx}
                  className="w-10 h-12 border-b-4 border-cyan-400 flex items-center justify-center text-2xl font-black text-yellow-300 uppercase"
                >
                  {guessedLetters.includes(char) ? char : '_'}
                </div>
              ))}
            </div>

            {/* Georgian On-Screen Keyboard */}
            <div className="grid grid-cols-7 gap-1.5 max-w-md mx-auto">
              {GEO_ALPHABET.map((char) => {
                const isGuessed = guessedLetters.includes(char);
                const isCorrect = isGuessed && word.includes(char);
                const isWrong = isGuessed && !word.includes(char);

                return (
                  <button
                    key={char}
                    disabled={isGuessed || gameState !== 'guessing'}
                    onClick={() => handleGuessLetter(char)}
                    className={`h-11 rounded-xl text-base font-bold transition-all active:scale-95 ${
                      isCorrect 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                        : isWrong 
                        ? 'bg-red-950/60 border border-red-800 text-red-500 opacity-40' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// ==========================================
// LEADERBOARD VIEW
// ==========================================
function LeaderboardView() {
  const leaders = [
    { rank: 1, name: 'გიორგი_90s', avatar: '👾', score: 2850, wins: 32 },
    { rank: 2, name: 'სალომე_Retro', avatar: '👑', score: 2410, wins: 26 },
    { rank: 3, name: 'ნიკა_Arcade', avatar: '🚀', score: 1980, wins: 19 },
    { rank: 4, name: 'ანი_Pixel', avatar: '🐱', score: 1620, wins: 15 },
    { rank: 5, name: 'დათო_Gamer', avatar: '🤖', score: 1210, wins: 11 }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4">
      <div className="text-center space-y-2">
        <span className="text-5xl">🏆</span>
        <h2 className="text-3xl font-black text-yellow-300">საერთო რეიტინგები</h2>
        <p className="text-xs text-slate-400">90s GAME CLUB-ის საუკეთესო მოთამაშეების სია</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl divide-y divide-slate-800/60">
        {leaders.map((p) => (
          <div key={p.rank} className="flex items-center justify-between p-4 hover:bg-slate-850/50 transition-colors rounded-2xl">
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                p.rank === 1 ? 'bg-yellow-400 text-slate-950' : p.rank === 2 ? 'bg-slate-300 text-slate-950' : p.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {p.rank}
              </span>
              <span className="text-3xl">{p.avatar}</span>
              <div>
                <div className="font-bold text-white text-base">{p.name}</div>
                <div className="text-xs text-slate-400">მოგებები: {p.wins}</div>
              </div>
            </div>

            <div className="text-right font-mono font-black text-yellow-300 text-lg">
              {p.score} ქ
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// RULES & HOW TO PLAY VIEW
// ==========================================
function RulesView() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="text-center space-y-2">
        <span className="text-5xl">📖</span>
        <h2 className="text-3xl font-black text-pink-400">თამაშის წესები</h2>
        <p className="text-xs text-slate-400">ისწავლე და გაიხსენე ბავშვობის საყვარელი წესები</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2">
            🏙️ ქალაქობანა
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>აირჩიეთ მინიმუმ 2 კატეგორია თამაშის დასაწყებად.</li>
            <li>ანბანის ბორბალზე „სტოპით“ აირჩევა რაუნდის ასო.</li>
            <li>ყველა მოთამაშე ავსებს თავის ცხრილს განსაზღვრულ დროში.</li>
            <li>სწორი და უნიკალური პასუხი იძლევა +10 ქულას.</li>
            <li>შეფასება ხდება მწვანე/წითელი ხმის მიცემით რაუნდის ბოლოს.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            🪢 ჩამოხრჩობანა
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>ერთი მოთამაშე იფიქრებს ქართულ არსებით სახელს.</li>
            <li>მეორე მოთამაშე ცდილობს სიტყვის ასო-ასო გამოცნობას.</li>
            <li>ყოველი არასწორი ასო ამატებს ნახატის შემდეგ ნაწილს.</li>
            <li>გაქვს მაქსიმუმ 9 არასწორი მცდელობა.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// USER PROFILE / CABINET VIEW
// ==========================================
function ProfileCabinetView({ user, setUser }) {
  const [nameInput, setNameInput] = useState(user.name);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    sounds.click();
    setUser({ ...user, name: nameInput });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      <div className="bg-slate-900 border-2 border-pink-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
        <h2 className="text-2xl font-black text-pink-400 flex items-center gap-2">
          👤 ჩემი კაბინეტი
        </h2>

        {/* Avatar Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 block">აირჩიე ავატარი:</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { sounds.click(); setUser({ ...user, avatar: emoji }); }}
                className={`text-3xl p-2 rounded-2xl border-2 transition-transform ${
                  user.avatar === emoji 
                    ? 'border-pink-500 bg-pink-500/20 scale-110' 
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">მომხმარებლის სახელი:</label>
            <input 
              type="text" 
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-pink-500"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md shadow-pink-500/20 active:scale-95 transition-all"
          >
            პროფილის შენახვა
          </button>
        </form>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">დაგროვილი ქულები:</div>
            <div className="text-xl font-black text-yellow-300 font-mono">{user.score} ქ</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">მოგების პროცენტი:</div>
            <div className="text-xl font-black text-emerald-400 font-mono">50%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CREATE ROOM MODAL
// ==========================================
function CreateRoomModal({ onClose, onCreate }) {
  const [selectedGame, setSelectedGame] = useState('city');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [selectedCats, setSelectedCats] = useState([
    'სახელი', 'გვარი', 'ქალაქი', 'ქვეყანა', 'ცხოველი', 'მცენარე'
  ]);

  const toggleCategory = (cat) => {
    sounds.click();
    if (selectedCats.includes(cat)) {
      if (selectedCats.length <= 2) return; // Maintain mandatory minimum 2 categories rule!
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-black text-pink-400 mb-4 flex items-center gap-2">
          🎮 ოთახის შექმნა
        </h3>

        {/* Game Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => setSelectedGame('city')}
            className={`p-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${
              selectedGame === 'city' 
                ? 'border-pink-500 bg-pink-500/20 text-pink-300' 
                : 'border-slate-800 bg-slate-950 text-slate-400'
            }`}
          >
            🏙️ ქალაქობანა
          </button>
          <button 
            onClick={() => setSelectedGame('hangman')}
            className={`p-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${
              selectedGame === 'hangman' 
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' 
                : 'border-slate-800 bg-slate-950 text-slate-400'
            }`}
          >
            🪢 ჩამოხრჩობანა
          </button>
        </div>

        {/* City Game Categories Picker */}
        {selectedGame === 'city' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-400">
                არჩეული კატეგორიები (მინიმუმ 2):
              </label>
              <span className="text-xs text-yellow-300 font-bold">{selectedCats.length} არჩეულია</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {CATEGORY_GROUPS.flatMap(g => g.items).map((cat, i) => {
                const isSelected = selectedCats.includes(cat);
                return (
                  <button
                    key={i}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left truncate ${
                      isSelected 
                        ? 'bg-pink-500 text-white shadow-sm' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timer Picker */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-slate-400 block">რაუნდის დრო:</label>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map(s => (
              <button
                key={s}
                onClick={() => setTimerSeconds(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  timerSeconds === s 
                    ? 'bg-purple-600 border-purple-400 text-white' 
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {s} წმ
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onCreate(selectedGame, { categories: selectedCats, timerSeconds })}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
        >
          ოთახის შექმნა & დაწყება
        </button>
      </div>
    </div>
  );
}
