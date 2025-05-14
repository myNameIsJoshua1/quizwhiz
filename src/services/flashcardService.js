import api from './api';

export const flashcardService = {
  createDeck: async (deckData) => {
    // Map frontend field names to backend entity field names
    const backendDeckData = {
      subject: deckData.title || deckData.subject, // Use subject instead of title to match backend
      category: deckData.category || 'General',
      userId: deckData.userId
    };
    
    console.log('Creating deck with data:', backendDeckData);
    const response = await api.post('/decks', backendDeckData);
    return response.data;
  },

  getDecks: async () => {
    const response = await api.get('/decks');
    return response.data;
  },
  
  getDecksByUserId: async (userId) => {
    console.log('Fetching decks for userId:', userId);
    // Fetch all decks then filter by userId (if backend doesn't have a direct endpoint)
    const response = await api.get('/decks');
    // Map backend field names to frontend expected names
    const decks = response.data.map(deck => ({
      id: deck.id,
      title: deck.subject, // Map subject to title for frontend
      description: deck.category,
      category: deck.category,
      userId: deck.userId,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt
    }));
    
    // Filter decks by userId
    return decks.filter(deck => deck.userId === userId);
  },

  getDeck: async (deckId) => {
    const response = await api.get(`/decks/${deckId}`);
    // Map backend field names to frontend expected names
    const deck = response.data;
    return {
      id: deck.id,
      title: deck.subject, // Map subject to title for frontend
      description: deck.category,
      category: deck.category,
      userId: deck.userId,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt
    };
  },

  updateDeck: async (deckId, deckData) => {
    // Map frontend field names to backend entity field names
    const backendDeckData = {
      subject: deckData.title || deckData.subject,
      category: deckData.category,
      userId: deckData.userId
    };
    
    const response = await api.put(`/decks/${deckId}`, backendDeckData);
    return response.data;
  },

  deleteDeck: async (deckId) => {
    await api.delete(`/decks/${deckId}`);
  },

  createFlashcard: async (flashcardData) => {
    // Map frontend field names to backend entity field names
    const backendFlashcardData = {
      question: flashcardData.term, // Frontend term maps to backend question
      answer: flashcardData.definition, // Frontend definition maps to backend answer
      learned: flashcardData.learned || false,
      deckId: flashcardData.deckId
    };
    
    console.log('Creating flashcard with data:', backendFlashcardData);
    const response = await api.post('/flashcards', backendFlashcardData);
    return response.data;
  },

  getFlashcards: async (deckId) => {
    const response = await api.get(`/flashcards/getByDeckId/${deckId}`);
    
    // Map backend field names to frontend expected names
    return response.data.map(flashcard => ({
      id: flashcard.id,
      term: flashcard.question,  // Backend question maps to frontend term 
      definition: flashcard.answer, // Backend answer maps to frontend definition
      learned: flashcard.learned,
      deckId: flashcard.deckId
    }));
  },

  getFlashcardById: async (flashcardId) => {
    const response = await api.get(`/flashcards/${flashcardId}`);
    const flashcard = response.data;
    
    // Map backend field names to frontend expected names
    return {
      id: flashcard.id,
      term: flashcard.question,  // Map question to term for frontend
      definition: flashcard.answer, // Map answer to definition for frontend
      learned: flashcard.learned,
      deckId: flashcard.deckId
    };
  },

  updateFlashcard: async (flashcardId, flashcardData) => {
    // Map frontend field names to backend entity field names
    const backendFlashcardData = {
      question: flashcardData.term,
      answer: flashcardData.definition,
      learned: flashcardData.learned !== undefined ? flashcardData.learned : false,
      deckId: flashcardData.deckId
    };
    
    const response = await api.put(`/flashcards/${flashcardId}`, backendFlashcardData);
    return response.data;
  },

  deleteFlashcard: async (flashcardId) => {
    await api.delete(`/flashcards/${flashcardId}`);
  },
  
  toggleFlashcardLearned: async (flashcardId, isLearned) => {
    const flashcard = await this.getFlashcardById(flashcardId);
    flashcard.learned = isLearned;
    return await this.updateFlashcard(flashcardId, flashcard);
  }
}; 