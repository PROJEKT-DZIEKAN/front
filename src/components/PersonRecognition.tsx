'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  CameraIcon, 
  PhotoIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'https://duck-duck-production.up.railway.app';

interface RecognitionResult {
  success: boolean;
  identity: string;
  confidence?: number;
  distance?: number;
  processing_time_seconds: number;
  timestamp: string;
  status?: 'recognized' | 'unknown' | 'no_face' | 'error' | 'server_error';
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

export default function PersonRecognition() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [debug, setDebug] = useState<string>('');
  
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
      setDebug('🔍 Starting camera initialization...');
      console.log('🎥 PersonRecognition: Starting camera...');
      
      // Sprawdź czy getUserMedia jest dostępne
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDebug('❌ getUserMedia not supported');
        setError('getUserMedia nie jest obsługiwane w tej przeglądarce');
        return;
      }
      
      setDebug('📱 Requesting camera permissions...');
      console.log('🎥 PersonRecognition: Requesting getUserMedia...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('✅ PersonRecognition: getUserMedia success:', mediaStream);
      console.log('📊 Stream tracks:', mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      setDebug('✅ Stream obtained, setting camera open...');
      
      // OPCJA 1: Bezpośrednie przypisanie (jak w QRCodeSection)
      if (videoRef.current) {
        const video = videoRef.current;
        console.log('📺 Video element found, direct assignment...');
        
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        setDebug('🔗 Stream assigned directly to video');
        
        // OPCJA 2: Opóźnione odtworzenie (unikamy AbortError)
        setTimeout(async () => {
          try {
            console.log('🎬 Delayed play attempt...');
            setDebug('🎬 Attempting delayed play...');
            await video.play();
            setDebug('✅ Video playing with delay!');
            console.log('✅ PersonRecognition: Delayed video.play() success');
          } catch (delayedError) {
            console.error('❌ Delayed play failed:', delayedError);
            setDebug('❌ Delayed play failed, trying onloadedmetadata...');
            
            // Fallback na onloadedmetadata
            video.onloadedmetadata = async () => {
              try {
                await video.play();
                setDebug('✅ Video playing after metadata!');
              } catch {}
            };
          }
        }, 200); // 200ms opóźnienie
      }
      
    } catch (err) {
      console.error('❌ PersonRecognition: Camera error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown camera error';
      setDebug(`❌ Camera error: ${errorMessage}`);
      
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Brak dostępu do kamery. Upewnij się, że przyznałeś uprawnienia w przeglądarce i że strona działa przez HTTPS.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Nie znaleziono kamery w urządzeniu.');
      } else if (err instanceof DOMException && err.name === 'NotReadableError') {
        setError('Kamera jest używana przez inną aplikację.');
      } else {
        setError(`Nie można uzyskać dostępu do kamery: ${errorMessage}`);
      }
    }
  };

  // Zatrzymanie kamery
  const stopCamera = useCallback(() => {
    console.log('🛑 PersonRecognition: Stopping camera...');
    setDebug('🛑 Stopping camera...');
    
    if (stream) {
      console.log('🛑 Stopping stream tracks:', stream.getTracks().length);
      stream.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track.kind, track.readyState);
        track.stop();
      });
      setStream(null);
    }
    
    setIsCameraOpen(false);
    setCapturedImage(null);
    
    if (videoRef.current) {
      console.log('🛑 Clearing video srcObject');
      videoRef.current.srcObject = null;
    }
    
    setDebug('🛑 Camera stopped');
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
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  // Proces rozpoznawania ze zdjęcia
  const processImage = async (imageSource: 'camera' | 'file', file?: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        throw new Error('Serwer rozpoznawania twarzy jest niedostępny. Spróbuj ponownie później.');
      }

      let fileToProcess: File;

      if (imageSource === 'camera' && capturedImage) {
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
    setIsCameraOpen(false);
  };

  // Cleanup przy odmontowaniu komponentu
  useEffect(() => {
    console.log('🔧 PersonRecognition: Component mounted');
    setDebug('🔧 Component mounted');
    
    return () => {
      console.log('🔧 PersonRecognition: Component unmounting, cleaning up...');
      stopCamera();
    };
  }, [stopCamera]);
  
  // Debug info o stanie komponentu
  useEffect(() => {
    console.log('📊 PersonRecognition state changed:', {
      isCameraOpen,
      hasStream: !!stream,
      hasVideo: !!videoRef.current,
      capturedImage: !!capturedImage,
      isLoading,
      hasError: !!error
    });
  }, [isCameraOpen, stream, capturedImage, isLoading, error]);

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
        {debug && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="font-mono text-yellow-800">{debug}</p>
          </div>
        )}
      </div>

      {/* Kamera */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center space-y-4">
          <div className="relative mx-auto max-w-md rounded-lg overflow-hidden border border-gray-300" style={{ aspectRatio: '4 / 3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            {!isCameraOpen && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <CameraIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {capturedImage && (
              <Image 
                src={capturedImage}
                alt="Podgląd"
                width={400}
                height={300}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
          <div className="space-y-2">
            {!isCameraOpen ? (
              <>
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
              </>
            ) : !capturedImage ? (
              <div className="flex space-x-2">
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
              </div>
            ) : (
              <div className="flex space-x-2">
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
              </div>
            )}
          </div>
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
            {getStatusIcon(result.status || 'default')}
            
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
                {result.confidence !== undefined && (
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
              
              {result.distance !== undefined && (
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
