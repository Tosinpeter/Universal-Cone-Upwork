# iOS Speech-to-Text Fix Documentation

## Problem Summary

Speech-to-text was not working on iPhone devices due to:
1. **Codec incompatibility**: iOS Safari doesn't support `audio/webm;codecs=opus` format
2. **Sample rate issues**: iOS prefers 44.1kHz or 48kHz sample rates
3. **Web Speech API limitations**: The browser's Web Speech API is unreliable on iOS
4. **Missing error handling**: No user-friendly error messages for microphone access issues

## Changes Made

### 1. New Audio Compatibility Utility (`client/src/lib/audioCompat.ts`)
Created a comprehensive utility module for handling cross-device audio compatibility:

- **`getSupportedAudioMimeType()`**: Auto-detects supported audio formats
  - Tests formats in order: webm/opus → webm → mp4 → wav → browser default
  - Returns the first supported format for the device

- **`getOptimizedAudioConstraints()`**: Device-specific audio settings
  - iOS: 48kHz sample rate (preferred by iOS)
  - Other devices: 16kHz (optimal for speech recognition)
  - Enables echo cancellation, noise suppression, and auto gain control

- **`requestMicrophonePermission()`**: Improved permission handling
  - Provides detailed error messages for different failure scenarios
  - Handles iOS-specific security requirements (HTTPS)

- **`checkMicrophoneAvailability()`**: Pre-flight checks
  - Verifies MediaDevices API support
  - Checks for secure context (HTTPS) on iOS
  - Validates microphone hardware presence

- **`logAudioDebugInfo()`**: Debugging helper
  - Logs device capabilities
  - Shows supported MIME types
  - Displays available audio input devices

### 2. Updated Simulation Component (`client/src/pages/Simulation.tsx`)

#### Deepgram Speech Hook Improvements:
- Uses `getSupportedAudioMimeType()` for automatic format detection
- Uses `getOptimizedAudioConstraints()` for device-specific audio settings
- Uses `requestMicrophonePermission()` for better error handling
- Logs debug info on iOS devices for troubleshooting
- Added toast notifications for user-friendly error messages

#### iOS Device Detection:
- Automatically uses Deepgram WebSocket for iOS devices
- Browser Web Speech API is now avoided on iOS due to reliability issues
- Logs which speech recognition method is being used

### 3. Updated Voice Recorder Hook (`client/replit_integrations/audio/useVoiceRecorder.ts`)
- Added automatic MIME type detection
- Optimized audio constraints for iOS (48kHz) vs other devices (16kHz)
- Added error logging for MediaRecorder issues
- Uses actual recorder MIME type when creating audio blob

### 4. Updated Deepgram Server Config (`server/deepgram.ts`)
- Removed hardcoded encoding to allow auto-detection
- Deepgram now automatically detects audio format from stream
- Supports webm, mp4, wav, and other formats seamlessly

## How It Works

### iOS Audio Flow:
1. User taps microphone button
2. System detects iOS device
3. Logs debug information (device capabilities)
4. Requests microphone permission with iOS-optimized constraints (48kHz)
5. Determines supported MIME type (likely mp4 on iOS)
6. Creates MediaRecorder with supported format
7. Streams audio to Deepgram via WebSocket
8. Deepgram auto-detects format and transcribes
9. Transcript displayed in real-time

### Non-iOS Audio Flow:
1. User clicks microphone button
2. Checks if Web Speech API is supported
3. If supported: Uses browser's native speech recognition
4. If not supported: Falls back to Deepgram WebSocket (similar to iOS flow)

## Testing on iPhone

### Prerequisites:
1. **HTTPS is REQUIRED**: iOS Safari requires HTTPS for microphone access
   - If testing locally, use ngrok or similar tunneling service
   - Production: Ensure site is served over HTTPS

2. **Microphone permissions**: First use will prompt for permission

### Testing Steps:
1. Open Safari on iPhone
2. Navigate to the application URL (must be HTTPS)
3. Start a simulation
4. Tap the microphone button
5. Grant microphone permission when prompted
6. Speak clearly into the microphone
7. Verify transcript appears in real-time
8. Tap microphone button again to stop and submit

### Expected Console Logs (iOS):
```
=== Audio Debug Info ===
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS...)
Is iOS: true
Is Safari: true
Is Secure Context: true
Supported MIME Type: audio/mp4
Has MediaDevices: true
Has getUserMedia: true
Has MediaRecorder: true
MediaRecorder support:
  audio/webm;codecs=opus: false
  audio/webm: false
  audio/mp4: true
  audio/wav: false
Audio input devices: 1
=======================
Speech recognition method: Deepgram WebSocket
iOS device: true
Deepgram WebSocket connected
MediaRecorder created with MIME type: audio/mp4
```

### Troubleshooting Guide:

#### "Microphone access denied"
- **Cause**: User denied permission or permission was previously blocked
- **Solution**: Go to Settings → Safari → (your site) → Microphone → Allow

#### "Please access this site via HTTPS"
- **Cause**: Site is accessed via HTTP
- **Solution**: Use HTTPS or set up ngrok for local testing

#### "No microphone found"
- **Cause**: Device has no microphone (unlikely on iPhone)
- **Solution**: Test on actual iPhone device, not simulator

#### "Microphone is being used by another application"
- **Cause**: Another app is using the microphone
- **Solution**: Close other apps (Siri, voice recorder, etc.)

#### Transcript not appearing:
- **Cause**: WebSocket connection issue or Deepgram API key missing
- **Solution**: Check console logs, verify DEEPGRAM_API_KEY in environment

## Browser Compatibility

### Fully Supported:
- ✅ iOS Safari 14+
- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Edge (desktop & mobile)
- ✅ Safari (macOS)

### Format Support by Browser:
| Browser | Preferred Format |
|---------|-----------------|
| Chrome | audio/webm;codecs=opus |
| Firefox | audio/webm;codecs=opus |
| Safari (macOS) | audio/mp4 |
| Safari (iOS) | audio/mp4 |
| Edge | audio/webm;codecs=opus |

## Performance Improvements

1. **iOS optimized sample rate**: 48kHz for better quality on iOS
2. **Auto format detection**: No failed attempts with unsupported formats
3. **Better error handling**: Immediate user feedback instead of silent failures
4. **Debug logging**: Easy troubleshooting on iOS devices

## Additional Notes

### Why Deepgram for iOS instead of Web Speech API?
- Web Speech API on iOS Safari is unreliable and often doesn't work
- Requires internet connection which iOS users typically have
- Deepgram provides better accuracy and consistency
- Works across all iOS devices uniformly

### Security Considerations:
- iOS requires HTTPS for microphone access (enforced by browser)
- Microphone permission is persistent after first grant
- Audio data is streamed in real-time, not stored on device
- WebSocket connection is secure (WSS) when using HTTPS

### Future Enhancements:
- [ ] Add offline mode with on-device speech recognition
- [ ] Implement audio quality indicators
- [ ] Add network quality detection
- [ ] Provide bandwidth-adaptive streaming

## Quick Reference

### Test Commands:
```bash
# Check if HTTPS is enabled
curl -I https://your-domain.com

# View real-time logs (if using ngrok)
ngrok http 3000 --log=stdout

# Check Deepgram API key
echo $DEEPGRAM_API_KEY
```

### Key Files Modified:
- ✅ `client/src/lib/audioCompat.ts` (new)
- ✅ `client/src/pages/Simulation.tsx`
- ✅ `client/replit_integrations/audio/useVoiceRecorder.ts`
- ✅ `server/deepgram.ts`

## Support

For iOS-specific audio issues, check console logs with the debug info that automatically logs on iOS devices. The detailed device capabilities will help identify the issue.
