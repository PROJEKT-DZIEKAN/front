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

  // Funkcja inicjalizacji skanera QR
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
        (result) => handleQRScan(result.data),
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

  // Funkcja obsługi zeskanowanego QR kodu
  const handleQRScan = async (qrData: string) => {
    try {
      setIsLoading(true);
      
      // DEBUG: Pokaż co jest w QR kodzie
      console.log('=== QR KOD DEBUG ===');
      console.log('Zeskanowane dane QR:', qrData);
      console.log('Typ danych:', typeof qrData);
      console.log('Długość:', qrData.length);
      alert(`QR Data: ${qrData}`); // Pokazuje też użytkownikowi
      
      // Wyciąganie userId z QR kodu
      let userId: number;
      
      // Sprawdzamy czy to jest liczba
      if (!isNaN(Number(qrData))) {
        console.log('✅ QR zawiera samo ID:', qrData);
        userId = Number(qrData);
      } else if (qrData.includes('qr.me-qr.com')) {
        console.log('🔗 QR zawiera qr.me-qr.com URL:', qrData);
        // QR kod prowadzi do qr.me-qr.com - próbujemy pobrać rzeczywistą zawartość
        try {
          // Pobieramy redirect URL
          const response = await fetch(qrData, { 
            method: 'GET',
            redirect: 'follow' 
          });
          const finalUrl = response.url;
          
          // Sprawdzamy czy w końcowym URL jest userId
          const userIdMatch = finalUrl.match(/userId[=:](\d+)/i) || 
                             finalUrl.match(/user[=:](\d+)/i) ||
                             finalUrl.match(/id[=:](\d+)/i) ||
                             finalUrl.match(/(\d+)$/);
          
          if (userIdMatch) {
            userId = Number(userIdMatch[1]);
          } else {
            // Jeśli nie ma userId w URL, próbujemy pobrać zawartość strony
            const text = await response.text();
            const contentMatch = text.match(/userId["\s]*[:=]\s*(\d+)/i) ||
                                text.match(/user["\s]*[:=]\s*(\d+)/i) ||
                                text.match(/"(\d+)"/);
            
            if (contentMatch) {
              userId = Number(contentMatch[1]);
            } else {
              // Ostatnia szansa - zapytaj użytkownika
              const userInput = prompt('Nie udało się automatycznie wyciągnąć ID z QR kodu. Podaj swoje ID użytkownika:');
              if (!userInput || isNaN(Number(userInput))) {
                throw new Error('Nie podano prawidłowego ID użytkownika');
              }
              userId = Number(userInput);
            }
          }
        } catch (fetchError) {
          console.error('Błąd podczas pobierania zawartości QR:', fetchError);
          // Jeśli wszystko zawiedzie, zapytaj użytkownika
          const userInput = prompt('Błąd odczytu QR kodu. Podaj swoje ID użytkownika:');
          if (!userInput || isNaN(Number(userInput))) {
            throw new Error('Nie podano prawidłowego ID użytkownika');
          }
          userId = Number(userInput);
        }
      } else {
        console.log('🔍 QR nie jest liczbą ani qr.me-qr.com, próbuję inne formaty...');
        // Próbujemy wyciągnąć userId z URL lub JSON
        try {
          // Jeśli QR kod zawiera URL np: "http://localhost:8080/api/qr/123"
          const urlMatch = qrData.match(/\/(\d+)$/);
          if (urlMatch) {
            console.log('✅ Znaleziono ID w URL:', urlMatch[1]);
            userId = Number(urlMatch[1]);
          } else {
            console.log('🔍 Próbuję parsować jako JSON...');
            // Jeśli QR kod zawiera JSON
            const parsed = JSON.parse(qrData);
            console.log('JSON parsowany:', parsed);
            userId = parsed.userId || parsed.id;
          }
        } catch (parseError) {
          console.error('❌ Błąd parsowania QR:', parseError);
          throw new Error('Nieprawidłowy format QR kodu');
        }
      }

      if (!userId || userId <= 0) {
        console.error('❌ Nieprawidłowe userId:', userId);
        throw new Error('Nie znaleziono prawidłowego ID użytkownika w QR kodzie');
      }

      console.log('🚀 Rozpoczynam logowanie z userId:', userId);
      
      // Próba logowania
      const loginSuccess = await loginWithUserId(userId);
      console.log('📝 Wynik logowania:', loginSuccess);
      
      if (loginSuccess) {
        // Zatrzymanie skanera
        stopScanner();
        
        // Wywołanie callback'a sukcesu
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Zamknięcie pop-up
        onClose();
      } else {
        setError('Nie udało się zalogować. Sprawdź kod QR i połączenie z internetem.');
      }
      
    } catch (err) {
      console.error('Błąd logowania przez QR:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
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
          <div className="space-y-2">
            <button
              onClick={initQRScanner}
              className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Uruchom kamerę
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('https://dziekan-backend-ywfy.onrender.com/api/users');
                  if (response.ok) {
                    alert('✅ Połączenie z backendem działa!');
                  } else {
                    alert(`❌ Backend odpowiada z błędem: ${response.status}`);
                  }
                } catch (error) {
                  alert(`❌ Nie można połączyć z backendem: ${error}`);
                }
              }}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Testuj połączenie z backendem
            </button>
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const testUserId = 4; // Testujemy z ID 4
                  console.log('Testuję logowanie z ID:', testUserId);
                  
                  const loginSuccess = await loginWithUserId(testUserId);
                  if (loginSuccess) {
                    alert('✅ Testowe logowanie udane!');
                    onClose();
                    if (onLoginSuccess) onLoginSuccess();
                  } else {
                    alert('❌ Testowe logowanie nieudane!');
                  }
                } catch (error) {
                  alert(`❌ Błąd testowego logowania: ${error}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              🧪 Testuj logowanie z ID=4
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 