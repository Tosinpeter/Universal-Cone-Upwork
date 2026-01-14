import { useState } from "react";
import { useCreateSimulation } from "@/hooks/use-simulations";
import { motion } from "framer-motion";
import { Stethoscope, ArrowRight, Activity, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [name, setName] = useState("");
  const createSimulation = useCreateSimulation();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createSimulation.mutate({ userName: name });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* Navbar */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Stethoscope size={24} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">
            MedSim<span className="text-primary">.ai</span>
          </span>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
            <Activity size={16} />
            Universal Cone Challenge v2.0
          </div>

          <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-slate-900 leading-tight">
            Master the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Surgeon Conversation
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-lg mx-auto leading-relaxed">
            Practice your sales pitch with our AI-powered orthopedic surgeon simulator. Get real-time feedback and perfect your technique.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 max-w-md mx-auto"
          >
            <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-white transition-colors h-12 text-lg"
                autoFocus
              />
              <Button 
                type="submit" 
                size="lg" 
                disabled={!name.trim() || createSimulation.isPending}
                className="h-12 px-8 rounded-xl font-semibold text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {createSimulation.isPending ? "Starting..." : "Start"}
                {!createSimulation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </motion.div>

          <div className="pt-8 flex items-center justify-center gap-8 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Award className="text-primary" size={18} />
              <span>Real-time Scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="text-primary" size={18} />
              <span>Voice Interaction</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
