import { motion } from "framer-motion";
import { type FeedbackSection } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ScoreCardProps {
  totalScore: number;
  sections: FeedbackSection[];
  strengths: string[];
  improvements: string[];
  incorrectClaims?: string[];
}

export function ScoreCard({ totalScore, sections, strengths, improvements, incorrectClaims }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getBarColor = (score: number) => {
    if (score >= 15) return "#10b981"; // emerald-500 (assuming out of 20)
    if (score >= 10) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
      {/* Total Score & Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center"
      >
        <h3 className="text-xl font-medium text-slate-500 mb-4">Overall Performance</h3>
        <div className="relative flex items-center justify-center w-48 h-48 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - totalScore / 100)}
              className={getScoreColor(totalScore)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-5xl font-bold ${getScoreColor(totalScore)}`}>
              {totalScore}
            </span>
            <span className="text-sm text-slate-400 font-medium">OUT OF 100</span>
          </div>
        </div>
        <p className="text-slate-600 px-4">
          {totalScore >= 80 ? "Excellent work! You're ready for the field." : 
           totalScore >= 60 ? "Good effort, but there are areas to refine." : 
           "Needs improvement. Review the feedback and try again."}
        </p>
      </motion.div>

      {/* Breakdown Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-xl border border-slate-100"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-6">Section Breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sections} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 20]} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                {sections.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Strengths */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-3 grid md:grid-cols-2 gap-8"
      >
        <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100">
          <h4 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <span className="bg-emerald-200 p-1 rounded">👍</span> Key Strengths
          </h4>
          <ul className="space-y-3">
            {strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-3 text-emerald-900">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
          <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
            <span className="bg-amber-200 p-1 rounded">🎯</span> Areas for Improvement
          </h4>
          <ul className="space-y-3">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-3 text-amber-900">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {incorrectClaims && incorrectClaims.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
            <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <span className="bg-red-200 p-1 rounded">⚠️</span> Accuracy Alerts
            </h4>
            <ul className="space-y-3">
              {incorrectClaims.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-red-900">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
