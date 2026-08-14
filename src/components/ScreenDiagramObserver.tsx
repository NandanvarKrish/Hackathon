import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, 
  Sparkles, 
  Camera, 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  Scan, 
  RefreshCw, 
  Eye, 
  Layers 
} from 'lucide-react';
import { LectureMedia } from '../types/notes';
import { analyzeLectureImage } from '../services/geminiService';
import { useAccessibility } from '../context/AccessibilityContext';

interface ScreenDiagramObserverProps {
  onDiagramCaptured: (media: LectureMedia) => void;
  currentTimestamp: number;
  isRecording: boolean;
}

export const ScreenDiagramObserver: React.FC<ScreenDiagramObserverProps> = ({
  onDiagramCaptured,
  currentTimestamp,
  isRecording
}) => {
  const { announce } = useAccessibility();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [lastCapturedPreview, setLastCapturedPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoScanIntervalRef = useRef<any>(null);
  const lastFrameDataRef = useRef<string | null>(null);

  // Start Screen Share
  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: false
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScreenSharing(true);
      announce("Screen sharing active. EchoNote is now observing lecture slides and diagrams.");

      // Listen for when user stops sharing via browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.warn("Screen share cancelled or failed:", err);
      announce("Screen share was not started.");
    }
  };

  // Stop Screen Share
  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
    }
    setIsScreenSharing(false);
    announce("Screen observation stopped.");
  };

  // Auto-scan loop for detecting diagrams on screen
  useEffect(() => {
    if (isScreenSharing && autoCaptureEnabled) {
      // Check screen every 18 seconds for new slides/diagrams
      autoScanIntervalRef.current = setInterval(() => {
        captureAndAnalyzeFrame(false); // auto mode
      }, 18000);
    } else {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
    }

    return () => {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
    };
  }, [isScreenSharing, autoCaptureEnabled, currentTimestamp]);

  // Capture frame from video
  const captureAndAnalyzeFrame = async (isManual: boolean = false) => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // If auto-mode, verify if screen changed significantly from last capture
    if (!isManual && lastFrameDataRef.current) {
      // Basic sample comparison
      if (dataUrl.slice(100, 300) === lastFrameDataRef.current.slice(100, 300)) {
        return; // Same slide, skip redundant analysis
      }
    }

    lastFrameDataRef.current = dataUrl;
    setLastCapturedPreview(dataUrl);
    setIsAnalyzing(true);
    if (isManual) {
      announce("Capturing screen diagram and analyzing formulas with Gemini Vision...");
    }

    try {
      const analysis = await analyzeLectureImage(dataUrl, 'image/jpeg');
      
      const newMedia: LectureMedia = {
        id: `screen-${Date.now()}`,
        timestamp: currentTimestamp,
        imageUrl: dataUrl,
        title: analysis.title || 'Screen Slide Diagram',
        ocrText: analysis.ocrText || 'Text & formulas extracted from screen',
        aiExplanation: analysis.aiExplanation || 'Visual representation captured directly from lecture screen.',
        tags: analysis.tags?.length ? analysis.tags : ['Screen Capture', 'Lecture Slide', 'Diagram']
      };

      onDiagramCaptured(newMedia);
      setCapturedCount(prev => prev + 1);
      setIsAnalyzing(false);
      announce(`Captured & analyzed new diagram: ${newMedia.title}`);
    } catch (err) {
      console.error("Auto screen analysis error:", err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card" style={{
      background: isScreenSharing ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-secondary)',
      border: `1px solid ${isScreenSharing ? 'var(--accent-cyan-light)' : 'var(--border-subtle)'}`,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: isScreenSharing ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.1)',
            border: `1px solid ${isScreenSharing ? 'var(--accent-cyan-light)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Monitor size={22} color={isScreenSharing ? 'var(--accent-cyan-light)' : 'var(--text-muted)'} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Auto Screen & Diagram Observer
              </strong>
              {isScreenSharing && (
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                  Live Observing
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Automatically scans shared lecture slides, Zoom windows & diagrams and embeds OCR notes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {!isScreenSharing ? (
            <button
              onClick={startScreenShare}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '0.55rem 1.15rem' }}
            >
              <Monitor size={16} />
              <span>Share Lecture Screen / Slides</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => captureAndAnalyzeFrame(true)}
                disabled={isAnalyzing}
                className="btn btn-emerald"
                style={{ padding: '0.55rem 1rem' }}
                title="Immediately capture current screen slide"
              >
                <Camera size={16} />
                <span>{isAnalyzing ? 'Analyzing...' : 'Capture Slide Now'}</span>
              </button>

              <button
                onClick={() => setAutoCaptureEnabled(prev => !prev)}
                className={`btn ${autoCaptureEnabled ? 'btn-secondary' : 'btn-secondary'}`}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}
                title="Toggle automatic periodic diagram detection"
              >
                <Scan size={15} color={autoCaptureEnabled ? '#10b981' : '#64748b'} />
                <span>{autoCaptureEnabled ? 'Auto-Scan: ON' : 'Auto-Scan: OFF'}</span>
              </button>

              <button
                onClick={stopScreenShare}
                className="btn btn-rose"
                style={{ padding: '0.55rem 0.85rem' }}
              >
                <X size={16} />
                <span>Stop Sharing</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden Video & Canvas for frame extraction */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: isScreenSharing ? 'block' : 'none',
          width: '100%',
          maxHeight: '180px',
          objectFit: 'contain',
          background: '#000000',
          borderRadius: 'var(--radius-md)',
          marginTop: '1rem',
          border: '1px solid var(--border-subtle)'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Status Bar if sharing */}
      {isScreenSharing && (
        <div style={{
          marginTop: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <span>
            {capturedCount > 0 ? `✅ ${capturedCount} diagrams automatically captured into notes` : '⚡ Watching screen for new diagrams, equations, and slides...'}
          </span>
          {isAnalyzing && (
            <span style={{ color: 'var(--accent-cyan-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} /> AI Vision OCR analyzing diagram...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
