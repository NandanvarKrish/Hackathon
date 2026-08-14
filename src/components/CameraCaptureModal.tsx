import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { LectureMedia } from '../types/notes';
import { analyzeLectureImage } from '../services/geminiService';
import { useAccessibility } from '../context/AccessibilityContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaCaptured: (media: LectureMedia) => void;
  currentTimestamp: number;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onMediaCaptured,
  currentTimestamp
}) => {
  const { announce } = useAccessibility();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      announce("Camera activated for lecture capture");
    } catch (err: any) {
      console.warn("Camera access failed or unavailable:", err);
      setCameraError("Camera unavailable or permission denied. You can still upload slide images or use sample captures!");
      setActiveMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      analyzeAndSave(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      analyzeAndSave(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeAndSave = async (dataUrl: string) => {
    setIsAnalyzing(true);
    announce("AI is analyzing whiteboard slide and extracting OCR text...");
    try {
      const analysis = await analyzeLectureImage(dataUrl, 'image/jpeg');
      const newMedia: LectureMedia = {
        id: `media-${Date.now()}`,
        timestamp: currentTimestamp,
        imageUrl: dataUrl,
        title: analysis.title || 'Captured Lecture Slide',
        ocrText: analysis.ocrText || 'Slide text captured',
        aiExplanation: analysis.aiExplanation || 'Visual representation of lecture concept.',
        tags: analysis.tags?.length ? analysis.tags : ['Whiteboard Capture', 'Lecture Note']
      };

      onMediaCaptured(newMedia);
      setIsAnalyzing(false);
      announce("Slide captured and integrated into smart notes!");
      onClose();
      setCapturedImage(null);
    } catch (err) {
      console.error("Analysis failed:", err);
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div 
        role="dialog"
        aria-labelledby="camera-modal-title"
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
          aria-label="Close capture modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={20} color="var(--accent-emerald-light)" />
          </div>
          <div>
            <h2 id="camera-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Capture Slide / Whiteboard
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Snap photos or upload lecture diagrams for automatic multimodal OCR and explanation.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setActiveMode('camera'); setCapturedImage(null); }}
            className={`btn ${activeMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            <Camera size={16} />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => { setActiveMode('upload'); stopCamera(); setCapturedImage(null); }}
            className={`btn ${activeMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            <Upload size={16} />
            <span>Upload Image File</span>
          </button>
        </div>

        {cameraError && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.825rem',
            color: 'var(--accent-amber-light)'
          }}>
            <AlertCircle size={16} />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Camera / Upload Viewport */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '320px',
          background: '#000000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-medium)'
        }}>
          {isAnalyzing && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              zIndex: 20
            }}>
              <Sparkles size={36} color="var(--accent-cyan-light)" className="wave-bar" style={{ width: '36px', height: '36px' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Gemini Vision OCR in Progress...
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Extracting formulas, diagram labels, and teaching insights
                </p>
              </div>
            </div>
          )}

          {activeMode === 'camera' && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          )}

          {activeMode === 'upload' && !capturedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center'
              }}
            >
              <Upload size={36} color="var(--accent-cyan-light)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                Click to browse or drop slide photo here
              </p>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Supports PNG, JPG, WEBP whiteboard photos & presentation screenshots
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured slide preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Controls */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Captured at timeline: <strong>{Math.floor(currentTimestamp / 60)}:{(currentTimestamp % 60).toString().padStart(2, '0')}</strong>
          </span>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeMode === 'camera' && !capturedImage && (
              <button onClick={takeSnapshot} className="btn btn-emerald" disabled={isAnalyzing}>
                <Camera size={16} />
                <span>Snap Whiteboard</span>
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
