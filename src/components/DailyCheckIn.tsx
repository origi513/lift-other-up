import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Heart, Smile, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { getCheckInFeedback } from '../services/geminiService';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface DailyCheckInProps {
  profile: UserProfile;
  onBack: () => void;
}

const moods = [
  { emoji: '✨', label: 'Excited', color: 'bg-yellow-100' },
  { emoji: '😌', label: 'Happy', color: 'bg-green-100' },
  { emoji: '🤔', label: 'Neutral', color: 'bg-gray-100' },
  { emoji: '😩', label: 'Tired', color: 'bg-blue-100' },
  { emoji: '😓', label: 'Stressed', color: 'bg-orange-100' },
  { emoji: '😔', label: 'Sad', color: 'bg-indigo-100' },
  { emoji: '😰', label: 'Anxious', color: 'bg-purple-100' },
  { emoji: '🙏', label: 'Grateful', color: 'bg-pink-100' }
];

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ profile, onBack }) => {
  const [mood, setMood] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'mood' | 'reason' | 'feedback'>('mood');

  const handleMoodSelect = (selectedMood: string) => {
    setMood(selectedMood);
    setStep('reason');
  };

  const handleSubmit = async () => {
    if (!mood || !reason) return;
    setLoading(true);
    
    try {
      const aiResponse = await getCheckInFeedback(mood, reason);
      setFeedback(aiResponse);
      setStep('feedback');
      
      try {
        await addDoc(collection(db, 'checkins'), {
          userId: profile.uid,
          mood,
          reason,
          aiFeedback: aiResponse,
          createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, 'users', profile.uid), {
          streak: increment(1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'checkins/users');
      }
    } catch (error) {
      console.error("Check-in Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[80vh] flex flex-col items-center justify-center py-10"
    >
      {/* Atmospheric Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-blue/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-peach/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-primary-blue transition-colors font-bold group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Dashboard
        </button>

        <AnimatePresence mode="wait">
          {step === 'mood' && (
            <motion.div 
              key="mood-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-2">How are you, {profile.name}?</h2>
              <p className="text-gray-500 mb-10 text-lg">Select the emoji that best matches your energy right now.</p>
              
              <div className="grid grid-cols-4 gap-4">
                {moods.map(m => (
                  <button 
                    key={m.label}
                    onClick={() => handleMoodSelect(m.label)}
                    className={`group p-6 rounded-3xl border-2 border-transparent bg-white shadow-sm hover:shadow-xl hover:border-sky-blue/30 transition-all flex flex-col items-center gap-3 active:scale-95`}
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{m.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary-blue">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'reason' && (
            <motion.div 
              key="reason-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">{moods.find(m => m.label === mood)?.emoji}</div>
                <h2 className="text-3xl font-bold mb-2">What's on your mind?</h2>
                <p className="text-gray-500">Sharing helps clarify your thoughts. What's contributing to your {mood.toLowerCase()} mood?</p>
              </div>

              <div className="card-container p-2 bg-white shadow-2xl">
                <textarea 
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="I'm feeling this way because..."
                  className="w-full p-6 text-lg border-none rounded-2xl h-48 outline-none focus:ring-0 resize-none"
                />
                <div className="p-4 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                  <button 
                    onClick={() => setStep('mood')}
                    className="text-sm font-bold text-gray-400 hover:text-gray-600"
                  >
                    Change Mood
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading || !reason}
                    className="btn-peach px-8 py-3 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-peach/20"
                  >
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Heart size={18} />
                      </motion.div>
                    ) : (
                      <Send size={18} />
                    )}
                    {loading ? 'Reflecting...' : 'Share with AI Coach'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'feedback' && (
            <motion.div 
              key="feedback-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-sky-blue/10">
                <span className="text-4xl">🤖</span>
              </div>
              
              <div className="card-container p-10 bg-white/80 backdrop-blur-md shadow-2xl border border-white">
                <div className="text-xl leading-relaxed text-gray-700 italic font-serif">
                  <Markdown>{feedback}</Markdown>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <button 
                  onClick={onBack}
                  className="btn-peach py-4 text-lg shadow-xl shadow-peach/30"
                >
                  Done for Today
                </button>
                <button 
                  onClick={() => { setStep('mood'); setMood(''); setReason(''); setFeedback(''); }}
                  className="text-sm font-bold text-gray-400 hover:text-primary-blue"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
