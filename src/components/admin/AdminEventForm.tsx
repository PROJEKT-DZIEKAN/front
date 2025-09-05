'use client';

import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Event, CreateEventRequest } from '@/types/event';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';

interface AdminEventFormProps {
  editingEvent: Event | null;
  formData: CreateEventRequest;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function AdminEventForm({
  editingEvent,
  formData,
  isLoading,
  onInputChange,
  onSubmit,
  onCancel
}: AdminEventFormProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {editingEvent ? 'Edytuj Event' : 'Dodaj Nowy Event'}
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-4 ">
        <Input
          label="Tytuł"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          required
          placeholder="Wprowadź tytuł eventu"
        />

        <TextArea
          label="Opis"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          required
          rows={3}
          placeholder="Wprowadź opis eventu"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data i godzina rozpoczęcia"
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={onInputChange}
            required
          />

          <Input
            label="Data i godzina zakończenia"
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={onInputChange}
            required
          />
        </div>

        <Input
          label="Lokalizacja"
          name="location"
          value={formData.location}
          onChange={onInputChange}
          required
          placeholder="Wprowadź lokalizację eventu"
        />

        <Input
          label="Maksymalna liczba uczestników"
          type="number"
          name="maxParticipants"
          value={formData.maxParticipants || ''}
          onChange={onInputChange}
          min="1"
          placeholder="Pozostaw puste dla nieograniczonej liczby"
        />

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            icon={<CheckIcon className="h-4 w-4" />}
            className="flex-1"
          >
            {editingEvent ? 'Aktualizuj' : 'Dodaj Event'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            icon={<XMarkIcon className="h-4 w-4" />}
            className="flex-1"
          >
            Anuluj
          </Button>
        </div>
      </form>
    </Card>
  );
}
