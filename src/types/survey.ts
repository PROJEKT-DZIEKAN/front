export interface SurveyOption {
  id?: number;
  text: string;
}

export interface SurveyQuestion {
  id?: number;
  text: string;
  type: 'SINGLE' | 'MULTIPLE';
  surveyOptions: SurveyOption[];
}

export interface Survey {
  id?: number;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SurveyAnswer {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SurveyResponse {
  surveyId: number;
  userId: number;
  answers: SurveyAnswer[];
}

export interface CreateSurveyRequest {
  title: string;
  description: string;
  questions: Omit<SurveyQuestion, 'id'>[];
}

export interface UpdateSurveyRequest {
  title: string;
  description: string;
  questions: SurveyQuestion[];
}
