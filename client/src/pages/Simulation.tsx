import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import { playTextToSpeech, stopCurrentAudio } from "@/lib/audioUtils";
import 'regenerator-runtime/runtime';

// Custom hook for Deepgram fallback
function useDeepgramSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/deepgram`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Deepgram WebSocket connected");
        setIsListening(true);
        setTranscript("");

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "transcript" && data.text) {
          if (data.isFinal) {
            setTranscript(prev => (prev + " " + data.text).trim());
          }
        }
      };

      ws.onerror = (err) => {
        console.error("Deepgram WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("Deepgram WebSocket closed");
        setIsListening(false);
      };

    } catch (err) {
      console.error("Failed to start Deepgram:", err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    listening: isListening,
    startListening,
    stopListening,
    resetTranscript
  };
}

export default function Simulation() {
  const { id } = useParams();
  const simulationId = parseInt(id || "0");
  const [, setLocation] = useLocation();

  const { data, isLoading } = useSimulation(simulationId);
  const chatMutation = useChat(simulationId);
  const scoreMutation = useScoreSimulation(simulationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Browser Speech Recognition
  const browserSpeech = useSpeechRecognition();

  // Deepgram fallback for unsupported browsers
  const deepgramSpeech = useDeepgramSpeech();

  // Use browser speech if supported, otherwise use Deepgram
  const useBrowserSpeech = browserSpeech.browserSupportsSpeechRecognition;

  const transcript = useBrowserSpeech ? browserSpeech.transcript : deepgramSpeech.transcript;
  const listening = useBrowserSpeech ? browserSpeech.listening : deepgramSpeech.listening;
  const resetTranscript = useBrowserSpeech ? browserSpeech.resetTranscript : deepgramSpeech.resetTranscript;

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.transcripts, listening, transcript]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Optimized TTS handler with useCallback
  const speak = useCallback(async (text: string) => {
    SpeechRecognition.stopListening();

    await playTextToSpeech(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (error) => {
        console.error("TTS Error:", error);
        setIsSpeaking(false);
      }
    );
  }, []);

  // Speak new assistant messages
  useEffect(() => {
    if (data?.transcripts && data.transcripts.length > 0) {
      const lastMsg = data.transcripts[data.transcripts.length - 1];
      if (lastMsg.role === 'assistant') {
        speak(lastMsg.content);
      }
    }
  }, [data?.transcripts, speak]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  const handleMicClick = useCallback(() => {
    console.log("Mic button clicked. Listening:", listening, "Using browser speech:", useBrowserSpeech);
    if (listening) {
      // Stop listening and send
      if (useBrowserSpeech) {
        SpeechRecognition.stopListening();
      } else {
        deepgramSpeech.stopListening();
      }
      if (transcript.trim()) {
        handleSubmit(transcript);
      }
    } else {
      // Start listening
      resetTranscript();
      if (useBrowserSpeech) {
        const start = async () => {
          try {
            await SpeechRecognition.startListening({
              continuous: true,
              language: 'en-US'
            });
          } catch (err) {
            console.error("Failed to start browser speech:", err);
          }
        };
        start();
      } else {
        deepgramSpeech.startListening();
      }
    }
  }, [listening, useBrowserSpeech, deepgramSpeech, transcript, resetTranscript]);

  const handleSubmit = useCallback((text: string) => {
    setIsProcessing(true);
    chatMutation.mutate(text, {
      onSettled: () => {
        setIsProcessing(false);
        resetTranscript();
      }
    });
  }, [chatMutation, resetTranscript]);

  const handleEndSimulation = useCallback(() => {
    if (confirm("Are you sure you want to end the simulation and get your score?")) {
      scoreMutation.mutate();
    }
  }, [scoreMutation]);

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

            {data.transcripts.map((msg, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`
                  h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-sm relative
                  ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-emerald-600 border border-slate-200'}
                `}>
                  {msg.role === 'user' ? <User size={20} /> : <Stethoscope size={20} />}
                  {msg.role === 'assistant' && isSpeaking && idx === data.transcripts.length - 1 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 flex items-center justify-center">
                        <div className="flex gap-0.5 items-end h-2">
                          <div className="w-0.5 bg-white animate-[bounce_1s_infinite] h-1"></div>
                          <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.1s] h-2"></div>
                          <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.2s] h-1.5"></div>
                        </div>
                      </span>
                    </span>
                  )}
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
