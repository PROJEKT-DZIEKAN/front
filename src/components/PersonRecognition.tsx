'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { CameraIcon, PhotoIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Adres URL Twojego API, który będzie używany do rozpoznawania
const API_URL = 'https://ai-dziekan-production.up.railway.app/camera/';

export default function PersonRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState({
    identity: 'Oczekiwanie...',
    message: 'Naciśnij "Włącz kamerkę" aby rozpocząć lub "Prześlij z galerii".',
    status: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funkcja do przechwytywania klatki z wideo
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return null;
      
      if (video.readyState !== 4 || video.videoWidth === 0) {
        console.warn('Wideo nie jest jeszcze gotowe do przechwycenia klatki.');
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });
    }
    return null;
  };

  // Funkcja do wysyłania zdjęcia do API
  const sendImageToAPI = async (imageBlob: Blob | File, filename: string) => {
    setError(null);
    setIsLoading(true);
    setRecognitionResult({
      identity: 'Wysyłanie...',
      message: 'Wysyłanie zdjęcia do serwera...',
      status: 'loading',
    });

    try {
      const formData = new FormData();
      formData.append('file', imageBlob, filename);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      
      setRecognitionResult({
        identity: 'Przetwarzanie...',
        message: 'Przetwarzanie obrazu na serwerze...',
        status: 'loading',
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        setRecognitionResult({
          identity: data.identity,
          message: data.message,
          status: data.status,
        });
      } else {
        setRecognitionResult({
          identity: data.identity || 'Błąd',
          message: data.message || 'Nieznany błąd.',
          status: 'error',
        });
      }
    } catch (err: unknown) {
      console.error('Błąd połączenia z API:', err);
      setError('Błąd połączenia z API. Upewnij się, że serwer działa.');
      setRecognitionResult({
        identity: 'Błąd',
        message: 'Nie udało się połączyć z API.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja do włączania/wyłączania kamery
  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setRecognitionResult({
        identity: 'Oczekiwanie...',
        message: 'Naciśnij "Włącz kamerkę" aby rozpocząć lub "Prześlij z galerii".',
        status: '',
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Błąd dostępu do kamery:', err);
      setError('Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia.');
      setStream(null);
    }
  };

  // Funkcja do obsługi kliknięcia "Zrób zdjęcie"
  const handleTakePic = async () => {
    const blob = await captureFrame();
    if (blob) {
      setCapturedImage(blob);
      setShowModal(true);
    } else {
      setError('Nie można zrobić zdjęcia. Upewnij się, że kamera działa poprawnie.');
    }
  };

  // Funkcja do obsługi przesłania zdjęcia z podglądu
  const handleSendPic = async () => {
    if (capturedImage) {
      setShowModal(false);
      await sendImageToAPI(capturedImage, 'camera_snapshot.jpg');
    }
  };

  // Funkcja do ponownego zrobienia zdjęcia
  const handleRetakePic = () => {
    setCapturedImage(null);
    setShowModal(false);
    // Pozwalamy kamerze działać, aby można było od razu zrobić nowe zdjęcie
  };

  // Funkcja do obsługi przesłania z galerii
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      sendImageToAPI(file, file.name);
    }
  };

  // Kolory statusów
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recognized':
        return 'text-green-600';
      case 'no_face':
        return 'text-yellow-600';
      case 'unknown':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
        return 'text-blue-500';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center justify-center space-y-6 font-sans">
      <h1 className="text-3xl font-bold text-gray-900">Rozpoznawanie Twarzy</h1>
      
      <div className="w-full max-w-lg border-2 border-gray-400 rounded-xl shadow-lg overflow-hidden bg-white">
        <video
          ref={videoRef}
          className="w-full h-auto"
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }} // Odwraca obraz, żeby wyglądał jak lustro
        />
        {/* Ukryty canvas do przechwytywania klatek */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800">Status:</p>
        {isLoading ? (
          <p className="text-blue-500 font-medium">{recognitionResult.message}</p>
        ) : (
          <p className={`text-xl font-bold ${getStatusColor(recognitionResult.status)}`}>
            {recognitionResult.identity}
          </p>
        )}
        {!isLoading && <p className="text-gray-600 mt-2">{recognitionResult.message}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-lg">
        <button
          onClick={startCamera}
          className="bg-blue-600 text-white py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-blue-300 w-full"
        >
          <CameraIcon className="h-6 w-6" />
          <span>{stream ? 'Wyłącz kamerkę' : 'Włącz kamerkę'}</span>
        </button>

        {stream && (
          <button
            onClick={handleTakePic}
            className="bg-green-600 text-white py-3 px-8 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-green-300 w-full"
            disabled={isLoading}
          >
            <PhotoIcon className="h-6 w-6" />
            <span>Zrób zdjęcie</span>
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-600 text-white py-3 px-8 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-gray-300 w-full"
          disabled={isLoading}
        >
          <CloudArrowUpIcon className="h-6 w-6" />
          <span>Prześlij z galerii</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
        </button>
      </div>

      {/* Popup z podglądem zdjęcia */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col items-center space-y-4 relative">
            <button
              onClick={() => handleRetakePic()}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Podgląd zdjęcia</h2>
            {capturedImage && (
              <Image
                src={URL.createObjectURL(capturedImage)}
                alt="Podgląd zrobionego zdjęcia"
                width={400}
                height={300}
                className="rounded-lg border-2 border-gray-300 w-full h-auto"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
            <div className="flex space-x-4 w-full justify-center">
              <button
                onClick={handleRetakePic}
                className="bg-red-500 text-white py-3 px-8 rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-red-300"
              >
                <CameraIcon className="h-6 w-6" />
                <span>Ponów zdjęcie</span>
              </button>
              <button
                onClick={handleSendPic}
                className="bg-green-600 text-white py-3 px-8 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                <CloudArrowUpIcon className="h-6 w-6" />
                <span>Prześlij</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}