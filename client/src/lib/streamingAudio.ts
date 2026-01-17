/**
 * Streaming Audio Utility
 * Handles progressive audio streaming for better perceived performance
 */

interface StreamingAudioOptions {
  onProgress?: (loaded: number, total: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Play audio with streaming support
 * This allows audio to start playing before the entire file is downloaded
 */
export async function playStreamingAudio(
  text: string,
  options: StreamingAudioOptions = {}
): Promise<void> {
  const { onProgress, onStart, onEnd, onError } = options;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("TTS request failed");
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Read stream progressively
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Stream not available");
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    // Read all chunks
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      if (value) {
        chunks.push(value);
        loaded += value.length;
        
        if (onProgress && total > 0) {
          onProgress(loaded, total);
        }
      }
    }

    // Create blob and play
    const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    
    audio.onloadeddata = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      const error = new Error("Audio playback failed");
      if (onError) onError(error);
    };

    await audio.play();
  } catch (err) {
    console.error("Streaming audio error:", err);
    const error = err instanceof Error ? err : new Error("Unknown streaming error");
    if (onError) onError(error);
  }
}

/**
 * Prefetch audio data without playing
 * Useful for preloading upcoming audio
 */
export async function prefetchAudio(text: string): Promise<Blob | null> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.blob();
  } catch (err) {
    console.warn("Prefetch failed:", err);
    return null;
  }
}
