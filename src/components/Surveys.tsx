'use client';

import { useState } from 'react';
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
import { Survey, SurveyAnswer } from '@/types/survey';
import LoadingSpinner from './ui/LoadingSpinner';
import Modal from './ui/Modal';

export default function Surveys() {
  const { surveys, loading, error, fetchSurvey, submitAnswers } = useSurveys();
  const { isAuthenticated, user } = useAuth();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: number]: number[] }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ankiety i Głosowania</h1>
          <p className="text-gray-600">Musisz być zalogowany, aby wypełniać ankiety</p>
        </div>
      </div>
    );
  }

  const handleSurveyClick = async (surveyId: number) => {
    const survey = await fetchSurvey(surveyId);
    if (survey) {
      setSelectedSurvey(survey);
      setAnswers({});
      setSubmitSuccess(false);
    }
  };

  const handleAnswerChange = (questionId: number, optionId: number, questionType: 'SINGLE' | 'MULTIPLE') => {
    setAnswers(prev => {
      if (questionType === 'SINGLE') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        const currentAnswers = prev[questionId] || [];
        const isSelected = currentAnswers.includes(optionId);
        
        if (isSelected) {
          return { ...prev, [questionId]: currentAnswers.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, optionId] };
        }
      }
    });
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey || !user) return;

    setSubmitting(true);
    
    const surveyAnswers: SurveyAnswer[] = Object.entries(answers).map(([questionId, optionIds]) => ({
      questionId: Number(questionId),
      selectedOptionIds: optionIds
    }));

    const success = await submitAnswers(selectedSurvey.id!, surveyAnswers);
    
    if (success) {
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedSurvey(null);
        setSubmitSuccess(false);
      }, 2000);
    }
    
    setSubmitting(false);
  };

  const isAnswerComplete = () => {
    if (!selectedSurvey) return false;
    
    return selectedSurvey.questions.every(question => {
      const answer = answers[question.id!];
      return answer && answer.length > 0;
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Ładowanie ankiet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <ChartBarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ankiety i Głosowania</h1>
        <p className="text-gray-600">Wypełnij ankiety organizatorów</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dostępne Ankiety</h2>
        
        {!Array.isArray(surveys) || surveys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Brak dostępnych ankiet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(surveys) && surveys.map((survey) => (
              <div key={survey.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900">{survey.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{survey.description}</p>
                <button 
                  onClick={() => handleSurveyClick(survey.id!)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Wypełnij ankietę
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal z ankietą */}
      {selectedSurvey && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedSurvey(null)}
          title={selectedSurvey.title}
        >
          <div className="space-y-6">
            <p className="text-gray-600">{selectedSurvey.description}</p>
            
            {submitSuccess ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">Ankieta wysłana!</h3>
                <p className="text-green-600">Dziękujemy za wypełnienie ankiety.</p>
              </div>
            ) : (
              <>
                {selectedSurvey.questions.map((question, questionIndex) => (
                  <div key={question.id} className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      {questionIndex + 1}. {question.text}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {question.type === 'SINGLE' ? 'Wybierz jedną odpowiedź' : 'Możesz wybrać kilka odpowiedzi'}
                    </p>
                    
                    <div className="space-y-2">
                      {question.surveyOptions.map((option) => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type={question.type === 'SINGLE' ? 'radio' : 'checkbox'}
                            name={`question-${question.id}`}
                            checked={answers[question.id!]?.includes(option.id!) || false}
                            onChange={() => handleAnswerChange(question.id!, option.id!, question.type)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedSurvey(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSubmitSurvey}
                    disabled={!isAnswerComplete() || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Wysyłanie...</span>
                      </>
                    ) : (
                      <span>Wyślij odpowiedzi</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}