import { useParams, useLocation } from "wouter";
import { useSimulation } from "@/hooks/use-simulations";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Share2 } from "lucide-react";
import { type SimulationFeedback } from "@shared/schema";
import { motion } from "framer-motion";

export default function Results() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useSimulation(parseInt(id || "0"));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 lg:col-span-1 rounded-2xl" />
            <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.simulation.feedback) return <div>No results found.</div>;

  const feedback = data.simulation.feedback as unknown as SimulationFeedback;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-primary mb-2"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              Simulation Results
            </h1>
            <p className="text-slate-500 mt-1">
              For {data.simulation.userName} • {new Date(data.simulation.createdAt!).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button onClick={() => setLocation("/")} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ScoreCard 
          totalScore={data.simulation.score || 0}
          sections={feedback.sections}
          strengths={feedback.strengths}
          improvements={feedback.improvements}
        />

        {/* Transcript Review Accordion (Optional expansion) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Transcript Review</h3>
          </div>
          <div className="p-0">
            {data.transcripts.map((t, i) => (
              <div 
                key={t.id} 
                className={`p-6 border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
              >
                <div className="flex gap-4">
                  <span className={`
                    text-xs font-bold uppercase tracking-wider w-20 shrink-0 pt-1
                    ${t.role === 'user' ? 'text-primary' : 'text-emerald-600'}
                  `}>
                    {t.role === 'user' ? 'You' : 'Dr. Hayes'}
                  </span>
                  <p className="text-slate-700 leading-relaxed">{t.content}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
