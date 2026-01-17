/**
 * Optimized Audio Playback Utility
 * Handles TTS audio playback with caching and performance optimizations
 */

import { startMeasure } from './performance';

// Audio cache to avoid re-fetching the same TTS audio
const audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

// Currently playing audio instance
let currentAudio: HTMLAudioElement | null = null;

/**
 * Generate a cache key from text
 */
function getCacheKey(text: string): string {
  return `audio_${text.substring(0, 100)}`;
}

/**
 * Add to cache with size limit (LRU-like behavior)
 */
function addToCache(key: string, url: string): void {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      const oldUrl = audioCache.get(firstKey);
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      audioCache.delete(firstKey);
    }
  }
  audioCache.set(key, url);
}

/**
 * Clear audio cache and revoke object URLs
 */
export function clearAudioCache(): void {
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
}

/**
 * Stop currently playing audio
 */
export function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Also cancel any web speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play text as speech using optimized TTS with caching
 */
export async function playTextToSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  const endMeasure = startMeasure('TTS Playback');
  
  try {
    // Stop any currently playing audio
    stopCurrentAudio();

    // Check cache first
    const cacheKey = getCacheKey(text);
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      // Fetch from API if not cached
      const fetchMeasure = startMeasure('TTS API Fetch');
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await response.blob();
      fetchMeasure();
      
      audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL
      addToCache(cacheKey, audioUrl);
      console.log('🔊 TTS audio fetched and cached');
    } else {
      console.log('⚡ TTS cache hit - instant playback');
    }

    // Create and play audio
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    // Optimize audio playback
    audio.preload = "auto";
    
    audio.onloadeddata = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      endMeasure();
      if (onEnd) onEnd();
      currentAudio = null;
    };

    audio.onerror = () => {
      endMeasure();
      const error = new Error("Audio playback failed");
      if (onError) onError(error);
      currentAudio = null;
      
      // Fallback to browser TTS if API TTS fails
      fallbackToBrowserTTS(text, onStart, onEnd);
    };

    await audio.play();
  } catch (err) {
    endMeasure();
    console.error("TTS Error:", err);
    const error = err instanceof Error ? err : new Error("Unknown TTS error");
    if (onError) onError(error);
    
    // Fallback to browser TTS
    fallbackToBrowserTTS(text, onStart, onEnd);
  }
}

/**
 * Fallback to browser's Web Speech API if TTS API fails
 */
function fallbackToBrowserTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      if (onStart) onStart();
    };
    
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Browser TTS not supported");
    if (onEnd) onEnd();
  }
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * Preload audio for text (background fetch)
 */
export async function preloadAudio(text: string): Promise<void> {
  const cacheKey = getCacheKey(text);
  
  // Skip if already cached
  if (audioCache.has(cacheKey)) {
    return;
  }

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      addToCache(cacheKey, audioUrl);
    }
  } catch (err) {
    console.warn("Failed to preload audio:", err);
  }
}
