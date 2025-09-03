'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Message } from './useChat';

const API_BASE_URL = 'https://dziekan-48de5f4dea14.herokuapp.com';

interface UseWebSocketProps {
  user: any;
  token: string | null;
  onMessageReceived: (message: Message) => void;
  onHistoryReceived: (history: Message[]) => void;
  onConnectionError: () => void;
}

export const useWebSocket = ({
  user,
  token,
  onMessageReceived,
  onHistoryReceived,
  onConnectionError
}: UseWebSocketProps) => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);

  const enableMockMode = useCallback(() => {
    console.log('📱 Enabling mock mode...');
    setConnected(true);
    onConnectionError();
  }, [onConnectionError]);

  useEffect(() => {
    console.log('useWebSocket effect triggered:', { user: !!user, token: !!token, userId: user?.id });
    
    if (!user || !token) {
      console.log('Missing user or token, not connecting to WebSocket');
      return;
    }

    console.log('Connecting to WebSocket chat system...', { 
      url: `${API_BASE_URL}/ws-chat?token=${token}`,
      userId: user.id 
    });

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-chat?token=${token}`),
      debug: (str) => console.log('STOMP:', str),
      onConnect: () => {
        console.log('✅ Connected to WebSocket successfully!');
        setConnected(true);
        
        stompClient.subscribe('/user/queue/messages', (message) => {
          const newMessage: Message = JSON.parse(message.body);
          console.log('📨 Received message:', newMessage);
          onMessageReceived(newMessage);
        });

        stompClient.subscribe('/user/queue/history', (message) => {
          const history: Message[] = JSON.parse(message.body);
          console.log('📜 Received history:', history);
          onHistoryReceived(history);
        });
      },
      onDisconnect: () => {
        console.log('❌ Disconnected from WebSocket');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('🚨 STOMP connection error:', frame);
        console.log('🔄 Falling back to mock mode...');
        setConnected(false);
        enableMockMode();
      },
      onWebSocketError: (event) => {
        console.error('🌐 WebSocket error:', event);
        console.log('🔄 Falling back to mock mode...');
        setConnected(false);
        enableMockMode();
      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      console.log('Deactivating WebSocket connection...');
      stompClient.deactivate();
    };
  }, [user, token, onMessageReceived, onHistoryReceived, enableMockMode]);

  const loadHistory = useCallback((chatId: number) => {
    if (!client || !connected) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Loading history for chat:', chatId);
    client.publish({
      destination: '/app/chat.history',
      body: JSON.stringify({ id: chatId })
    });
  }, [client, connected]);

  const sendMessage = useCallback((chatId: number, content: string, senderId: number) => {
    if (!client || !connected) {
      console.error('WebSocket not connected');
      return;
    }

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        chatId,
        senderId,
        content
      })
    });
  }, [client, connected]);

  return {
    connected,
    loadHistory,
    sendMessage
  };
};
