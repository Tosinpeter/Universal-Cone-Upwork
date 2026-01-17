import { motion } from "framer-motion";
import { memo } from "react";

export const AudioWaveform = memo(function AudioWaveform({ active }: { active: boolean }) {
  const bars = [1, 2, 3, 4, 5, 4, 3, 2, 1];

  return (
    <div className="flex items-center gap-1 h-8">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={active ? {
            height: [4, 16 + Math.random() * 16, 4],
          } : {
            height: 4
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.05,
          }}
          className={`w-1 rounded-full ${active ? 'bg-primary' : 'bg-slate-300'}`}
        />
      ))}
    </div>
  );
});
