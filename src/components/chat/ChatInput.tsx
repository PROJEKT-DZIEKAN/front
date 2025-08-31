'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { forwardRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ChatInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  connected: boolean;
  isAdmin: boolean;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  newMessage,
  onMessageChange,
  onSubmit,
  connected,
  isAdmin
}, ref) => {
  return (
    <form onSubmit={onSubmit} className="p-4 bg-white border-t border-gray-300">
      <div className="flex gap-2">
        <Input
          ref={ref}
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={isAdmin ? "Napisz wiadomość jako organizator..." : "Napisz wiadomość do organizatora..."}
          disabled={!connected}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!connected || !newMessage.trim()}
          variant="primary"
          icon={<PaperAirplaneIcon className="h-4 w-4" />}
        >
          Wyślij
        </Button>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
