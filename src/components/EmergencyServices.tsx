'use client';

import { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'organizer' | 'security' | 'medical' | 'general';
  available: boolean;
}

export default function EmergencyServices() {
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sosHistory, setSosHistory] = useState<Array<{
    id: string;
    timestamp: Date;
    location: { lat: number; lng: number; accuracy: number };
    status: string;
    message: string;
    respondent?: string;
  }>>([]);

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Organizator Główny',
      number: '+48 123 456 789',
      type: 'organizer',
      available: true
    },
    {
      id: '2',
      name: 'Ochrona Uczelni',
      number: '+48 987 654 321',
      type: 'security',
      available: true
    },
    {
      id: '3',
      name: 'Pomoc Medyczna',
      number: '+48 555 123 456',
      type: 'medical',
      available: true
    },
    {
      id: '4',
      name: 'Numer Alarmowy 112',
      number: '112',
      type: 'general',
      available: true
    }
  ];

  const getCurrentLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokalizacja nie jest obsługiwana'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    });
  };

  const sendSOS = async () => {
    setSosActive(true);
    setLocationError(null);

    try {
      const pos = await getCurrentLocation();
      setLocation(pos);

      // Symulacja wysłania SOS do wszystkich organizatorów
      const sosMessage = {
        id: Date.now().toString(),
        timestamp: new Date(),
        location: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        },
        status: 'sent',
        message: 'PILNE: Użytkownik potrzebuje pomocy!'
      };

      setSosHistory(prev => [sosMessage, ...prev]);

      // Symulacja potwierdzenia odbioru po 3 sekundach
      setTimeout(() => {
        setSosHistory(prev => 
          prev.map(item => 
            item.id === sosMessage.id 
              ? { ...item, status: 'received', respondent: 'Anna - Organizator' }
              : item
          )
        );
      }, 3000);

    } catch (error) {
      setLocationError('Nie udało się pobrać lokalizacji. Spróbuj ponownie lub zadzwoń bezpośrednio.');
      console.error('Location error:', error);
    }

    // Wyłącz stan SOS po 10 sekundach
    setTimeout(() => {
      setSosActive(false);
    }, 10000);
  };

  const makeCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  const getContactIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'organizer':
        return UserIcon;
      case 'security':
        return ExclamationTriangleIcon;
      case 'medical':
        return PhoneIcon;
      default:
        return PhoneIcon;
    }
  };

  const getContactColor = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'organizer':
        return 'bg-blue-500';
      case 'security':
        return 'bg-yellow-500';
      case 'medical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Usługi Alarmowe</h1>
        <p className="text-gray-600">
          W przypadku nagłej potrzeby pomocy, zgubienia się lub innych problemów
        </p>
      </div>

      {/* SOS Button */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Przycisk SOS</h2>
          <p className="text-sm text-gray-600 mb-6">
            Naciśnij aby wysłać swoją lokalizację i wezwać pomoc od wszystkich organizatorów
          </p>
          
          <button
            onClick={sendSOS}
            disabled={sosActive}
            className={`w-32 h-32 rounded-full text-white font-bold text-lg transition-all duration-200 ${
              sosActive 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500 hover:bg-red-600 active:scale-95'
            } shadow-lg`}
          >
            {sosActive ? (
              <div className="flex flex-col items-center">
                <CheckCircleIcon className="h-8 w-8 mb-1" />
                <span className="text-sm">WYSŁANO</span>
              </div>
            ) : (
              'SOS'
            )}
          </button>

          {locationError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          )}

          {location && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center justify-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                Lokalizacja wysłana (dokładność: {Math.round(location.coords.accuracy)}m)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Numery Alarmowe</h2>
        <div className="space-y-3">
          {emergencyContacts.map((contact) => {
            const Icon = getContactIcon(contact.type);
            
            return (
              <button
                key={contact.id}
                onClick={() => makeCall(contact.number)}
                className="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors btn-press"
              >
                <div className={`p-3 rounded-full ${getContactColor(contact.type)}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                  <p className="text-sm text-gray-600">{contact.number}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.available && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SOS History */}
      {sosHistory.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historia SOS</h2>
          <div className="space-y-3">
            {sosHistory.map((sos) => (
              <div key={sos.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sos.status === 'sent' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {sos.status === 'sent' ? 'Wysłano' : 'Odebrano'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {sos.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{sos.message}</p>
                {sos.respondent && (
                  <p className="text-xs text-green-600 mt-1">
                    Odpowiedział: {sos.respondent}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Wskazówki Bezpieczeństwa</h2>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• W przypadku zagrożenia życia dzwoń na 112</li>
          <li>• Przycisk SOS wysyła lokalizację do wszystkich organizatorów</li>
          <li>• Zawsze miej naładowany telefon podczas wydarzenia</li>
          <li>• Poinformuj znajomych o swojej lokalizacji</li>
        </ul>
      </div>
    </div>
  );
}