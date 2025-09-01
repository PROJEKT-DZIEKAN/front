'use client';

import { useState, useEffect, useCallback } from 'react';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest, SurveyAnswer } from '@/types/survey';
import { 
  getAllSurveys, 
  getSurvey, 
  createSurvey, 
  updateSurvey, 
  deleteSurvey, 
  submitSurveyAnswers 
} from '@/utils/apiClient';
import { useAuth } from './useAuth';

export const useSurveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Pobieranie wszystkich ankiet
  const fetchSurveys = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const surveysData = await getAllSurveys();
      setSurveys(surveysData);
    } catch (err) {
      console.error('Błąd pobierania ankiet:', err);
      setError('Nie udało się pobrać ankiet');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Pobieranie pojedynczej ankiety
  const fetchSurvey = useCallback(async (surveyId: number): Promise<Survey | null> => {
    if (!isAuthenticated) return null;
    
    try {
      const survey = await getSurvey(surveyId);
      return survey;
    } catch (err) {
      console.error(`Błąd pobierania ankiety ${surveyId}:`, err);
      setError('Nie udało się pobrać ankiety');
      return null;
    }
  }, [isAuthenticated]);

  // Tworzenie nowej ankiety (tylko admin)
  const createNewSurvey = useCallback(async (surveyData: CreateSurveyRequest): Promise<Survey | null> => {
    if (!isAuthenticated || !user) return null;
    
    setLoading(true);
    setError(null);
    try {
      const newSurvey = await createSurvey(surveyData);
      setSurveys(prev => [...prev, newSurvey]);
      return newSurvey;
    } catch (err) {
      console.error('Błąd tworzenia ankiety:', err);
      setError('Nie udało się utworzyć ankiety');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Aktualizacja ankiety (tylko admin)
  const updateExistingSurvey = useCallback(async (surveyId: number, surveyData: UpdateSurveyRequest): Promise<Survey | null> => {
    if (!isAuthenticated || !user) return null;
    
    setLoading(true);
    setError(null);
    try {
      const updatedSurvey = await updateSurvey(surveyId, surveyData);
      setSurveys(prev => prev.map(s => s.id === surveyId ? updatedSurvey : s));
      return updatedSurvey;
    } catch (err) {
      console.error(`Błąd aktualizacji ankiety ${surveyId}:`, err);
      setError('Nie udało się zaktualizować ankiety');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Usuwanie ankiety (tylko admin)
  const removeSurvey = useCallback(async (surveyId: number): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;
    
    setLoading(true);
    setError(null);
    try {
      await deleteSurvey(surveyId);
      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      return true;
    } catch (err) {
      console.error(`Błąd usuwania ankiety ${surveyId}:`, err);
      setError('Nie udało się usunąć ankiety');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Przesyłanie odpowiedzi na ankietę
  const submitAnswers = useCallback(async (surveyId: number, answers: SurveyAnswer[]): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;
    
    setLoading(true);
    setError(null);
    try {
      const success = await submitSurveyAnswers(surveyId, answers, user.id);
      return success;
    } catch (err) {
      console.error(`Błąd przesyłania odpowiedzi na ankietę ${surveyId}:`, err);
      setError('Nie udało się przesłać odpowiedzi');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Automatyczne pobieranie ankiet przy zalogowaniu
  useEffect(() => {
    if (isAuthenticated) {
      fetchSurveys();
    } else {
      setSurveys([]);
      setError(null);
    }
  }, [isAuthenticated, fetchSurveys]);

  return {
    surveys,
    loading,
    error,
    fetchSurveys,
    fetchSurvey,
    createNewSurvey,
    updateExistingSurvey,
    removeSurvey,
    submitAnswers,
    clearError: () => setError(null)
  };
};
