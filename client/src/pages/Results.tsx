import { useParams, useLocation } from "wouter";
import { useSimulation } from "@/hooks/use-simulations";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Share2, Trophy, Crown, Medal } from "lucide-react";
import { type SimulationFeedback, type Simulation } from "@shared/schema";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Results() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useSimulation(parseInt(id || "0"));
  const hasPlayedCelebration = useRef(false);
  
  // Fetch top 10 leaderboard
  const { data: top10 } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations/top10'],
  });
  
  // Check if current user is in top 10 and play celebration sound
  const userScore = data?.simulation?.score;
  const isInTop10 = top10 && userScore !== null && userScore !== undefined && 
    top10.some(s => s.id === data?.simulation?.id);
  
  // Define celebration sound function before useEffect
  function playCelebrationSound() {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a triumphant fanfare sequence
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'triangle'; // Brass-like tone
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + startTime + duration * 0.5);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Triumphant fanfare melody (C major chord progression)
    playNote(523.25, 0, 0.2);    // C5
    playNote(659.25, 0.2, 0.2);  // E5
    playNote(783.99, 0.4, 0.2);  // G5
    playNote(1046.50, 0.6, 0.4); // C6 (hold longer)
  }
  
  useEffect(() => {
    if (isInTop10 && !hasPlayedCelebration.current) {
      hasPlayedCelebration.current = true;
      playCelebrationSound();
    }
  }, [isInTop10]);

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
          incorrectClaims={feedback.incorrectClaims}
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

        {/* Top 10 Leaderboard */}
        {top10 && top10.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            data-testid="leaderboard-section"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Top 10 Leaderboard</h3>
                {isInTop10 && (
                  <span className="ml-auto px-3 py-1 bg-amber-500 text-white text-sm font-semibold rounded-full animate-pulse">
                    You made the list!
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {top10.map((sim, index) => {
                const isCurrentUser = sim.id === data.simulation.id;
                return (
                  <div
                    key={sim.id}
                    className={`flex items-center gap-4 p-4 ${isCurrentUser ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                    data-testid={`leaderboard-row-${index + 1}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {index === 0 ? (
                        <Crown className="h-7 w-7 text-amber-500" />
                      ) : index === 1 ? (
                        <Medal className="h-6 w-6 text-slate-400" />
                      ) : index === 2 ? (
                        <Medal className="h-6 w-6 text-amber-700" />
                      ) : (
                        <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-slate-900'}`}>
                        {sim.userName}
                        {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${isCurrentUser ? 'text-primary' : 'text-slate-900'}`}>
                        {sim.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
