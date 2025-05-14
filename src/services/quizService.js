import api from './api';

export const quizService = {
  // Create a new quiz
  createQuiz: async (quizData) => {
    const response = await api.post('/quiz/add', quizData);
    return response.data;
  },

  // Get all quizzes
  getAllQuizzes: async () => {
    const response = await api.get('/quiz/get');
    return response.data;
  },

  // Get a quiz by ID
  getQuizById: async (quizId) => {
    const response = await api.get(`/quiz/get/${quizId}`);
    return response.data;
  },

  // Get quizzes by flashcard ID
  getQuizzesByFlashcardId: async (flashcardId) => {
    const response = await api.get(`/quiz/getByFlashcardId/${flashcardId}`);
    return response.data;
  },

  // Update a quiz
  updateQuiz: async (quizId, quizData) => {
    // Make sure quizId is set in the data
    const updatedData = {
      ...quizData,
      quizModeId: quizId
    };
    
    const response = await api.put('/quiz/update', updatedData);
    return response.data;
  },

  // Delete a quiz
  deleteQuiz: async (quizId) => {
    await api.delete(`/quiz/delete/${quizId}`);
  },

  // Get flashcards for a quiz
  getFlashcardsForQuiz: async (quizId) => {
    const response = await api.get(`/quiz/${quizId}/flashcards`);
    return response.data;
  },

  // Complete a quiz and save the result
  completeQuiz: async (userId, quizId, score) => {
    try {
      const response = await api.post('/quiz/complete', null, {
        params: {
          userId,
          quizId,
          score
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save quiz result to backend:', error);
      
      // Create a pending quiz submission to be synced later
      const pendingQuizzes = JSON.parse(localStorage.getItem('pendingQuizzes') || '[]');
      pendingQuizzes.push({
        userId,
        quizId,
        score,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pendingQuizzes', JSON.stringify(pendingQuizzes));
      console.log('Quiz result saved locally for later sync');
      
      // Return a mock success response so UI flow is not interrupted
      return {
        success: true,
        offline: true,
        message: 'Quiz result saved locally'
      };
    }
  },

  startQuiz: async (deckId) => {
    const response = await api.post(`/quiz/start/${deckId}`);
    return response.data;
  },

  submitAnswer: async (quizId, flashcardId, answer) => {
    const response = await api.post(`/quiz/${quizId}/answer`, {
      flashcardId,
      answer
    });
    return response.data;
  },

  getQuizResults: async (quizId) => {
    const response = await api.get(`/quiz/${quizId}/results`);
    return response.data;
  },

  getUserProgress: async () => {
    const response = await api.get('/progress');
    return response.data;
  },

  getAchievements: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },

  reviewFlashcard: async (flashcardId, status) => {
    const response = await api.post(`/review/${flashcardId}`, { status });
    return response.data;
  },

  getReviewStats: async () => {
    const response = await api.get('/review/stats');
    return response.data;
  }
}; 