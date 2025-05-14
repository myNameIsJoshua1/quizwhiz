import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardService } from '../../services/flashcardService';
import { useToast } from '../../hooks/use-toast';

export function FlashcardDeck({ deck, onDelete }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleStartQuiz = async () => {
    try {
      setIsLoading(true);
      const quiz = await flashcardService.startQuiz(deck.id);
      navigate(`/quiz/${quiz.id}`);
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to start quiz',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      try {
        setIsLoading(true);
        await flashcardService.deleteDeck(deck.id);
        onDelete(deck.id);
        addToast({
          title: 'Success',
          description: 'Deck deleted successfully',
        });
      } catch (error) {
        addToast({
          title: 'Error',
          description: 'Failed to delete deck',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{deck.title}</h3>
          <p className="text-gray-600 mt-1">{deck.description}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {deck.cardCount} cards • Created {new Date(deck.createdAt).toLocaleDateString()}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => navigate(`/decks/${deck.id}`)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            View Cards
          </button>
          <button
            onClick={handleStartQuiz}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
} 