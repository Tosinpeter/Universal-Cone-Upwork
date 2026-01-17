import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface MicrophoneButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicrophoneButton = memo(function MicrophoneButton({
  isListening,
  isProcessing,
  onClick,
  disabled
}: MicrophoneButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple Animation rings when listening */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            <motion.div
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.25 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
          </>
        )}
      </AnimatePresence>

      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2",
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-200"
            : "bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/20",
          (disabled || isProcessing) && "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 hover:bg-slate-300"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>

      <div className="absolute top-24 text-center">
        <p className={cn(
          "text-sm font-medium transition-colors duration-200",
          isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"
        )}>
          {isProcessing ? "Processing response..." : isListening ? "Listening..." : "Tap to Speak"}
        </p>
      </div>
    </div>
  );
});
