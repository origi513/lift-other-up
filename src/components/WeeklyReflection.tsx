import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, BookOpen, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getReflectionFeedback } from '../services/geminiService';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface WeeklyReflectionProps {
  profile: UserProfile;
  onBack: () => void;
}

const categories = [
  { id: 'academic', label: 'Academic', icon: '📚', color: 'bg-blue-100' },
  { id: 'spiritual', label: 'Spiritual', icon: '✨', color: 'bg-purple-100' },
  { id: 'mental', label: 'Mental', icon: '🧠', color: 'bg-green-100' },
  { id: 'emotional', label: 'Emotional', icon: '❤️', color: 'bg-red-100' },
  { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-orange-100' }
] as const;

export const WeeklyReflection: React.FC<WeeklyReflectionProps> = ({ profile, onBack }) => {
  const [category, setCategory] = useState<string>('');
  const [step, setStep] = useState(0); // 0: Category, 1: Went Well, 2: Went Wrong, 3: Plan, 4: Feedback
  const [responses, setResponses] = useState({ well: '', wrong: '', plan: '' });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const content = `Went well: ${responses.well}\nWent wrong: ${responses.wrong}\nPlan: ${responses.plan}`;
    setLoading(true);
    
    try {
      const aiResponse = await getReflectionFeedback(category, content);
      setFeedback(aiResponse);
      
      try {
        await addDoc(collection(db, 'reflections'), {
          userId: profile.uid,
          category,
          content,
          aiFeedback: aiResponse,
          createdAt: serverTimestamp()
        });
        setStep(4);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reflections');
      }
    } catch (error) {
      console.error("Reflection Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-400 hover:text-primary-blue transition-colors font-bold group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
        Back
      </button>
      
      <div className="card-container min-h-[600px] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-baby-blue rounded-full flex items-center justify-center">
            <BookOpen className="text-primary-blue" size={20} />
          </div>
          <div>
            <h2 className="font-bold">Weekly Growth Reflection</h2>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">AI Coach Online</p>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* AI Intro */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
            <div className="chat-bubble-ai max-w-[80%]">
              Hi {profile.name}! Let's look back on your week. Which area should we focus on?
            </div>
          </div>

          {category && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
              <div className="chat-bubble-user">
                I'd like to reflect on my {category} growth.
              </div>
              <div className="w-8 h-8 bg-sky-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white">👤</div>
            </motion.div>
          )}

          {category && step >= 1 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="chat-bubble-ai max-w-[80%]">
                Great choice. First, tell me: what **went well** this week?
              </div>
            </div>
          )}

          {responses.well && step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
              <div className="chat-bubble-user">{responses.well}</div>
              <div className="w-8 h-8 bg-sky-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white">👤</div>
            </motion.div>
          )}

          {step >= 2 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="chat-bubble-ai max-w-[80%]">
                And what **went wrong** or was challenging?
              </div>
            </div>
          )}

          {responses.wrong && step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
              <div className="chat-bubble-user">{responses.wrong}</div>
              <div className="w-8 h-8 bg-sky-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white">👤</div>
            </motion.div>
          )}

          {step >= 3 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="chat-bubble-ai max-w-[80%]">
                Finally, what is your **plan to maintain or improve** next week?
              </div>
            </div>
          )}

          {responses.plan && step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
              <div className="chat-bubble-user">{responses.plan}</div>
              <div className="w-8 h-8 bg-sky-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white">👤</div>
            </motion.div>
          )}

          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="chat-bubble-ai max-w-[80%] italic">
                <Markdown>{feedback}</Markdown>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-baby-blue rounded-full flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="chat-bubble-ai">Typing...</div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          {step === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => { setCategory(c.id); setStep(1); }}
                  className="p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-blue transition-all flex flex-col items-center gap-1 shadow-sm"
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[8px] font-bold uppercase">{c.label}</span>
                </button>
              ))}
            </div>
          ) : step < 4 ? (
            <div className="space-y-4">
              <textarea 
                value={step === 1 ? responses.well : step === 2 ? responses.wrong : responses.plan}
                onChange={(e) => setResponses(r => ({ ...r, [step === 1 ? 'well' : step === 2 ? 'wrong' : 'plan']: e.target.value }))}
                placeholder="Type your response here..."
                className="w-full p-4 border border-gray-200 rounded-2xl h-24 outline-none focus:border-primary-blue transition-colors resize-none"
              />
              <button 
                onClick={step === 3 ? handleSubmit : nextStep}
                disabled={loading || !(step === 1 ? responses.well : step === 2 ? responses.wrong : responses.plan)}
                className="btn-peach w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {step === 3 ? <Send size={18} /> : null}
                {step === 3 ? 'Get AI Feedback' : 'Next Question'}
              </button>
            </div>
          ) : (
            <button onClick={onBack} className="btn-peach w-full py-4">Finish Reflection</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
