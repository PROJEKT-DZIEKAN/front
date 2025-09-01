'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
import { Survey, CreateSurveyRequest } from '@/types/survey';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from './ui/Button';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Select from './ui/Select';
import Card from './ui/Card';
import Alert from './ui/Alert';

interface QuestionFormData {
  text: string;
  type: 'SINGLE' | 'MULTIPLE';
  options: string[];
}

export default function SurveyTestPanel() {
  const { surveys, loading, error, createNewSurvey, updateExistingSurvey, removeSurvey } = useSurveys();
  const { isAdmin, isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [] as QuestionFormData[]
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Brak autoryzacji</h2>
        <p className="text-gray-600">Zaloguj się aby uzyskać dostęp do ankiet</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Brak uprawnień</h2>
        <p className="text-gray-600">Tylko administratorzy mogą zarządzać ankietami</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      questions: []
    });
  };

  const handleCreateSurvey = () => {
    resetForm();
    setEditingSurvey(null);
    setShowCreateModal(true);
  };

  const handleEditSurvey = (survey: Survey) => {
    setFormData({
      title: survey.title,
      description: survey.description,
      questions: survey.questions.map(q => ({
        text: q.text,
        type: q.type,
        options: q.surveyOptions.map(o => o.text)
      }))
    });
    setEditingSurvey(survey);
    setShowCreateModal(true);
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', type: 'SINGLE', options: [''] }]
    }));
  };

  const updateQuestion = (index: number, field: keyof QuestionFormData, value: string | 'SINGLE' | 'MULTIPLE') => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const addOption = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
            }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q
      )
    }));
  };

  const handleSubmitSurvey = async () => {
    if (!formData.title.trim() || formData.questions.length === 0) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }

    setProcessing(true);

    const surveyRequest: CreateSurveyRequest = {
      title: formData.title,
      description: formData.description,
      questions: formData.questions.map(q => ({
        text: q.text,
        type: q.type,
        surveyOptions: q.options.filter(opt => opt.trim()).map(opt => ({ text: opt.trim() }))
      }))
    };

    try {
      if (editingSurvey) {
        await updateExistingSurvey(editingSurvey.id!, {
          ...surveyRequest,
          questions: surveyRequest.questions.map((q, i) => ({
            ...q,
            id: editingSurvey.questions[i]?.id,
            surveyOptions: q.surveyOptions.map((opt, oi) => ({
              ...opt,
              id: editingSurvey.questions[i]?.surveyOptions[oi]?.id
            }))
          }))
        });
      } else {
        await createNewSurvey(surveyRequest);
      }
      
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Błąd podczas zapisywania ankiety:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSurvey = async () => {
    if (!deletingSurvey) return;

    setProcessing(true);
    const success = await removeSurvey(deletingSurvey.id!);
    
    if (success) {
      setDeletingSurvey(null);
    }
    
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Ładowanie ankiet...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Panelu Ankiet</h1>
          <p className="text-gray-600">Twórz i edytuj ankiety dla uczestników</p>
        </div>
        <Button onClick={handleCreateSurvey} className="flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Nowa Ankieta</span>
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Błąd">
          {error}
        </Alert>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lista Ankiet ({surveys.length})
        </h2>

        {surveys.length === 0 ? (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Brak ankiet do wyświetlenia</p>
            <Button onClick={handleCreateSurvey} className="mt-4">
              Utwórz pierwszą ankietę
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{survey.title}</h3>
                    <p className="text-gray-600 mb-3">{survey.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{survey.questions.length} pytań</span>
                      {survey.createdAt && (
                        <span>Utworzono: {new Date(survey.createdAt).toLocaleDateString('pl-PL')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditSurvey(survey)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edytuj"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeletingSurvey(survey)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Usuń"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal tworzenia/edycji ankiety */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSurvey ? 'Edytuj Ankietę' : 'Nowa Ankieta'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tytuł ankiety *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Wprowadź tytuł ankiety"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opis ankiety
                  </label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Wprowadź opis ankiety"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Pytania</h3>
                  <Button onClick={addQuestion} size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Dodaj pytanie
                  </Button>
                </div>

                {formData.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Pytanie {questionIndex + 1}</h4>
                      <button
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Treść pytania
                        </label>
                        <Input
                          value={question.text}
                          onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                          placeholder="Wprowadź treść pytania"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Typ odpowiedzi
                        </label>
                        <Select
                          value={question.type}
                          onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
                          options={[
                            { value: 'SINGLE', label: 'Jedna odpowiedź' },
                            { value: 'MULTIPLE', label: 'Wiele odpowiedzi' }
                          ]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opcje odpowiedzi
                      </label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            placeholder={`Opcja ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <button
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="text-red-500 hover:text-red-700"
                            disabled={question.options.length <= 1}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <Button
                        onClick={() => addOption(questionIndex)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Dodaj opcję
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={processing}
                >
                  Anuluj
                </Button>
                <Button
                  onClick={handleSubmitSurvey}
                  disabled={processing || !formData.title.trim() || formData.questions.length === 0}
                  className="flex items-center space-x-2"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Zapisywanie...</span>
                    </>
                  ) : (
                    <span>{editingSurvey ? 'Zaktualizuj' : 'Utwórz'} ankietę</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia */}
      {deletingSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Potwierdź usunięcie</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Czy na pewno chcesz usunąć ankietę &quot;{deletingSurvey.title}&quot;? 
                Ta operacja jest nieodwracalna.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeletingSurvey(null)}
                  disabled={processing}
                >
                  Anuluj
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteSurvey}
                  disabled={processing}
                  className="flex items-center space-x-2"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Usuwanie...</span>
                    </>
                  ) : (
                    <span>Usuń ankietę</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
