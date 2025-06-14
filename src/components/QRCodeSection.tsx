'use client';

import { useState, useRef } from 'react';
import { 
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface QRScanResult {
  id: string;
  data: string;
  timestamp: Date;
  type: 'registration' | 'event' | 'contact' | 'unknown';
  processed: boolean;
}

interface RegistrationStatus {
  step: number;
  completed: boolean;
  nextStep?: string;
}

export default function QRCodeSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<QRScanResult[]>([]);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({
    step: 2,
    completed: false,
    nextStep: 'Odbiór gadżetów i przydziału do grupy'
  });
  const [userQRCode, setUserQRCode] = useState('USER_QR_12345');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Nie można uzyskać dostępu do kamery');
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const processQRCode = (data: string) => {
    const result: QRScanResult = {
      id: Date.now().toString(),
      data: data,
      timestamp: new Date(),
      type: detectQRType(data),
      processed: false
    };

    setScanResults(prev => [result, ...prev]);
    
    // Symulacja przetwarzania
    setTimeout(() => {
      setScanResults(prev => 
        prev.map(r => 
          r.id === result.id 
            ? { ...r, processed: true }
            : r
        )
      );

      // Aktualizacja statusu rejestracji
      if (result.type === 'registration') {
        setRegistrationStatus(prev => ({
          step: prev.step + 1,
          completed: prev.step >= 2,
          nextStep: prev.step >= 2 ? undefined : 'Finalna rejestracja - potwierdzenie uczestnictwa'
        }));
      }
    }, 2000);

    stopScanning();
  };

  const detectQRType = (data: string): QRScanResult['type'] => {
    if (data.includes('registration') || data.includes('REG_')) {
      return 'registration';
    } else if (data.includes('event') || data.includes('EVT_')) {
      return 'event';
    } else if (data.includes('contact') || data.includes('USER_')) {
      return 'contact';
    }
    return 'unknown';
  };

  const simulateQRScan = (type: 'registration' | 'event' | 'contact') => {
    const mockData = {
      registration: 'REG_STEP_2_GADGETS_GROUP_ASSIGNMENT',
      event: 'EVT_PRESENTATION_HALL_201_15:30',
      contact: 'USER_QR_67890_ANNA_KOWALSKA_INFORMATYKA'
    };

    processQRCode(mockData[type]);
  };

  const shareUserQR = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Mój kod QR',
        text: `Mój kod QR: ${userQRCode}`
      });
    } else {
      navigator.clipboard.writeText(userQRCode);
      alert('Kod QR skopiowany do schowka!');
    }
  };

  const getResultIcon = (result: QRScanResult) => {
    if (!result.processed) {
      return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
    
    switch (result.type) {
      case 'registration':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'event':
        return <QrCodeIcon className="h-5 w-5 text-blue-500" />;
      case 'contact':
        return <DocumentDuplicateIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getResultColor = (result: QRScanResult) => {
    if (!result.processed) return 'bg-yellow-50 border-yellow-200';
    
    switch (result.type) {
      case 'registration': return 'bg-green-50 border-green-200';
      case 'event': return 'bg-blue-50 border-blue-200';
      case 'contact': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <QrCodeIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
        <p className="text-gray-600">Skanuj kody QR dla rejestracji, wydarzeń i wizytówek</p>
      </div>

      {/* Registration Status */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Rejestracji</h2>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            registrationStatus.completed ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {registrationStatus.completed ? (
              <CheckCircleIcon className="h-6 w-6 text-white" />
            ) : (
              <span className="text-white font-bold">{registrationStatus.step}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {registrationStatus.completed ? 'Rejestracja zakończona!' : `Krok ${registrationStatus.step}`}
            </p>
            {registrationStatus.nextStep && (
              <p className="text-sm text-gray-600">{registrationStatus.nextStep}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Skaner QR</h2>
        
        {!isScanning ? (
          <div className="text-center space-y-4">
            <button
              onClick={startScanning}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-press"
            >
              <CameraIcon className="h-5 w-5 inline mr-2" />
              Rozpocznij skanowanie
            </button>
            
            {/* Demo buttons */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-3">Tryb demo - symuluj skanowanie:</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => simulateQRScan('registration')}
                  className="bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors btn-press"
                >
                  QR Rejestracji
                </button>
                <button
                  onClick={() => simulateQRScan('event')}
                  className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors btn-press"
                >
                  QR Eventi
                </button>
                <button
                  onClick={() => simulateQRScan('contact')}
                  className="bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors btn-press"
                >
                  QR Wizytówki
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
            </div>
            <button
              onClick={stopScanning}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* User QR Code */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Twój Kod QR</h2>
        <div className="text-center space-y-4">
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
              <QrCodeIcon className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mt-2">QR Code wizytówki</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={shareUserQR}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-press"
            >
              Udostępnij
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(userQRCode);
                alert('Kod skopiowany!');
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors btn-press"
            >
              Kopiuj kod
            </button>
          </div>
        </div>
      </div>

      {/* Scan History */}
      {scanResults.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historia skanowania</h2>
          <div className="space-y-3">
            {scanResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border ${getResultColor(result)}`}
              >
                <div className="flex items-center space-x-3">
                  {getResultIcon(result)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">
                      {result.type === 'registration' ? 'Rejestracja' :
                       result.type === 'event' ? 'Wydarzenie' :
                       result.type === 'contact' ? 'Wizytówka' : 'Nieznany'}
                    </p>
                    <p className="text-sm text-gray-600">{result.data}</p>
                    <p className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {result.processed && result.type === 'registration' && (
                  <div className="mt-2 p-2 bg-green-100 rounded-md">
                    <p className="text-sm text-green-700">
                      ✓ Rejestracja zakończona pomyślnie!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}