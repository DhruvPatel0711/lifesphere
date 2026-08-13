import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../utils/api';

/**
 * "Hey LifeSphere" — Always-on wake word voice assistant.
 * 
 * States:
 *   idle        → mic not yet enabled (needs one-time click)
 *   passive     → continuously listening for "hey lifesphere" wake word
 *   active      → wake word detected, capturing command
 *   processing  → sending command to backend AI
 */
const VoiceLogger = ({ onLogSuccess, onAction }) => {
  const [state, setState] = useState('idle'); // idle | passive | active | processing
  const [command, setCommand] = useState('');
  const [interimText, setInterimText] = useState('');
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const commandTimeoutRef = useRef(null);
  const isStoppedManuallyRef = useRef(false);
  const wakeDetectedRef = useRef(false);
  const stateRef = useRef('idle');
  const startListeningRef = useRef(null);
  const isEnabledRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Keep stateRef in sync so callbacks can read the latest state
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Audio feedback: subtle chime when wake word detected ──
  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio not supported, silent fallback
    }
  }, []);

  // ── Text-to-Speech (TTS) ──
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;
    
    // Clean markdown formatting symbols for smooth natural speech
    const cleanText = text
      .replace(/[*#_`~>•-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Reset SpeechSynthesis queue to unfreeze Chromium engine
    try { window.speechSynthesis.cancel(); } catch (e) {}

    isSpeakingRef.current = true;
    
    // Stop listening temporarily to avoid echo loop
    if (recognitionRef.current) {
      isStoppedManuallyRef.current = true;
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select clear English voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(
        (v) => (v.lang.includes('en') || v.lang.includes('EN')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('David'))
      ) || voices.find((v) => v.lang.includes('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    
    const handleSpeechEnd = () => {
      isSpeakingRef.current = false;
      if (isEnabledRef.current && startListeningRef.current) {
        setTimeout(() => {
          isStoppedManuallyRef.current = false;
          startListeningRef.current();
        }, 300);
      }
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      handleSpeechEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Process voice command through backend AI ──
  const processVoiceCommand = useCallback(async (text, isAiChat = false) => {
    if (text !== 'code red') {
      setState('processing');
      setCommand(text);
    }
    try {
      // If "Hey AI" was used, send directly to AI chat
      if (isAiChat) {
        if (onAction) {
          onAction({
            target_feature: 'ai-chat',
            action_name: 'send_message',
            data: { message: text }
          });
        }
        return;
      }

      const res = await API.post('/trackers/voice-log', { text });
      
      if (res.type === 'action' && res.success) {
        const replyMessage = res.data?.text || res.message || "Action completed successfully.";
        speakText(replyMessage);
        if (onAction) {
          onAction({
            target_feature: res.target_feature,
            action_name: res.action_name,
            data: res.data || {}
          });
        }
      } else if (res.success) {
        const replyMessage = res.message || "Logged successfully.";
        speakText(replyMessage);
        if (onLogSuccess) onLogSuccess(replyMessage);
      } else {
        const errMsg = res.message || "Failed to process voice command.";
        speakText(errMsg);
      }
    } catch (err) {
      console.error(err);
      speakText("Sorry, I encountered an error processing your voice command.");
    } finally {
      if (isEnabledRef.current) {
        setState('passive');
        setCommand('');
        setInterimText('');
        wakeDetectedRef.current = false;
        wakeTypeRef.current = null;
        if (startListeningRef.current) {
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              isStoppedManuallyRef.current = false;
              startListeningRef.current();
            }
          }, 300);
        }
      } else {
        setState('idle');
        setCommand('');
        setInterimText('');
        wakeDetectedRef.current = false;
        wakeTypeRef.current = null;
      }
    }
  }, [onAction, onLogSuccess, speakText]);

  // ── Universal Wake Word & Direct Command Detection ──
  const wakeTypeRef = useRef(null);
  const detectWakeWord = useCallback((text) => {
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (!normalized) return { detected: false, command: '', wakeType: null };
    
    // Check for "Hey AI" / "AI"
    const aiPatterns = ['hey ai', 'hey a i', 'a ai', 'hello ai', 'hello a i', 'hey google', 'hey siri', 'hey alexa'];
    for (const pattern of aiPatterns) {
      const idx = normalized.indexOf(pattern);
      if (idx !== -1) {
        const afterWake = normalized.substring(idx + pattern.length).trim();
        return { detected: true, command: afterWake || normalized, wakeType: 'ai' };
      }
    }
    
    // Check for "Hey Jarvis" / "LifeSphere" / "Jarvis" / Universal Wake Words
    const jarvisPatterns = [
      'hey jarvis', 'hello jarvis', 'hi jarvis', 'a jarvis', 'jarvis',
      'hey lifesphere', 'hello lifesphere', 'hi lifesphere', 'lifesphere',
      'hey travis', 'hello travis', 'hey garvis', 'hello garvis',
      'hay jarvis', 'travis', 'garvis', 'listen', 'computer'
    ];
    for (const pattern of jarvisPatterns) {
      const idx = normalized.indexOf(pattern);
      if (idx !== -1) {
        const afterWake = normalized.substring(idx + pattern.length).trim();
        return { detected: true, command: afterWake || normalized, wakeType: 'siri' };
      }
    }

    // Silent SOS
    const silentPatterns = ['code red', 'silent emergency', 'emergency sos'];
    for (const pattern of silentPatterns) {
      const idx = normalized.indexOf(pattern);
      if (idx !== -1) {
        return { detected: true, command: 'code red', wakeType: 'silent' };
      }
    }

    // UNIVERSAL VOICE ACCEPTOR: If active state (clicked mic), ANY spoken text is accepted!
    if (stateRef.current === 'active' || wakeDetectedRef.current) {
      return { detected: true, command: normalized, wakeType: 'siri' };
    }

    return { detected: false, command: '', wakeType: null };
  }, []);

  // ── Initialize and start continuous recognition ──
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    isEnabledRef.current = true;

    // Clean up existing instance
    if (recognitionRef.current) {
      isStoppedManuallyRef.current = true;
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isStoppedManuallyRef.current = false;
      if (stateRef.current === 'idle' || stateRef.current === 'processing') {
        // Don't override processing state
        if (stateRef.current !== 'processing') {
          setState('passive');
        }
      }
    };

    recognition.onresult = (event) => {
      // Build full transcript from all results
      let finalText = '';
      let interimTextLocal = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimTextLocal += result[0].transcript;
        }
      }

      const fullText = (finalText + interimTextLocal).trim();
      setInterimText(interimTextLocal);

      // If we already detected wake word and are collecting the command
      if (wakeDetectedRef.current) {
        // Check final results for the full command
        if (finalText.trim()) {
          const wake = detectWakeWord(finalText.trim());
          const cmd = wake.detected ? wake.command : finalText.trim();
          if (cmd.length > 2) {
            // Clear timeout and process
            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
            isStoppedManuallyRef.current = true;
            try { recognition.stop(); } catch(e) {}
            processVoiceCommand(cmd, wakeTypeRef.current === 'ai');
          }
        }
        return;
      }

      // Check for wake word in the full text
      const wakeResult = detectWakeWord(fullText);
      if (wakeResult.detected) {
        wakeDetectedRef.current = true;
        wakeTypeRef.current = wakeResult.wakeType;
        
        if (wakeResult.wakeType !== 'silent') {
          setState('active');
          playChime();
        }

        // If there's already a command after the wake word in final text
        if (wakeResult.command.length > 2 && finalText.trim()) {
          isStoppedManuallyRef.current = true;
          try { recognition.stop(); } catch(e) {}
          processVoiceCommand(wakeResult.command, wakeResult.wakeType === 'ai');
          return;
        }

        // Set a timeout — if no command follows within 5 seconds, go back to passive
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
          wakeDetectedRef.current = false;
          wakeTypeRef.current = null;
          setState('passive');
          setInterimText('');
          isStoppedManuallyRef.current = true;
          try { recognition.stop(); } catch(e) {}
          setTimeout(() => startListening(), 200);
        }, 5000);
      }
    };

    recognition.onerror = (event) => {
    if (event.error === 'aborted' || event.error === 'no-speech') {
      return;
    }
    if (event.error === 'audio-capture' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      console.warn("Microphone access unavailable or denied:", event.error);
      isEnabledRef.current = false;
      isStoppedManuallyRef.current = true;
      setState('idle');
      setInterimText('');
      wakeDetectedRef.current = false;
      setShowMicPermissionModal(true);
      return;
    }
    console.warn("Speech recognition notice:", event.error);
  };

    recognition.onend = () => {
      // Auto-restart unless manually stopped or processing
      if (isEnabledRef.current && !isStoppedManuallyRef.current && stateRef.current !== 'processing') {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== 'active') {
            wakeDetectedRef.current = false;
          }
          startListening();
        }, 300);
      }
    };

    startListeningRef.current = startListening;
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      // Retry after a delay
      setTimeout(() => startListening(), 1000);
    }
  }, [detectWakeWord, playChime, processVoiceCommand]);

  // ── Proactive Reminders ──
  useEffect(() => {
    let reminderPlayed = false;
    
    // 1-minute test mode timer
    const testTimer = setTimeout(() => {
      if (isEnabledRef.current && !isSpeakingRef.current) {
        playChime();
        speakText("Hey Gaurav, this is your test mode reminder. It's time to take your blood pressure medication.");
        reminderPlayed = true;
      }
    }, 60000); // 1 minute

    const interval = setInterval(() => {
      const now = new Date();
      // Real reminder at 2:00 PM
      if (now.getHours() === 14 && now.getMinutes() === 0 && !reminderPlayed) {
        if (isEnabledRef.current && !isSpeakingRef.current) {
          playChime();
          speakText("Hey Gaurav, it's 2 PM. Time to take your blood pressure medication.");
          reminderPlayed = true;
        }
      }
      
      // Reset reminder flag at midnight
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        reminderPlayed = false;
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearTimeout(testTimer);
      clearInterval(interval);
    };
  }, [playChime, speakText]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      isStoppedManuallyRef.current = true;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  // ── Enable / disable always-on listening ──
  const toggleAlwaysOn = () => {
    if (state === 'idle') {
      wakeDetectedRef.current = true;
      setState('active');
      playChime();
      startListening();
    } else {
      // Turn off
      isEnabledRef.current = false;
      isStoppedManuallyRef.current = true;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setState('idle');
      wakeDetectedRef.current = false;
      setInterimText('');
      setCommand('');
    }
  };

  // ── Determine visual styling based on state ──
  const getButtonStyle = () => {
    const base = {
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      color: 'white',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
    };
    switch (state) {
      case 'idle':
        return { ...base, background: 'linear-gradient(135deg, #64748b, #475569)', boxShadow: '0 4px 15px rgba(100, 116, 139, 0.3)' };
      case 'passive':
        return { ...base, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', animation: 'breathe 3s ease-in-out infinite' };
      case 'active':
        return { ...base, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)', animation: 'activePulse 1s infinite' };
      case 'processing':
        return { ...base, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' };
      default:
        return base;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'idle': return 'Click to enable voice';
      case 'passive': return 'Say "Hey Jarvis" or "Hey AI" ...';
      case 'active': return interimText ? `Hearing: "${interimText}"` : 'Listening for command...';
      case 'processing': return `Processing: "${command}"`;
      default: return '';
    }
  };

  const getStatusDot = () => {
    switch (state) {
      case 'passive': return '#10b981';
      case 'active': return '#3b82f6';
      case 'processing': return '#f59e0b';
      default: return 'transparent';
    }
  };

  return (
    <>
      {/* Fixed bottom-right floating assistant */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '90px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}>
        {/* Status tooltip — shown when not idle */}
        {state !== 'idle' && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#f1f5f9',
            padding: '10px 16px',
            borderRadius: '14px',
            fontSize: '0.82rem',
            fontWeight: 500,
            maxWidth: '280px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeSlideUp 0.3s ease',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: getStatusDot(),
              flexShrink: 0,
              animation: state === 'active' ? 'activePulse 1s infinite' : state === 'passive' ? 'breathe 2s infinite' : 'none',
            }} />
            {getStatusText()}
          </div>
        )}

        {/* Main button */}
        <button onClick={toggleAlwaysOn} style={getButtonStyle()} title={getStatusText()}>
          {state === 'processing' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : state === 'active' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          )}

          {/* Outer ring animation for active/passive states */}
          {(state === 'passive' || state === 'active') && (
            <span style={{
              position: 'absolute',
              top: '-4px', left: '-4px', right: '-4px', bottom: '-4px',
              borderRadius: '50%',
              border: `2px solid ${state === 'active' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.3)'}`,
              animation: state === 'active' ? 'ringPulse 1.5s infinite' : 'breatheRing 3s ease-in-out infinite',
            }} />
          )}
        </button>
      </div>

      {/* Visual Microphone Permission Denied Modal */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-5 relative">
            <button
              onClick={() => setShowMicPermissionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">mic_off</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Microphone Access Required</h3>
                <p className="text-xs text-slate-400">Microphone permission is blocked or not granted.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200">How to enable microphone access:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click the <strong className="text-white">lock icon 🔒</strong> or <strong className="text-white">tune icon 🎙️</strong> in your browser address bar.</li>
                <li>Set <strong className="text-emerald-400">Microphone</strong> to <strong className="text-white">Allow</strong>.</li>
                <li>Click <strong className="text-blue-400">Try Again</strong> below to start voice assistant.</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowMicPermissionModal(false);
                  toggleAlwaysOn();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all border-none cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowMicPermissionModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition-colors border-none cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.85; }
        }
        @keyframes breatheRing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }
        @keyframes activePulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default VoiceLogger;
