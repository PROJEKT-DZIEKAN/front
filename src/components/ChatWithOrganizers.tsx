'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'organizer';
  senderName: string;
  timestamp: Date;
  read: boolean;
}

export default function ChatWithOrganizers() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Mock chat history
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Cześć! Witamy w systemie czatu z organizatorami. Jak możemy Ci pomóc?',
        sender: 'organizer',
        senderName: 'Anna - Organizator',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true
      },
      {
        id: '2',
        content: 'Cześć! Mam problem z QR kodem do rejestracji. Nie skanuje się poprawnie.',
        sender: 'user',
        senderName: 'Ty',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        read: true
      },
      {
        id: '3',
        content: 'Sprawdziłam Twój profil - widzę, że pierwsza rejestracja została już zakończona. Spróbuj zeskanować QR kod ponownie, trzymając telefon stabilnie. Jeśli nadal nie działa, przyjdź do punktu obsługi w holu głównym.',
        sender: 'organizer',
        senderName: 'Anna - Organizator',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: true
      },
      {
        id: '4',
        content: 'Dziękuję! Udało się, kod zadziałał. Mam jeszcze pytanie - czy można zmienić grupę?',
        sender: 'user',
        senderName: 'Ty',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      }
    ];

    setMessages(mockMessages);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      senderName: 'Ty',
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate organizer response
    setIsTyping(true);
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(newMessage),
        sender: 'organizer',
        senderName: 'Michał - Organizator',
        timestamp: new Date(),
        read: false
      };
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 2000 + Math.random() * 2000);
  };

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('grupa') || lowerMessage.includes('grup')) {
      return 'Zmiany grup są możliwe do końca dzisiejszego dnia. Wypełnij ankietę preferencji w aplikacji lub przyjdź do biura organizatorów. Pamiętaj, że miejsca w niektórych grupach są ograniczone.';
    }
    
    if (lowerMessage.includes('qr') || lowerMessage.includes('kod')) {
      return 'Problemy z QR kodami można rozwiązać na kilka sposobów: 1) Sprawdź czy aparat jest wyraźny, 2) Upewnij się, że masz dostateczne oświetlenie, 3) Trzymaj telefon stabilnie. Jeśli nic nie pomaga, skontaktuj się z nami osobiście.';
    }
    
    if (lowerMessage.includes('lokalizacja') || lowerMessage.includes('mapa')) {
      return 'Wszystkie lokalizacje wydarzeń możesz znaleźć w sekcji "Lokalizacja" w aplikacji. Tam też jest mapa uczelni z zaznaczonymi salami. Jeśli się zgubisz, użyj funkcji "Poproś o pomoc".';
    }
    
    if (lowerMessage.includes('pomoc') || lowerMessage.includes('help')) {
      return 'Oczywiście pomożemy! Opisz dokładniej swój problem, a znajdziemy rozwiązanie. Możesz też skorzystać z przycisku SOS w nagłych przypadkach.';
    }
    
    return 'Dziękuję za wiadomość! Sprawdzę to dla Ciebie i odpowiem wkrótce. W razie pilnych spraw możesz też skontaktować się z nami osobiście w biurze organizatorów.';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Chat z Organizatorami</h1>
            <p className="text-sm text-gray-500">Średni czas odpowiedzi: 2-5 min</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}>
              {message.sender === 'organizer' && (
                <div className="flex items-center space-x-2 mb-1">
                  <UserIcon className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">{message.senderName}</span>
                </div>
              )}
              
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
              }`}>
                <ClockIcon className="h-3 w-3" />
                <span className="text-xs">
                  {format(message.timestamp, 'HH:mm')}
                </span>
                {message.sender === 'user' && (
                  <CheckCircleIcon className="h-3 w-3" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <UserIcon className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Organizator pisze...</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Wpisz wiadomość..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Quick responses */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            'Mam problem z QR kodem',
            'Jak zmienić grupę?',
            'Gdzie się odbywa wydarzenie?',
            'Potrzebuję pomocy'
          ].map((quickResponse) => (
            <button
              key={quickResponse}
              onClick={() => setNewMessage(quickResponse)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              {quickResponse}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
