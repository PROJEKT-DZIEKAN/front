'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CameraIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface RecognitionResult {
  success: boolean;
  identity: string;
  confidence?: number;
  distance?: number;
  processing_time_seconds: number;
  timestamp: string;
  status: 'recognized' | 'unknown' | 'no_face' | 'error' | 'server_error';
  message: string;
  person?: {
    full_name: string;
    first_name: string;
    last_name: string;
  };
}



const API_BASE_URL = 'https://duck-duck-production.up.railway.app';

export default function PersonRecognition() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);



  // Inicjalizacja kamery (uproszczona wersja)
  const startCamera = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Twoja przeglądarka nie wspiera dostępu do kamery');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('📹 Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setIsCameraOpen(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(`Nie można uzyskać dostępu do kamery: ${errorMessage}`);
      console.error('Błąd dostępu do kamery:', err);
      setIsCameraOpen(false);
    }
  };

  // Zatrzymanie kamery
  const stopCamera = useCallback(() => {
    // Zatrzymaj skanowanie
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);



  // Automatyczne skanowanie twarzy (uproszczona wersja)
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sprawdź czy video jest gotowe
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Konwertuj do blob
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
      if (!blob) throw new Error('Nie udało się pobrać obrazu z kamery');

      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');

      const response = await fetch(`${API_BASE_URL}/camera/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Błąd rozpoznawania');
      const recognition = await response.json();

      if (recognition.success && recognition.status === 'recognized') {
        setResult(recognition);
        setIsScanning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Błąd podczas rozpoznawania');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Start/Stop skanowania
  const toggleScanning = () => {
    if (isScanning) {
      // Zatrzymaj skanowanie
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsScanning(false);
    } else {
      // Rozpocznij skanowanie
      setError(null);
      setResult(null);
      setIsScanning(true);
      
      intervalRef.current = setInterval(captureAndScan, 3000); // Skanuj co 3 sekundy
    }
  };

  // Czyszczenie wyników
  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  // Podłączenie stream do video (uproszczona wersja)
  useEffect(() => {
    if (stream && videoRef.current && isCameraOpen) {
      console.log('🎥 Setting video srcObject...');
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.log('⚠️ Auto-play blocked:', err));
    }
  }, [stream, isCameraOpen]);

  // Automatyczne uruchomienie skanowania gdy kamera się włączy
  useEffect(() => {
    if (isCameraOpen && !isScanning) {
      // Małe opóźnienie żeby video się załadowało
      const timer = setTimeout(() => {
        setIsScanning(true);
        intervalRef.current = setInterval(captureAndScan, 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCameraOpen, isScanning, captureAndScan]);

  // Cleanup przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);



  // Ikona statusu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recognized':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'unknown':
        return <ExclamationCircleIcon className="h-8 w-8 text-yellow-500" />;
      case 'no_face':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <CameraIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rozpoznawanie Osób</h1>
        <p className="text-gray-600">Zrób zdjęcie lub prześlij plik aby rozpoznać osobę</p>
      </div>

      {/* Kamera */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center space-y-4">
          {isCameraOpen ? (
            <>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Ramka skanowania */}
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Przetwarzanie...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className={`text-center text-sm rounded-lg p-3 ${
                isScanning 
                  ? 'text-green-800 bg-green-50 border border-green-200' 
                  : 'text-gray-600 bg-blue-50'
              }`}>
                {isScanning ? (
                  <p>🔍 Automatyczne skanowanie co 3 sekundy...</p>
                ) : (
                  <p>📷 Kamera gotowa do skanowania</p>
                )}
              </div>

              {/* Przyciski kontrolne */}
              <div className="flex space-x-2 justify-center">
                <button 
                  onClick={toggleScanning}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-400 ${
                    isScanning 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isScanning ? '⏹️ Zatrzymaj' : '🔍 Start'}
                </button>
                <button 
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ❌ Wyłącz kamerę
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-64 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <CameraIcon className="h-16 w-16 text-gray-400" />
              </div>
              <button 
                onClick={startCamera}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                📷 Włącz kamerę
              </button>
            </>
          )}
        </div>
      </div>

      {/* Canvas do przetwarzania zdjęć */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Błąd */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <XCircleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Błąd</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button 
            onClick={clearResults}
            className="mt-3 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Wyniki */}
      {result && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center space-y-4">
            {getStatusIcon(result.status)}
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {result.message}
              </h3>
              
              {result.person && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <UserIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">{result.person.full_name}</h4>
                  <p className="text-sm text-green-700">
                    {result.person.first_name} {result.person.last_name}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                {result.confidence && (
                  <div className="text-center">
                    <p className="font-medium">Pewność</p>
                    <p className="text-lg font-bold text-blue-600">{result.confidence}%</p>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="font-medium">Czas przetwarzania</p>
                  <p className="text-lg font-bold text-blue-600">
                    {result.processing_time_seconds}s
                  </p>
                </div>
              </div>

              {result.distance && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">
                    Dystans: {result.distance.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={clearResults}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rozpoznaj następną osobę
            </button>
          </div>
        </div>
      )}

      {/* Informacje */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-800 mb-2">Jak używać?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Włącz kamerę i zrób zdjęcie osoby</li>
          <li>• Lub prześlij gotowe zdjęcie z urządzenia</li>
          <li>• System rozpozna osobę na podstawie bazy danych</li>
          <li>• Działa najlepiej z wyraźnymi zdjęciami twarzy</li>
        </ul>
      </div>
    </div>
  );
}