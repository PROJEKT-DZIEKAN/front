'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CameraIcon, 
  PhotoIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
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

interface ApiError {
  success: boolean;
  error: string;
  message: string;
  status: string;
}

const API_BASE_URL = 'https://duck-duck-production.up.railway.app';

export default function PersonRecognition() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funkcja do komunikacji z API
  const recognizeFace = async (file: File): Promise<RecognitionResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/camera/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status >= 500) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Błąd serwera podczas przetwarzania zdjęcia');
      } else {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    }

    return await response.json();
  };

  // Sprawdzenie statusu API
  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  // Inicjalizacja kamery
  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraOpen(true);
      
      // Sprawdź czy przeglądarka wspiera getUserMedia
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
      
      // Poczekaj na następny render cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ustaw stream na video element
      if (videoRef.current) {
        console.log('🎥 Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;
        
        try {
          await videoRef.current.play();
          console.log('✅ Video started playing');
        } catch (playError) {
          console.log('⚠️ Auto-play blocked, user interaction needed');
        }
      } else {
        console.error('❌ Video ref not found after timeout');
      }
      
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
    if (scanInterval) {
      clearInterval(scanInterval);
      setScanInterval(null);
    }
    setIsScanning(false);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  }, [stream, scanInterval]);

  // Robienie zdjęcia
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  // Automatyczne skanowanie twarzy
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Sprawdź czy video jest gotowe
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Konwertuj na blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
      
      try {
        const recognition = await recognizeFace(file);
        if (recognition && recognition.success && recognition.status === 'recognized') {
          // Zatrzymaj skanowanie gdy znajdziemy twarz
          setIsScanning(false);
          if (scanInterval) {
            clearInterval(scanInterval);
            setScanInterval(null);
          }
          setResult(recognition);
        }
      } catch (err) {
        console.log('Scan error:', err);
      }
    }, 'image/jpeg', 0.8);
  };

  // Start/Stop skanowania
  const toggleScanning = () => {
    if (isScanning) {
      // Zatrzymaj skanowanie
      if (scanInterval) {
        clearInterval(scanInterval);
        setScanInterval(null);
      }
      setIsScanning(false);
    } else {
      // Rozpocznij skanowanie
      setError(null);
      setResult(null);
      setIsScanning(true);
      
      const interval = setInterval(captureAndScan, 2000); // Skanuj co 2 sekundy
      setScanInterval(interval);
    }
  };

  // Proces rozpoznawania ze zdjęcia
  const processImage = async (imageSource: 'camera' | 'file', file?: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Sprawdź połączenie z API
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        throw new Error('Serwer rozpoznawania twarzy jest niedostępny. Spróbuj ponownie później.');
      }

      let fileToProcess: File;

      if (imageSource === 'camera' && capturedImage) {
        // Konwertuj zdjęcie z kamery na File
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        fileToProcess = new File([blob], 'camera_photo.jpg', { type: 'image/jpeg' });
      } else if (imageSource === 'file' && file) {
        fileToProcess = file;
      } else {
        throw new Error('Brak zdjęcia do przetworzenia');
      }

      const recognition = await recognizeFace(fileToProcess);
      setResult(recognition);

      if (recognition.success && imageSource === 'camera') {
        stopCamera();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      setError(errorMessage);
      console.error('Błąd rozpoznawania:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload pliku
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Można przesłać tylko pliki obrazów.');
        return;
      }
      processImage('file', file);
    }
  };

  // Czyszczenie wyników
  const clearResults = () => {
    setResult(null);
    setError(null);
    setCapturedImage(null);
  };

  // Cleanup przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Event listener dla video
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        console.log('📹 Video metadata loaded:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
      };

      const handleCanPlay = () => {
        console.log('▶️ Video can play');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [isCameraOpen]);



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
          {!isCameraOpen ? (
            <>
              <div className="w-64 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <CameraIcon className="h-16 w-16 text-gray-400" />
              </div>
              <div className="space-y-2">
                <button 
                  onClick={startCamera}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Włącz kamerę
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                >
                  <PhotoIcon className="h-5 w-5 inline mr-2" />
                  Prześlij zdjęcie
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full max-w-md mx-auto rounded-lg bg-black"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
                
                {/* Ramka skanowania */}
                <div className="absolute inset-0 max-w-md mx-auto">
                  <div className="relative w-full h-full">
                    {/* Górna ramka */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 ${
                      isScanning ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    <div className={`absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 ${
                      isScanning ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    
                    {/* Dolna ramka */}
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 ${
                      isScanning ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 ${
                      isScanning ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    
                    {/* Animowana linia skanowania */}
                    {!capturedImage && isScanning && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Złapane zdjęcie */}
                {capturedImage && (
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md rounded-lg bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${capturedImage})`,
                      aspectRatio: '4/3'
                    }}
                  >
                    {/* Zielona ramka dla złapanego zdjęcia */}
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instrukcje */}
              {!capturedImage && (
                <div className={`text-center text-sm rounded-lg p-3 ${
                  isScanning 
                    ? 'text-green-800 bg-green-50 border border-green-200' 
                    : 'text-gray-600 bg-blue-50'
                }`}>
                  {isScanning ? (
                    <>
                      <p>🔍 Skanowanie twarzy w toku...</p>
                      <p className="text-xs mt-1">Umieść twarz w ramce i poczekaj na rozpoznanie</p>
                      <div className="mt-2 flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>🎯 Umieść twarz w ramce i kliknij &quot;Rozpocznij skanowanie&quot;</p>
                      <p className="text-xs mt-1">System automatycznie rozpozna osobę na podstawie bazy danych</p>
                      <p className="text-xs mt-1 text-blue-600">💡 Jeśli kamera nie działa, kliknij na czarny obszar</p>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2">
                {!capturedImage ? (
                  <>
                    <button 
                      onClick={toggleScanning}
                      disabled={isLoading}
                      className={`flex-1 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 ${
                        isScanning 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isScanning ? '⏹️ Zatrzymaj skanowanie' : '🔍 Rozpocznij skanowanie'}
                    </button>
                    <button 
                      onClick={capturePhoto}
                      disabled={isScanning || isLoading}
                      className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                      title="Zrób pojedyncze zdjęcie"
                    >
                      📸
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => processImage('camera')}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isLoading ? 'Rozpoznaję...' : 'Rozpoznaj'}
                    </button>
                    <button 
                      onClick={() => setCapturedImage(null)}
                      disabled={isLoading}
                      className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
                    >
                      Ponów
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ukryty input dla plików */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Canvas do przetwarzania zdjęć */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
            <div>
              <h3 className="font-medium text-blue-800">Przetwarzanie...</h3>
              <p className="text-sm text-blue-700">Rozpoznaję osobę na zdjęciu</p>
            </div>
          </div>
        </div>
      )}

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