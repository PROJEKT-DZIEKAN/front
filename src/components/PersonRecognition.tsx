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
      setIsCameraOpen(true);
      
      // Dodaj małe opóźnienie żeby DOM się zaktualizował
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🎥 Setting video srcObject...');
          videoRef.current.srcObject = mediaStream;
          
          // Spróbuj różne sposoby uruchomienia video
          const playVideo = async () => {
            try {
              await videoRef.current!.play();
              console.log('✅ Video started playing');
            } catch (err) {
              console.error('❌ Video play error:', err);
              // Fallback - spróbuj ponownie
              setTimeout(() => {
                videoRef.current?.play().catch(console.error);
              }, 500);
            }
          };
          
          playVideo();
        } else {
          console.error('❌ Video ref not found');
        }
      }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(`Nie można uzyskać dostępu do kamery: ${errorMessage}`);
      console.error('Błąd dostępu do kamery:', err);
    }
  };

  // Zatrzymanie kamery
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  }, [stream]);

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
                  className="w-full max-w-md mx-auto rounded-lg bg-black"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                
                {/* Ramka skanowania */}
                <div className="absolute inset-0 max-w-md mx-auto">
                  <div className="relative w-full h-full">
                    {/* Górna ramka */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                    
                    {/* Dolna ramka */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
                    
                    {/* Animowana linia skanowania */}
                    {!capturedImage && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
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
                <div className="text-center text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                  <p>🎯 Umieść twarz w ramce i kliknij &quot;Zrób zdjęcie&quot;</p>
                  <p className="text-xs mt-1">Upewnij się, że twarz jest dobrze oświetlona i wyraźna</p>
                </div>
              )}
              
              <div className="flex space-x-2">
                {!capturedImage ? (
                  <>
                    <button 
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Zrób zdjęcie
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Anuluj
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