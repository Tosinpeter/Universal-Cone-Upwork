/**
 * Audio Compatibility Utilities for iOS and other browsers
 * Handles device-specific audio quirks and provides fallbacks
 */

/**
 * Detect if running on iOS device
 */
export function isIOS(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Detect if running on Safari
 */
export function isSafari(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
}

/**
 * Check if site is running on HTTPS (required for mic access on iOS)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Get supported audio MIME type for MediaRecorder
 * Tests various formats and returns the first supported one
 */
export function getSupportedAudioMimeType(): string {
  // Order of preference
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
    '' // Empty string means browser will choose default
  ];
  
  for (const type of types) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return ''; // Fallback to browser default
}

/**
 * Get audio constraints optimized for the current device
 */
export function getOptimizedAudioConstraints(): MediaTrackConstraints {
  const ios = isIOS();
  
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    // iOS prefers 44100 or 48000, others can handle 16000
    sampleRate: ios ? 48000 : 16000,
    // Some iOS devices benefit from specifying channel count
    channelCount: 1,
  };
}

/**
 * Check if microphone access is available
 */
export async function checkMicrophoneAvailability(): Promise<{
  available: boolean;
  error?: string;
}> {
  // Check if MediaDevices API exists
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      available: false,
      error: 'Your browser does not support audio recording. Please use a modern browser like Safari, Chrome, or Firefox.'
    };
  }

  // Check if running in secure context on iOS
  if (isIOS() && !isSecureContext()) {
    return {
      available: false,
      error: 'Microphone access requires HTTPS on iOS devices. Please access this site via HTTPS.'
    };
  }

  // Check if MediaRecorder is supported
  if (typeof MediaRecorder === 'undefined') {
    return {
      available: false,
      error: 'Audio recording is not supported on this device.'
    };
  }

  try {
    // Try to enumerate devices to check permissions
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudioInput = devices.some(device => device.kind === 'audioinput');
    
    if (!hasAudioInput) {
      return {
        available: false,
        error: 'No microphone found. Please connect a microphone and try again.'
      };
    }

    return { available: true };
  } catch (err) {
    console.error('Error checking microphone availability:', err);
    return {
      available: false,
      error: 'Could not check microphone availability. Please check your browser settings.'
    };
  }
}

/**
 * Request microphone permission with user-friendly error handling
 */
export async function requestMicrophonePermission(): Promise<{
  granted: boolean;
  stream?: MediaStream;
  error?: string;
}> {
  try {
    const constraints = {
      audio: getOptimizedAudioConstraints(),
      video: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { granted: true, stream };
  } catch (err: any) {
    console.error('Microphone permission error:', err);

    let errorMessage = 'Could not access microphone. ';

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage += 'Please allow microphone access in your browser settings.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage += 'No microphone found. Please connect a microphone.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage += 'Microphone is being used by another application. Please close other apps using the microphone.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage += 'Microphone does not meet the required specifications.';
    } else if (err.name === 'SecurityError') {
      errorMessage += isIOS() 
        ? 'Please access this site via HTTPS to use the microphone on iOS.'
        : 'Security settings prevent microphone access.';
    } else {
      errorMessage += `Error: ${err.message || 'Unknown error'}`;
    }

    return { granted: false, error: errorMessage };
  }
}

/**
 * Log device information for debugging
 */
export async function logAudioDebugInfo(): Promise<void> {
  console.log('=== Audio Debug Info ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('Is iOS:', isIOS());
  console.log('Is Safari:', isSafari());
  console.log('Is Secure Context:', isSecureContext());
  console.log('Supported MIME Type:', getSupportedAudioMimeType());
  console.log('Has MediaDevices:', !!navigator.mediaDevices);
  console.log('Has getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
  console.log('Has MediaRecorder:', typeof MediaRecorder !== 'undefined');

  if (typeof MediaRecorder !== 'undefined') {
    const testTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    console.log('MediaRecorder support:');
    testTypes.forEach(type => {
      console.log(`  ${type}:`, MediaRecorder.isTypeSupported(type));
    });
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    console.log('Audio input devices:', audioInputs.length);
  } catch (err) {
    console.log('Could not enumerate devices:', err);
  }
  console.log('=======================');
}
