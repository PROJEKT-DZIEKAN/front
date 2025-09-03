'use client';

import React, { useRef, useState, useCallback } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';

interface RecognitionResult {
  success: boolean;
  identity?: string;
  confidence?: number;
  distance?: number;
  processing_time_seconds?: number;
  status: 'recognized' | 'unknown' | 'no_face' | 'error' | 'server_error';
  message: string;
  person?: {
    full_name: string;
    first_name: string;
    last_name: string;
  };
}

const PersonRecognition: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { recognizeFace, checkHealth, reloadDatabase } = useFaceRecognition();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCapturing(true);
      }
    } catch (err) {
      setError('Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setCapturedImage(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
  }, []);

  const processImage = useCallback(async (imageSource: string | File) => {
    setIsProcessing(true);
    setError(null);
    setRecognitionResult(null);

    try {
      let file: File;

      if (typeof imageSource === 'string') {
        const response = await fetch(imageSource);
        const blob = await response.blob();
        file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      } else {
        file = imageSource;
      }

      const result = await recognizeFace(file);
      setRecognitionResult(result);
    } catch (err) {
      setError('Błąd podczas rozpoznawania twarzy');
    } finally {
      setIsProcessing(false);
    }
  }, [recognizeFace]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        processImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setCapturedImage(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setError('Można przesłać tylko pliki obrazów');
      }
    }
  }, [processImage]);

  const handleHealthCheck = async () => {
    const health = await checkHealth();
    if (health) {
      setError(null);
      alert(`API Status: ${health.status}\nBaza: ${health.database_loaded ? 'Załadowana' : 'Nie załadowana'}\nRozmiar: ${health.database_size}`);
    } else {
      setError('API niedostępne');
    }
  };

  const handleReloadDatabase = async () => {
    try {
      await reloadDatabase();
      alert('Baza danych została przeładowana');
    } catch (err) {
      setError('Błąd podczas przeładowywania bazy');
    }
  };

  const reset = useCallback(() => {
    setRecognitionResult(null);
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recognized': return 'text-green-600 bg-green-50';
      case 'unknown': return 'text-yellow-600 bg-yellow-50';
      case 'no_face': return 'text-red-600 bg-red-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recognized': return '✅';
      case 'unknown': return '⚠️';
      case 'no_face': return '❌';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Rozpoznawanie Twarzy</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleHealthCheck}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Status API
          </button>
          <button
            onClick={handleReloadDatabase}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Przeładuj Bazę
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            {!isCapturing ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CameraIcon className="w-5 h-5" />
                Włącz kamerę
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XMarkIcon className="w-5 h-5" />
                Wyłącz kamerę
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <PhotoIcon className="w-5 h-5" />
              Wybierz plik
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isCapturing && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border"
              />
              <button
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50"
              >
                Zrób zdjęcie
              </button>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-3">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => processImage(capturedImage)}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Rozpoznaję...' : 'Rozpoznaj twarz'}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          {recognitionResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Wynik rozpoznawania:</h3>
              
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium mb-3 ${getStatusColor(recognitionResult.status)}`}>
                <span>{getStatusIcon(recognitionResult.status)}</span>
                <span>{recognitionResult.message}</span>
              </div>

              {recognitionResult.success && recognitionResult.person && (
                <div className="space-y-2">
                  <p><strong>Imię:</strong> {recognitionResult.person.first_name}</p>
                  <p><strong>Nazwisko:</strong> {recognitionResult.person.last_name}</p>
                  <p><strong>Pewność:</strong> {recognitionResult.confidence?.toFixed(1)}%</p>
                  <p><strong>Czas przetwarzania:</strong> {recognitionResult.processing_time_seconds?.toFixed(2)}s</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PersonRecognition;