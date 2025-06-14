'use client';

import { useState, useEffect } from 'react';
import { 
  MapPinIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number; };
  type: 'event' | 'facility' | 'emergency';
  description?: string;
  openHours?: string;
}

export default function LocationServices() {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const locations: Location[] = [
    {
      id: '1',
      name: 'Aula Główna',
      address: 'Budynek A, parter',
      coordinates: { lat: 50.0647, lng: 19.9450 },
      type: 'event',
      description: 'Główna sala wykładowa, 500 miejsc',
      openHours: '8:00 - 22:00'
    },
    {
      id: '2',
      name: 'Sala 201',
      address: 'Budynek B, 2 piętro',
      coordinates: { lat: 50.0648, lng: 19.9452 },
      type: 'event',
      description: 'Sala konferencyjna, 100 miejsc'
    },
    {
      id: '3',
      name: 'Dziedziniec',
      address: 'Między budynkami A i B',
      coordinates: { lat: 50.0646, lng: 19.9449 },
      type: 'event',
      description: 'Przestrzeń zewnętrzna na wydarzenia'
    },
    {
      id: '4',
      name: 'Stołówka Główna',
      address: 'Budynek C, parter',
      coordinates: { lat: 50.0645, lng: 19.9448 },
      type: 'facility',
      description: 'Posiłki i napoje',
      openHours: '7:00 - 20:00'
    }
  ];

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation(position),
        (error) => console.error('Location error:', error)
      );
    }
  };

  const openInGoogleMaps = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const shareLocation = () => {
    if (userLocation) {
      const url = `https://www.google.com/maps?q=${userLocation.coords.latitude},${userLocation.coords.longitude}`;
      if (navigator.share) {
        navigator.share({
          title: 'Moja lokalizacja',
          url: url
        });
      } else {
        navigator.clipboard.writeText(url);
        alert('Link do lokalizacji skopiowany do schowka!');
      }
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <MapPinIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lokalizacja</h1>
        <p className="text-gray-600">Znajdź miejsca wydarzeń i nawiguj po uczelni</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Twoja Lokalizacja</h2>
        {userLocation ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Szerokość: {userLocation.coords.latitude.toFixed(6)}
              </p>
              <p className="text-sm text-green-700">
                Długość: {userLocation.coords.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Dokładność: {Math.round(userLocation.coords.accuracy)}m
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={shareLocation}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-press"
              >
                Udostępnij lokalizację
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${userLocation.coords.latitude},${userLocation.coords.longitude}`, '_blank')}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors btn-press"
              >
                Otwórz w Google Maps
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <button
              onClick={getUserLocation}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-press"
            >
              Pobierz lokalizację
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Miejsca Wydarzeń</h2>
        
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj miejsca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="space-y-3">
          {filteredLocations.map((location) => (
            <div key={location.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  {location.description && (
                    <p className="text-sm text-gray-500 mt-1">{location.description}</p>
                  )}
                  {location.openHours && (
                    <div className="flex items-center mt-2">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{location.openHours}</span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-full ${
                  location.type === 'event' ? 'bg-blue-100' :
                  location.type === 'facility' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <BuildingOfficeIcon className={`h-4 w-4 ${
                    location.type === 'event' ? 'text-blue-600' :
                    location.type === 'facility' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => openInGoogleMaps(location)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm btn-press"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 inline mr-1" />
                  Nawiguj
                </button>
                <button
                  onClick={() => setSelectedLocation(location)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm btn-press"
                >
                  Szczegóły
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-8">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nie znaleziono miejsc pasujących do wyszukiwania</p>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedLocation.name}</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{selectedLocation.address}</p>
              {selectedLocation.description && (
                <p className="text-sm text-gray-700">{selectedLocation.description}</p>
              )}
              {selectedLocation.openHours && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedLocation.openHours}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => openInGoogleMaps(selectedLocation)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-press"
              >
                Nawiguj
              </button>
              <button
                onClick={() => setSelectedLocation(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors btn-press"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}