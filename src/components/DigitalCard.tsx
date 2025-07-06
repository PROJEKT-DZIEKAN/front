'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserIcon, QrCodeIcon, ShareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';

export default function DigitalCard() {
  const { user, isAuthenticated, isLoading } = useUser();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // Funkcja do pobrania QR kodu użytkownika
  const loadUserQRCode = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingQR(true);
    try {
      const response = await fetch(`https://dziekan-backend.onrender.com/api/qr/${user.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
      }
    } catch (error) {
      console.error('Błąd ładowania QR kodu:', error);
    } finally {
      setIsLoadingQR(false);
    }
  }, [user?.id]);

  // Ładowanie QR kodu po zalogowaniu
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserQRCode();
    }
    
    // Cleanup URL gdy komponent się odmontuje
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [isAuthenticated, user?.id, loadUserQRCode, qrCodeUrl]);

  // Funkcja udostępniania wizytówki
  const shareCard = async () => {
    if (!user) return;
    
    const shareData = {
      title: `${user.firstName} ${user.surname} - Wizytówka`,
      text: `Wizytówka studenta: ${user.firstName} ${user.surname}`,
      url: qrCodeUrl || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - kopiowanie do schowka
        await navigator.clipboard.writeText(
          `${user.firstName} ${user.surname} - ${window.location.href}`
        );
        alert('Link do wizytówki skopiowany do schowka!');
      }
    } catch (error) {
      console.error('Błąd udostępniania:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie wizytówki...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Elektroniczna Wizytówka</h1>
          <p className="text-gray-600 mb-4">Zaloguj się, aby zobaczyć swoją wizytówkę</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Zeskanuj swój kod QR aby się zalogować i uzyskać dostęp do swojej cyfrowej wizytówki
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <UserIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Elektroniczna Wizytówka</h1>
        <p className="text-gray-600">Twoja cyfrowa wizytówka do udostępniania</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
            <UserIcon className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstName} {user.surname}
            </h2>
            <p className="text-gray-600">Student</p>
            <p className="text-sm text-gray-500">ID: {user.id}</p>
            {user.registrationStatus && (
              <p className="text-sm text-green-600 mt-1">
                Status: {user.registrationStatus}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Twój kod QR</h3>
          <button
            onClick={loadUserQRCode}
            disabled={isLoadingQR}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Odśwież kod QR"
          >
            <ArrowPathIcon className={`h-5 w-5 text-gray-600 ${isLoadingQR ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="text-center space-y-4">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center overflow-hidden">
            {isLoadingQR ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : qrCodeUrl ? (
              <Image 
                src={qrCodeUrl} 
                alt="Kod QR użytkownika" 
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            ) : (
            <QrCodeIcon className="h-16 w-16 text-gray-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Ten kod QR zawiera Twoje ID: <span className="font-mono font-bold">{user.id}</span>
            </p>
            <p className="text-xs text-gray-500">
              Inne osoby mogą go zeskanować aby zobaczyć Twoją wizytówkę
            </p>
          </div>
          
          <button 
            onClick={shareCard}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Udostępnij wizytówkę
          </button>
        </div>
      </div>
    </div>
  );
}