/**
 * Stable, Non-Flickering Speech Service with Robust Command Debouncing & Continuous Voice Listening
 */

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
  webkitAudioContext?: any;
}

export type VoiceCommandAction = 
  | 'START_NOTES'
  | 'STOP_NOTES'
  | 'TAKE_PHOTO'
  | 'CAPTURE_SCREEN'
  | 'PODCAST_MODE'
  | 'SUMMARIZE'
  | 'UNKNOWN';

export interface SpeechRecognitionHandlers {
  onTranscriptChunk?: (text: string, isFinal: boolean) => void;
  onCommandDetected?: (command: VoiceCommandAction, rawPhrase: string) => void;
  onError?: (err: any) => void;
  onStatusChange?: (isVoiceActive: boolean) => void;
  onAudioLevel?: (level: number) => void;
  onHeardPhrase?: (phrase: string) => void;
}

class SpeechService {
  private recognition: any = null;
  private isVoiceActivationEnabled: boolean = false;
  private isRecordingNotes: boolean = false;
  private handlers: SpeechRecognitionHandlers = {};
  private voices: SpeechSynthesisVoice[] = [];
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: any = null;
  private restartTimeout: any = null;
  private lastCommandTimestamp: number = 0;
  private lastProcessedPhrase: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initRecognition();
      this.initVoices();
    }
  }

  private initVoices() {
    if ('speechSynthesis' in window) {
      const load = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  public initRecognition() {
    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (e) {}
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        // Recognition started
      };

      this.recognition.onend = () => {
        // SILENT AUTO-RECONNECT: If voice activation is enabled, restart smoothly without UI flicker
        if (this.isVoiceActivationEnabled || this.isRecordingNotes) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isVoiceActivationEnabled || this.isRecordingNotes) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore already started
              }
            }
          }, 250);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore normal silence/aborted events
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition notice:', event.error);
        }
        this.handlers.onError?.(event);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const heard = (finalTranscript || interimTranscript).trim();
        if (heard) {
          this.handlers.onHeardPhrase?.(heard);
          this.checkForVoiceCommands(heard);
        }

        if (finalTranscript) {
          this.handlers.onTranscriptChunk?.(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.handlers.onTranscriptChunk?.(interimTranscript.trim(), false);
        }
      };
    } catch (err) {
      console.error('Failed to initialize speech recognition', err);
    }
  }

  /**
   * Check for voice commands with DEBOUNCING to eliminate command flickering
   */
  private checkForVoiceCommands(text: string) {
    const now = Date.now();
    // 2.2 second cooldown between commands
    if (now - this.lastCommandTimestamp < 2200) {
      return;
    }

    const lower = text.toLowerCase().trim();

    // 1. START NOTES TRIGGERS
    if (
      lower.includes('start note') || 
      lower.includes('start notes') || 
      lower.includes('start recording') || 
      lower.includes('begin note') || 
      lower.includes('begin notes') || 
      lower.includes('take note') || 
      lower.includes('take notes') ||
      lower.includes('make note') ||
      lower.includes('make notes')
    ) {
      if (this.lastProcessedPhrase !== 'START_NOTES') {
        this.lastCommandTimestamp = now;
        this.lastProcessedPhrase = 'START_NOTES';
        this.handlers.onCommandDetected?.('START_NOTES', text);
      }
    } 
    // 2. STOP NOTES TRIGGERS
    else if (
      lower.includes('stop note') || 
      lower.includes('stop notes') || 
      lower.includes('stop recording') || 
      lower.includes('finish note') || 
      lower.includes('finish notes') || 
      lower.includes('end note') || 
      lower.includes('end notes') || 
      lower.includes('save note') || 
      lower.includes('save notes') ||
      lower.includes('done note') ||
      lower.includes('done notes')
    ) {
      if (this.lastProcessedPhrase !== 'STOP_NOTES') {
        this.lastCommandTimestamp = now;
        this.lastProcessedPhrase = 'STOP_NOTES';
        this.handlers.onCommandDetected?.('STOP_NOTES', text);
      }
    } 
    // 3. CAMERA / PHOTO TRIGGERS
    else if (
      lower.includes('take photo') || 
      lower.includes('take picture') || 
      lower.includes('capture slide') || 
      lower.includes('snap slide') || 
      lower.includes('capture photo') || 
      lower.includes('snap whiteboard')
    ) {
      this.lastCommandTimestamp = now;
      this.handlers.onCommandDetected?.('TAKE_PHOTO', text);
    } 
    // 4. SCREEN DIAGRAM TRIGGERS
    else if (
      lower.includes('capture screen') || 
      lower.includes('capture diagram') || 
      lower.includes('snap diagram') || 
      lower.includes('save diagram')
    ) {
      this.lastCommandTimestamp = now;
      this.handlers.onCommandDetected?.('CAPTURE_SCREEN', text);
    } 
    // 5. PODCAST MODE TRIGGERS
    else if (
      lower.includes('podcast mode') || 
      lower.includes('start podcast') || 
      lower.includes('play podcast') || 
      lower.includes('open podcast')
    ) {
      this.lastCommandTimestamp = now;
      this.handlers.onCommandDetected?.('PODCAST_MODE', text);
    } 
    // 6. SMART SUMMARY TRIGGERS
    else if (
      lower.includes('smart summary') || 
      lower.includes('summarize lecture')
    ) {
      this.lastCommandTimestamp = now;
      this.handlers.onCommandDetected?.('SUMMARIZE', text);
    }
  }

  public setHandlers(handlers: SpeechRecognitionHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Toggle Voice Activation State (Stable, user-controlled)
   */
  public async setVoiceActivation(enabled: boolean): Promise<boolean> {
    this.isVoiceActivationEnabled = enabled;
    this.handlers.onStatusChange?.(enabled);

    if (enabled) {
      try {
        if (!this.micStream) {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
        if (!this.recognition) {
          this.initRecognition();
        }
        try {
          this.recognition.start();
        } catch (e) {
          // Already running
        }
        this.startAudioMeter();
        return true;
      } catch (err) {
        console.warn("Microphone permission needed:", err);
        this.isVoiceActivationEnabled = false;
        this.handlers.onStatusChange?.(false);
        return false;
      }
    } else {
      if (this.restartTimeout) clearTimeout(this.restartTimeout);
      if (!this.isRecordingNotes && this.recognition) {
        try { this.recognition.stop(); } catch (e) {}
      }
      this.stopAudioMeter();
      return true;
    }
  }

  public getVoiceActivationEnabled(): boolean {
    return this.isVoiceActivationEnabled;
  }

  public startRecordingNotes() {
    this.isRecordingNotes = true;
    this.lastProcessedPhrase = '';
    if (!this.isVoiceActivationEnabled) {
      this.setVoiceActivation(true);
    } else {
      try { this.recognition.start(); } catch (e) {}
    }
  }

  public stopRecordingNotes() {
    this.isRecordingNotes = false;
    this.lastProcessedPhrase = '';
    // Keep voice activation alive if user had it ON
    if (!this.isVoiceActivationEnabled && this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  private async startAudioMeter() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.analyser && this.micStream) {
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      }

      if (!this.audioLevelInterval && this.analyser) {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        this.audioLevelInterval = setInterval(() => {
          if (this.analyser) {
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            this.handlers.onAudioLevel?.(Math.min(100, Math.round(avg * 1.5)));
          }
        }, 100);
      }
    } catch (err) {
      // Audio meter optional
    }
  }

  private stopAudioMeter() {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }

  public speakText(
    text: string,
    options: {
      speaker?: 'Alex' | 'Jordan' | 'David' | 'User';
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): SpeechSynthesisUtterance | null {
    if (!('speechSynthesis' in window)) return null;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const { speaker = 'Alex', rate = 1.0, pitch = 1.0, onBoundary, onEnd, onError } = options;

    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (speaker === 'Alex') {
        const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Alex')));
        if (voice) utterance.voice = voice;
        utterance.pitch = 1.05;
      } else if (speaker === 'Jordan') {
        const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Female')));
        if (voice) utterance.voice = voice;
        utterance.pitch = 1.15;
      } else if (speaker === 'David') {
        const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('Mark')));
        if (voice) utterance.voice = voice;
        utterance.pitch = 0.9;
      }
    }

    if (onBoundary) {
      utterance.onboundary = (e) => {
        onBoundary(e.charIndex);
      };
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    if (onError) {
      utterance.onerror = onError;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public pauseSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const speechService = new SpeechService();
