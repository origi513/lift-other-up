/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  increment,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, CheckIn, Reflection, Recognition } from './types';
import { getCheckInFeedback, getReflectionFeedback } from './services/geminiService';
import { handleFirestoreError, OperationType } from './utils/errorHandling';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  MessageCircle, 
  Award, 
  BookOpen, 
  Users, 
  LogOut, 
  Plus,
  Send,
  ChevronLeft,
  User as UserIcon,
  TrendingUp,
  Star
} from 'lucide-react';
import Markdown from 'react-markdown';

// --- Components ---

const Loading = () => (
  <div className="min-height-screen flex items-center justify-center">
    <motion.div 
      animate={{ scale: [1, 1.1, 1] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-primary-blue font-heading text-2xl font-bold"
    >
      Lifting Others Up...
    </motion.div>
  </div>
);

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Auth Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-blue/10 to-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-container p-10 w-full max-w-md text-center shadow-xl"
      >
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
          <Heart className="text-primary-blue" size={40} />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-primary-blue">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 mb-8">
          {isSignUp ? 'Join our community of support and growth.' : 'Sign in to continue your reflection journey.'}
        </p>
        
        <button 
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-700 shadow-sm hover:shadow-md active:scale-95"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-5 h-5" alt="Google" />
          {isSignUp ? 'Sign up with Google' : 'Login with Google'}
        </button>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">OR</span>
          </div>
        </div>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-400">Username / Email</label>
            <input type="text" placeholder="Enter your email" className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:border-primary-blue transition-colors bg-gray-50/50" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-400">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:border-primary-blue transition-colors bg-gray-50/50" />
          </div>
          <button className="btn-peach w-full py-4 text-lg shadow-lg shadow-peach/20 active:scale-95 transition-transform">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary-blue font-bold hover:underline"
          >
            {isSignUp ? 'Log in' : 'Sign up!'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

import { DailyCheckIn } from './components/DailyCheckIn';
import { WeeklyReflection } from './components/WeeklyReflection';
import { ProgressSummary } from './components/ProgressSummary';

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'checkin' | 'reflection' | 'recognition' | 'feed' | 'progress'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Student',
              email: firebaseUser.email || '',
              role: 'student',
              streak: 0,
              totalRecognitions: 0,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <Loading />;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen pb-20">
      <header className="p-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Heart className="text-primary-blue" size={20} />
          </div>
          <h1 className="text-xl font-bold text-primary-blue">Lifting Others Up</h1>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && <Dashboard profile={profile} setView={setView} />}
          {view === 'checkin' && profile && <DailyCheckIn profile={profile} onBack={() => setView('dashboard')} />}
          {view === 'reflection' && profile && <WeeklyReflection profile={profile} onBack={() => setView('dashboard')} />}
          {view === 'recognition' && profile && <PeerRecognition profile={profile} onBack={() => setView('dashboard')} />}
          {view === 'feed' && <RecognitionFeed onBack={() => setView('dashboard')} />}
          {view === 'progress' && profile && <ProgressSummary profile={profile} onBack={() => setView('dashboard')} />}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-around items-center z-50">
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Smile />} label="Home" />
        <NavButton active={view === 'feed'} onClick={() => setView('feed')} icon={<Users />} label="Feed" />
        <NavButton active={view === 'progress'} onClick={() => setView('progress')} icon={<TrendingUp />} label="Stats" />
        <NavButton active={view === 'recognition'} onClick={() => setView('recognition')} icon={<Plus className="bg-peach rounded-full p-1" />} label="Give" />
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary-blue' : 'text-gray-400'}`}
  >
    {React.cloneElement(icon, { size: 24 })}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

// --- View Components ---

const Dashboard = ({ profile, setView }: any) => {
  const personas = [
    { id: 'owl', emoji: '🦉', label: 'Wise Owl' },
    { id: 'lion', emoji: '🦁', label: 'Brave Lion' },
    { id: 'dolphin', emoji: '🐬', label: 'Kind Dolphin' },
    { id: 'fox', emoji: '🦊', label: 'Clever Fox' }
  ];

  const toggleGoal = async (goal: 'study' | 'exercise' | 'sleep') => {
    const newGoals = {
      study: profile.goals?.study || false,
      exercise: profile.goals?.exercise || false,
      sleep: profile.goals?.sleep || false,
      ...profile.goals,
      [goal]: !profile.goals?.[goal]
    };
    try {
      await updateDoc(doc(db, 'users', profile.uid), { goals: newGoals });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const selectPersona = async (persona: string) => {
    try {
      await updateDoc(doc(db, 'users', profile.uid), { persona });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="card-container p-6 bg-gradient-to-br from-white to-baby-blue">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">Hi, {profile?.name}! 👋</h2>
            <p className="text-gray-500">Welcome to your central hub.</p>
          </div>
          <div className="text-4xl bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            {personas.find(p => p.id === profile?.persona)?.emoji || '👤'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/80 p-4 rounded-2xl flex items-center gap-3 border border-gray-50">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-orange-500" size={20} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">STREAK</div>
              <div className="text-lg font-bold">{profile?.streak || 0} Days</div>
            </div>
          </div>
          <div className="bg-white/80 p-4 rounded-2xl flex items-center gap-3 border border-gray-50">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="text-purple-500" size={20} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">KUDOS</div>
              <div className="text-lg font-bold">{profile?.totalRecognitions || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Setting Board - Design Idea 1 */}
      <div className="card-container p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="text-primary-blue" size={20} />
          Goal Setting Board
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['study', 'exercise', 'sleep'] as const).map(goal => (
            <button 
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                profile?.goals?.[goal] 
                  ? 'bg-sky-blue border-sky-blue text-white' 
                  : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              <span className="text-2xl">
                {goal === 'study' ? '📚' : goal === 'exercise' ? '🏃' : '😴'}
              </span>
              <span className="text-[10px] font-bold uppercase">{goal}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Persona Selection - Design Idea 1 */}
      {!profile?.persona && (
        <div className="card-container p-6">
          <h3 className="text-lg font-bold mb-4">Choose Your Persona</h3>
          <div className="grid grid-cols-4 gap-3">
            {personas.map(p => (
              <button 
                key={p.id}
                onClick={() => selectPersona(p.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-baby-blue transition-colors border border-transparent hover:border-sky-blue/20"
              >
                <span className="text-3xl">{p.emoji}</span>
                <span className="text-[10px] font-bold text-gray-500">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-4">
        <ActionButton 
          onClick={() => setView('checkin')}
          icon={<Smile className="text-green-500" />}
          title="Daily Check-in"
          desc="Log your mood and get AI support"
          color="bg-green-50"
        />
        <ActionButton 
          onClick={() => setView('reflection')}
          icon={<BookOpen className="text-blue-500" />}
          title="Weekly Reflection"
          desc="Reflect on your growth this week"
          color="bg-blue-50"
        />
        <ActionButton 
          onClick={() => setView('recognition')}
          icon={<Award className="text-orange-500" />}
          title="Peer Recognition"
          desc="Lift someone else up today"
          color="bg-orange-50"
        />
      </div>
    </motion.div>
  );
};

const ActionButton = ({ onClick, icon, title, desc, color }: any) => (
  <button 
    onClick={onClick}
    className="card-container p-5 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  </button>
);

const PeerRecognition = ({ profile, onBack }: any) => {
  const [receiverName, setReceiverName] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const categories = ["Teamwork", "Empathy", "Leadership", "Resilience", "Kindness", "Academic Help"];

  const handleSubmit = async () => {
    if (!receiverName || !category || !message) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'recognitions'), {
        senderId: profile.uid,
        senderName: isAnonymous ? 'Anonymous' : profile.name,
        receiverId: 'placeholder', // In a real app, you'd select a user from a list
        receiverName,
        category,
        message,
        isAnonymous,
        createdAt: serverTimestamp()
      });
      setDone(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recognitions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold">
        <ChevronLeft size={20} /> Back
      </button>
      
      <div className="card-container p-6">
        <h2 className="text-2xl font-bold mb-6">Lift Someone Up</h2>
        
        {!done ? (
          <div className="space-y-6">
            <div>
              <label className="block font-bold mb-2">Who are you recognizing?</label>
              <input 
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Friend's name..."
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-primary-blue"
              />
            </div>
            
            <div>
              <label className="block font-bold mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <button 
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block font-bold mb-2">Your message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did they do that was awesome?"
                className="w-full p-4 border border-gray-200 rounded-2xl h-32 outline-none focus:border-primary-blue"
              />
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded-md accent-primary-blue"
              />
              <span className="text-sm font-bold text-gray-600">Post anonymously</span>
            </label>
            
            <button 
              onClick={handleSubmit}
              disabled={loading || !receiverName || !category || !message}
              className="btn-peach w-full p-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={20} /> {loading ? 'Sending...' : 'Send Recognition'}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Star className="text-orange-500" size={40} />
            </div>
            <h3 className="text-xl font-bold">Recognition Sent!</h3>
            <p className="text-gray-500">You just made someone's day a little brighter. ✨</p>
            <button onClick={onBack} className="btn-peach w-full p-4">Done</button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RecognitionFeed = ({ onBack }: any) => {
  const [posts, setPosts] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'recognitions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recognition[];
      setPosts(newPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recognitions');
    });
    return unsubscribe;
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Community Feed</h2>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">LATEST KUDOS</div>
      </div>
      
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading feed...</div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-container p-5 border-l-4 border-orange-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-blue rounded-full flex items-center justify-center">
                    <UserIcon size={16} className="text-primary-blue" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{post.senderName} ➔ {post.receiverName}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{post.category}</div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-300 font-bold">
                  {post.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed italic">"{post.message}"</p>
            </motion.div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 text-gray-400">No recognitions yet. Be the first!</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

