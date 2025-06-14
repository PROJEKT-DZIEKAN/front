'use client';

import { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface TutorialProps {
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Witaj w College App! 👋',
    content: 'Ta aplikacja pomoże Ci podczas całego wydarzenia. Przejdziemy przez wszystkie funkcje.',
    icon: '🎓'
  },
  {
    title: 'Dashboard - Twój punkt startowy',
    content: 'Na głównej stronie znajdziesz status rejestracji, nadchodzące wydarzenia i szybkie akcje.',
    icon: '🏠'
  },
  {
    title: 'Program wydarzeń',
    content: 'Sprawdzaj harmonogram, zapisuj się na wydarzenia i dodawaj je do ulubionych.',
    icon: '📅'
  },
  {
    title: 'Tablica ogłoszeń',
    content: 'Wszystkie ważne informacje od organizatorów znajdziesz w tablicy ogłoszeń.',
    icon: '📢'
  },
  {
    title: 'Chat z organizatorami',
    content: 'Masz pytanie? Napisz do organizatorów - odpowiedzą szybko!',
    icon: '💬'
  },
  {
    title: 'QR Code Scanner',
    content: 'Skanuj kody QR do rejestracji na wydarzenia i wymiany wizytówek.',
    icon: '📱'
  },
  {
    title: 'Usługi alarmowe',
    content: 'W razie problemów użyj przycisku SOS lub zadzwoń na numery alarmowe.',
    icon: '🆘'
  },
  {
    title: 'Gotowe! 🎉',
    content: 'Teraz już wiesz jak korzystać z aplikacji. Miłego wydarzenia!',
    icon: '✅'
  }
];

export default function Tutorial({ onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Instrukcja ({currentStep + 1}/{tutorialSteps.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl mb-4">{step.icon}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed">{step.content}</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Wstecz
          </button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Zakończ' : 'Dalej'}
            {currentStep < tutorialSteps.length - 1 && (
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}