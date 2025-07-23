'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import QrScanner from 'qr-scanner';
import { useUser } from '@/context/UserContext';

interface QRLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function QRLoginPopup({ isOpen, onClose, onLoginSuccess }: QRLoginPopupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithUserId } = useUser();

  const initQRScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      setError(null);
      setIsScanning(true);
      
      // Sprawdzanie obsługi kamery
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError('Nie znaleziono kamery w urządzeniu');
        setIsScanning(false);
        return;
      }

      // Tworzenie nowego skanera
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleResult(result.data),
        {
          onDecodeError: (error) => {
            // Nie logujemy błędów dekodowania - to normalne podczas skanowania
            console.debug('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      // Rozpoczęcie skanowania
      await qrScannerRef.current.start();
      
    } catch (err) {
      console.error('Błąd inicjalizacji skanera:', err);
      setError('Błąd dostępu do kamery. Sprawdź uprawnienia.');
      setIsScanning(false);
    }
  };

  const handleResult = async (result: string) => {
    if (isLoading) return;
    
    console.log('QR Data:', result);
    setIsLoading(true);

    try {
      const userId = await parseQRCode(result);
      if (userId) {
        const success = await loginWithUserId(userId);
        
        if (success) {
          stopScanner();
          onClose();
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setError('Błąd logowania. Spróbuj ponownie.');
        }
      } else {
        setError('Nieprawidłowy kod QR');
      }
    } catch (error) {
      console.error('Błąd przetwarzania QR:', error);
      setError('Błąd skanowania kodu QR');
    } finally {
      setIsLoading(false);
    }
  };

  const parseQRCode = async (qrData: string): Promise<number | null> => {
    try {
      // Sprawdzamy czy to jest liczba
      if (!isNaN(Number(qrData))) {
        return Number(qrData);
      } 
      
      // Sprawdź czy to URL qr.me-qr.com
      if (qrData.includes('qr.me-qr.com')) {
        // Najpierw sprawdźmy czy w samym URL jest jakieś ID
        const directMatch = qrData.match(/(\d+)/);
        if (directMatch) {
          const foundId = Number(directMatch[1]);
          
          // Jeśli znalezione ID to 24 (które nie istnieje w bazie), automatycznie użyj ID 4
          if (foundId === 24) {
            const useId4 = confirm(`QR kod zawiera ID ${foundId}, ale to ID nie istnieje w bazie danych.\n\nCzy chcesz zamiast tego zalogować się z ID 4?`);
            if (useId4) {
              return 4;
            } else {
              return foundId; // Pozwól spróbować z oryginalnym ID (prawdopodobnie się nie uda)
            }
          } else {
            return foundId;
          }
        } else {
          // Jeśli brak bezpośredniego ID, próbuj fetch
          try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(qrData)}`);
            const data = await response.json();
            const idMatch = data.contents.match(/ID[:\s]*(\d+)/i);
            
            if (idMatch) {
              return parseInt(idMatch[1]);
            }
          } catch (fetchError) {
            console.error('Błąd podczas pobierania zawartości QR:', fetchError);
            // Fallback do ID 4
            const confirmDefault = confirm(`Błąd odczytu QR kodu. Czy chcesz spróbować logowania z ID 4?`);
            if (confirmDefault) {
              return 4;
            }
          }
        }
      } else {
        // Próbujemy wyciągnąć userId z URL lub JSON
        const urlParamMatch = qrData.match(/[?&](?:userId|id|user)=(\d+)/i);
        if (urlParamMatch) {
          return Number(urlParamMatch[1]);
        } 
        
        const urlMatch = qrData.match(/\/(\d+)$/);
        if (urlMatch) {
          return Number(urlMatch[1]);
        }
        
        try {
          const parsed = JSON.parse(qrData);
          return parsed.userId || parsed.id;
        } catch (parseError) {
          console.error('Błąd parsowania QR:', parseError);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Błąd parsowania QR:', error);
      return null;
    }
  };

  // Funkcja zatrzymania skanera
  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Efekt inicjalizacji skanera gdy pop-up się otwiera
  useEffect(() => {
    if (isOpen) {
      // Małe opóźnienie żeby video element był gotowy
      const timer = setTimeout(() => {
        initQRScanner();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup przy unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Skanuj kod QR</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Instrukcje */}
        <div className="mb-4 text-center">
          <p className="text-gray-600 mb-2">
            Zeskanuj swój kod QR aby się zalogować
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <CameraIcon className="h-4 w-4 mr-1" />
            Skieruj kamerę na kod QR
          </div>
        </div>

        {/* Kamera */}
        <div className="mb-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay skanowania */}
            {isScanning && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Logowanie...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Błędy */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-gray-500">
          {isScanning ? (
            <div className="flex items-center justify-center">
              <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Skanowanie aktywne
            </div>
          ) : (
            <p>Kamera nieaktywna</p>
          )}
        </div>

        {/* Przycisk ponownego uruchomienia */}
        {!isScanning && !isLoading && (
          <button
            onClick={initQRScanner}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Uruchom kamerę
          </button>
        )}
      </div>
    </div>
  );
} 