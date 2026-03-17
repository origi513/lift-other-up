import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, TrendingUp, Star, Award, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile } from '../types';

interface ProgressSummaryProps {
  profile: UserProfile;
  onBack: () => void;
}

const data = [
  { name: 'Mon', growth: 40 },
  { name: 'Tue', growth: 30 },
  { name: 'Wed', growth: 65 },
  { name: 'Thu', growth: 45 },
  { name: 'Fri', growth: 80 },
  { name: 'Sat', growth: 70 },
  { name: 'Sun', growth: 90 },
];

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ profile, onBack }) => {
  const badges = [
    { id: 1, icon: '🔥', label: '7 Day Streak', earned: profile.streak >= 7 },
    { id: 2, icon: '🌟', label: '10 Kudos', earned: profile.totalRecognitions >= 10 },
    { id: 3, icon: '🧘', label: 'Mindful', earned: true },
    { id: 4, icon: '🤝', label: 'Helper', earned: profile.totalRecognitions >= 5 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-400 hover:text-primary-blue transition-colors font-bold group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
        Back
      </button>

      <div className="card-container p-8">
        <h2 className="text-3xl font-bold mb-2 text-primary-blue">Progress Summary</h2>
        <p className="text-gray-500 mb-8">Visualizing your journey of self-discovery and kindness.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            icon={<Calendar className="text-orange-500" />} 
            label="Current Streak" 
            value={`${profile.streak} Days`} 
            color="bg-orange-50" 
          />
          <StatCard 
            icon={<Star className="text-purple-500" />} 
            label="Kudos Received" 
            value={profile.totalRecognitions} 
            color="bg-purple-50" 
          />
          <StatCard 
            icon={<Award className="text-green-500" />} 
            label="Reflection Quality" 
            value="High ✨" 
            color="bg-green-50" 
          />
        </div>

        <section className="space-y-8">
          {/* Badges Section - Design Idea 1 */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award size={20} className="text-primary-blue" />
              Your Badges
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${
                    badge.earned ? 'bg-white border-sky-blue shadow-md' : 'bg-gray-50 border-transparent opacity-40 grayscale'
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-[8px] font-bold text-center uppercase">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-blue" />
              Emotional Growth
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">LAST 7 DAYS</span>
          </div>

          <div className="h-64 w-full bg-baby-blue/30 rounded-3xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Arial'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="growth" 
                  stroke="#3BAFDA" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3BAFDA', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-baby-blue/50 p-6 rounded-3xl border border-sky-blue/10">
            <h4 className="font-bold mb-2">AI Insight ✨</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              You've been consistently reflecting on your **Personal** and **Academic** growth. Your mood has been trending upwards since Wednesday! Keep up the great work.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`${color} p-6 rounded-[32px] flex flex-col items-center text-center space-y-2 shadow-sm`}>
    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);
