# iOS Speech-to-Text Testing Checklist

## Pre-Testing Setup

### Environment Variables
- [ ] `DEEPGRAM_API_KEY` is set in environment
- [ ] Application is deployed or accessible via HTTPS
- [ ] WebSocket connections are not blocked by firewall

### HTTPS Setup (Required for iOS)
Choose one option:

#### Option A: Production Deployment
- [ ] Deploy to hosting service (Vercel, Netlify, Railway, etc.)
- [ ] Verify HTTPS is enabled
- [ ] Test URL is accessible

#### Option B: Local Testing with ngrok
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Create HTTPS tunnel
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```
- [ ] ngrok installed and running
- [ ] HTTPS URL obtained
- [ ] URL is accessible from iPhone

## Testing on iPhone

### Device Requirements
- [ ] iPhone running iOS 14 or later
- [ ] Safari browser (required - Chrome/Firefox won't work for mic on iOS)
- [ ] Microphone not being used by other apps
- [ ] Not in Silent/Do Not Disturb mode (for audio playback)

### Step-by-Step Test

#### 1. Initial Access
- [ ] Open Safari on iPhone
- [ ] Navigate to HTTPS URL
- [ ] Page loads successfully
- [ ] No security warnings

#### 2. Start Simulation
- [ ] Tap "Start New Simulation"
- [ ] Simulation page loads
- [ ] Chat interface is visible
- [ ] Microphone button is visible and enabled

#### 3. First Microphone Use
- [ ] Tap microphone button
- [ ] Browser prompts for microphone permission
- [ ] Grant permission
- [ ] Microphone button turns red
- [ ] "Listening..." text appears
- [ ] Audio waveform is visible (if implemented)

#### 4. Speech Recording
- [ ] Speak clearly: "Hello, my knee hurts"
- [ ] Transcript appears in real-time
- [ ] Words are spelled correctly (mostly)
- [ ] No significant delay (< 2 seconds)

#### 5. Submit Transcript
- [ ] Tap microphone button again to stop
- [ ] Transcript is sent to chat
- [ ] User message appears in chat
- [ ] "Processing response..." indicator shows
- [ ] Dr. Hayes responds with text
- [ ] Audio response plays automatically

#### 6. Second Recording
- [ ] Tap microphone button again
- [ ] No permission prompt (already granted)
- [ ] Recording starts immediately
- [ ] Speak: "The pain is in my left knee"
- [ ] Transcript appears
- [ ] Stop and submit
- [ ] Response received

#### 7. Multiple Recordings
- [ ] Test 5-10 more recordings
- [ ] Each recording works consistently
- [ ] No memory leaks (page doesn't slow down)
- [ ] Audio continues to play correctly

#### 8. Edge Cases
- [ ] Test very short utterance (1-2 words)
- [ ] Test long utterance (30+ seconds)
- [ ] Test silence (no speech)
- [ ] Test background noise
- [ ] Test accented speech
- [ ] Test medical terminology

## Console Debugging (Optional but Recommended)

### Setup Web Inspector
1. On iPhone: Settings → Safari → Advanced → Enable "Web Inspector"
2. Connect iPhone to Mac via USB
3. On Mac: Safari → Develop → [Your iPhone] → [Your Site]
4. Console tab opens

### Expected Console Messages
```
Speech recognition method: Deepgram WebSocket
iOS device: true
=== Audio Debug Info ===
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...
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
Deepgram WebSocket connected
MediaRecorder created with MIME type: audio/mp4
```

### Red Flags in Console
- ❌ `getUserMedia error`
- ❌ `MediaRecorder is not supported`
- ❌ `WebSocket connection failed`
- ❌ `DEEPGRAM_API_KEY not found`
- ❌ `HTTPS required`

## Error Scenarios Testing

### Test Each Error Condition:

#### 1. Permission Denied
- [ ] Tap microphone button
- [ ] Deny permission in prompt
- [ ] Toast notification appears: "Please allow microphone access..."
- [ ] Clear message explains how to fix

#### 2. Re-enable Permission
- [ ] Go to iPhone Settings
- [ ] Settings → Safari → [Your Site]
- [ ] Enable Microphone
- [ ] Return to app
- [ ] Tap microphone button
- [ ] Recording now works

#### 3. Microphone in Use
- [ ] Open Voice Memos app
- [ ] Start a recording
- [ ] Switch back to your app
- [ ] Tap microphone button
- [ ] Error message appears: "Microphone is being used..."

#### 4. Network Issues
- [ ] Enable Airplane Mode
- [ ] Tap microphone button
- [ ] Error message appears
- [ ] Disable Airplane Mode
- [ ] Try again - should work

## Performance Testing

### Check for:
- [ ] First recording starts within 2 seconds
- [ ] Subsequent recordings start within 1 second
- [ ] Transcript appears within 2 seconds of speaking
- [ ] No noticeable lag or freezing
- [ ] Audio playback starts immediately
- [ ] Page remains responsive after 10+ recordings

## Browser Testing Matrix

### iOS Safari (Primary)
- [ ] iPhone Safari - Tested ✅
- [ ] iPad Safari - Tested (optional)

### iOS Other Browsers (Supplementary)
Note: These use Safari engine on iOS, so should work the same
- [ ] iPhone Chrome - Tested (optional)
- [ ] iPhone Firefox - Tested (optional)

## Production Verification

After passing all tests above:

- [ ] Test on multiple iPhone models if available
  - [ ] iPhone SE / older model
  - [ ] iPhone 12-14 / mid-range
  - [ ] iPhone 15+ / latest
- [ ] Test on different iOS versions
  - [ ] iOS 14-15 (if accessible)
  - [ ] iOS 16-17 (current)
  - [ ] iOS 18 beta (if available)
- [ ] Test with different network conditions
  - [ ] WiFi
  - [ ] 5G/LTE
  - [ ] 3G (slow network)
- [ ] Test in different locations
  - [ ] Quiet room
  - [ ] Noisy environment
  - [ ] Outdoors

## Sign-Off

Once all items are checked:

### Functionality
- [ ] Microphone permission works
- [ ] Recording starts and stops correctly
- [ ] Transcript appears in real-time
- [ ] Responses are received
- [ ] Audio playback works
- [ ] Multiple recordings work consistently

### User Experience
- [ ] Error messages are clear and helpful
- [ ] UI is responsive
- [ ] No crashes or freezes
- [ ] Audio quality is acceptable
- [ ] Transcript accuracy is acceptable (>80%)

### Technical
- [ ] Console shows correct device detection
- [ ] Correct MIME type is used (audio/mp4 on iOS)
- [ ] WebSocket connection is stable
- [ ] No memory leaks observed
- [ ] Performance is acceptable

## Final Approval

**Tested By:** ___________________  
**Date:** ___________________  
**Device:** iPhone ___, iOS ___  
**Result:** ⭐️ Pass / ❌ Fail  

**Notes:**
_________________________________
_________________________________
_________________________________

---

## Quick Test (Minimum Viable)

If time is limited, at minimum test these:

1. [ ] Open app on iPhone Safari over HTTPS
2. [ ] Start simulation
3. [ ] Tap microphone button
4. [ ] Grant permission
5. [ ] Speak: "My knee hurts"
6. [ ] Verify transcript appears
7. [ ] Stop recording
8. [ ] Verify response is received
9. [ ] Verify audio plays

If all 9 steps pass, the core functionality is working! ✅
