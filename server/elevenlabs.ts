import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// ElevenLabs client for high-quality text-to-speech
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Cache for TTS audio to improve performance and reduce API calls
const ttsCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100; // Limit cache to 100 entries
const CACHE_KEY_PREFIX = "tts_";

/**
 * Generate a cache key from text
 */
function getCacheKey(text: string, voiceId: string): string {
  return `${CACHE_KEY_PREFIX}${voiceId}_${text.substring(0, 100)}`;
}

/**
 * Add to cache with size limit (LRU-like behavior)
 */
function addToCache(key: string, buffer: Buffer): void {
  if (ttsCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = ttsCache.keys().next().value;
    if (firstKey) {
      ttsCache.delete(firstKey);
    }
  }
  ttsCache.set(key, buffer);
}

/**
 * Generate high-quality text-to-speech using ElevenLabs
 * @param text - The text to convert to speech
 * @param voiceId - Optional voice ID (defaults to professional male voice)
 * @returns Audio buffer in MP3 format
 */
export async function generateTts(
  text: string,
  voiceId: string = "pNInz6obpgDQGcFmaJgB" // Adam - Professional male voice (free tier)
): Promise<Buffer> {
  // Check cache first
  const cacheKey = getCacheKey(text, voiceId);
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    console.log("TTS cache hit");
    return cached;
  }

  try {
    console.log("Generating TTS with ElevenLabs...");
    
    // Generate audio using ElevenLabs with optimized settings
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_turbo_v2_5", // Fastest model with great quality
      voiceSettings: {
        stability: 0.5, // Balanced stability
        similarityBoost: 0.75, // High similarity to voice
        style: 0.0, // Neutral style for professional speech
        useSpeakerBoost: true, // Enhanced clarity
      },
      optimizeStreamingLatency: 3, // Optimize for lower latency
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    const reader = audioStream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(Buffer.from(value));
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    const audioBuffer = Buffer.concat(chunks);
    
    // Cache the result
    addToCache(cacheKey, audioBuffer);
    
    console.log(`TTS generated successfully: ${audioBuffer.length} bytes`);
    return audioBuffer;
    
  } catch (error) {
    console.error("ElevenLabs TTS Error:", error);
    throw new Error("Failed to generate speech with ElevenLabs");
  }
}

/**
 * Clear the TTS cache (useful for memory management)
 */
export function clearTtsCache(): void {
  ttsCache.clear();
  console.log("TTS cache cleared");
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices() {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.voices;
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    return [];
  }
}
