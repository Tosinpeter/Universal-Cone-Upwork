import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useSimulation, useChat, useScoreSimulation } from "@/hooks/use-simulations";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import { AudioWaveform } from "@/components/AudioWaveform";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Stethoscope } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { motion, AnimatePresence } from "framer-motion";
import 'regenerator-runtime/runtime';

export default function Simulation() {
  const { id } = useParams();
  const simulationId = parseInt(id || "0");
  const [, setLocation] = useLocation();

  const { data, isLoading } = useSimulation(simulationId);
  const chatMutation = useChat(simulationId);
  const scoreMutation = useScoreSimulation(simulationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition State
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.transcripts, listening, transcript]);

  // Handle TTS
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak new assistant messages
  useEffect(() => {
    if (data?.transcripts && data.transcripts.length > 0) {
      const lastMsg = data.transcripts[data.transcripts.length - 1];
      if (lastMsg.role === 'assistant') {
        speak(lastMsg.content);
      }
    }
  }, [data?.transcripts]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="p-8 bg-white rounded-xl shadow-xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Browser Not Supported</h2>
          <p className="text-slate-600">Please use Google Chrome, Edge, or Safari for voice recognition features.</p>
          <Button onClick={() => setLocation("/")} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const handleMicClick = () => {
    if (listening) {
      // Stop listening and send
      SpeechRecognition.stopListening();
      if (transcript.trim()) {
        handleSubmit(transcript);
      }
    } else {
      // Start listening
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleSubmit = (text: string) => {
    setIsProcessing(true);
    chatMutation.mutate(text, {
      onSettled: () => {
        setIsProcessing(false);
        resetTranscript();
      }
    });
  };

  const handleEndSimulation = () => {
    if (confirm("Are you sure you want to end the simulation and get your score?")) {
      scoreMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")} 
              className="hover:bg-slate-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">Dr. Hayes</h1>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Orthopedic Surgeon</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleEndSimulation}
            disabled={scoreMutation.isPending}
            className="rounded-full px-6 shadow-sm"
          >
            {scoreMutation.isPending ? "Calculating Score..." : "End Simulation"}
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-32">
            {/* Initial System Message context */}
            <div className="flex justify-center">
              <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
                Simulation Started • {new Date(data.simulation.createdAt!).toLocaleTimeString()}
              </span>
            </div>

            {data.transcripts.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`
                  h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-sm
                  ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-emerald-600 border border-slate-200'}
                `}>
                  {msg.role === 'user' ? <User size={20} /> : <Stethoscope size={20} />}
                </div>
                
                <div className={`
                  max-w-[80%] p-4 rounded-2xl shadow-sm text-base leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}
                `}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {/* Live Transcript Display */}
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-4 flex-row-reverse"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  <div className="max-w-[80%] p-4 rounded-2xl bg-primary/5 border border-primary/10 text-slate-700 rounded-tr-none italic">
                     {transcript || "Listening..."}
                     <div className="mt-2">
                       <AudioWaveform active={true} />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing State */}
            {isProcessing && (
              <div className="flex items-center gap-3 text-slate-400 text-sm ml-14">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                 </div>
                 Dr. Hayes is thinking...
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </main>

      {/* Footer Controls */}
      <footer className="bg-white border-t border-slate-200 p-6 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <MicrophoneButton
            isListening={listening}
            isProcessing={isProcessing}
            onClick={handleMicClick}
            disabled={scoreMutation.isPending}
          />
        </div>
      </footer>
    </div>
  );
}
