'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
import { Survey, CreateSurveyRequest } from '@/types/survey';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';

interface QuestionFormData {
  text: string;
  type: 'SINGLE' | 'MULTIPLE';
  options: string[];
}

export default function AdminSurveyManager() {
  const { AllSurveys, loading, error, createNewSurvey, updateExistingSurvey, removeSurvey } = useSurveys();
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

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Brak uprawnień</h2>
        <p className="text-gray-600">Tylko administratorzy mogą zarządzać ankietami</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', questions: [] });
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
      questions: Array.isArray(survey.questions) ? survey.questions.map(q => ({
        text: q.text,
        type: q.type,
        options: Array.isArray(q.surveyOptions) ? q.surveyOptions.map(o => o.text) : []
      })) : []
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
        i === questionIndex ? { ...q, options: [...q.options, ''] } : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, j) => j === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.filter((_, j) => j !== optionIndex)
        } : q
      )
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || formData.questions.length === 0) return;

    const validQuestions = formData.questions.filter(q => 
      q.text.trim() && q.options.length > 0 && q.options.every(opt => opt.trim())
    );

    if (validQuestions.length === 0) return;

    setProcessing(true);
    try {
      const surveyData: CreateSurveyRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        questions: validQuestions.map(q => ({
          text: q.text.trim(),
          type: q.type,
          surveyOptions: q.options.map(opt => ({ text: opt.trim() }))
        }))
      };

              if (editingSurvey && editingSurvey.id) {
          await updateExistingSurvey(editingSurvey.id, surveyData);
        } else {
          await createNewSurvey(surveyData);
        }

      setShowCreateModal(false);
      resetForm();
      setEditingSurvey(null);
    } catch (error) {
      console.error('Error saving survey:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSurvey = async (survey: Survey) => {
    if (!confirm(`Czy na pewno chcesz usunąć ankietę "${survey.title}"?`)) return;
    
    setDeletingSurvey(survey);
    try {
      if (survey.id) {
        await removeSurvey(survey.id);
      }
      setDeletingSurvey(null);
    } catch (error) {
      console.error('Error deleting survey:', error);
      setDeletingSurvey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Zarządzanie ankietami</h2>
          <p className="text-sm text-gray-600">Twórz i edytuj ankiety dla użytkowników</p>
        </div>
        <Button onClick={handleCreateSurvey}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nowa ankieta
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : AllSurveys.length === 0 ? (
        <div className="text-center py-12">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Brak ankiet w systemie</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {AllSurveys.map((survey) => (
            <div key={survey.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{survey.title}</h3>
                  {survey.description && (
                    <p className="text-sm text-gray-700 mb-3">{survey.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Pytania: {survey.questions?.length || 0}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditSurvey(survey)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteSurvey(survey)}
                    disabled={deletingSurvey?.id === survey.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSurvey(null);
          resetForm();
        }}
        title={editingSurvey ? `Edytuj ankietę: ${editingSurvey.title}` : 'Nowa ankieta'}
      >
        <div className="space-y-4">
          <Input
            label="Tytuł ankiety *"
            placeholder="Wprowadź tytuł ankiety"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <TextArea
            label="Opis ankiety"
            placeholder="Opisz cel ankiety"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Pytania *</label>
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Dodaj pytanie
              </Button>
            </div>
            
            {formData.questions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Dodaj przynajmniej jedno pytanie
              </p>
            )}
            
            <div className="space-y-4">
              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Treść pytania"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3 text-black">
                    <Select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, 'type', e.target.value as 'SINGLE' | 'MULTIPLE')}
                      options={[
                        { value: 'SINGLE', label: 'Jedna odpowiedź' },
                        { value: 'MULTIPLE', label: 'Wiele odpowiedzi' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Opcje odpowiedzi</label>
                      <Button size="sm" variant="outline" onClick={() => addOption(qIndex)}>
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Dodaj opcję
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2">
                          <Input
                            placeholder={`Opcja ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            required
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={question.options.length <= 1}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.title.trim() || formData.questions.length === 0 || processing}
            >
              {processing ? 'Zapisywanie...' : (editingSurvey ? 'Zapisz zmiany' : 'Utwórz ankietę')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingSurvey(null);
                resetForm();
              }}
            >
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
