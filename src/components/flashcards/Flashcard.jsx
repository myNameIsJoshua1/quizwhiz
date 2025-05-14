import React, { useState } from 'react';
import { flashcardService } from '../../services/flashcardService';
import { useToast } from '../../hooks/use-toast';

export function Flashcard({ card, onDelete, onEdit }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        setIsLoading(true);
        await flashcardService.deleteFlashcard(card.id);
        onDelete(card.id);
        addToast({
          title: 'Success',
          description: 'Flashcard deleted successfully',
        });
      } catch (error) {
        addToast({
          title: 'Error',
          description: 'Failed to delete flashcard',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMarkReview = async (status) => {
    try {
      setIsLoading(true);
      await flashcardService.reviewFlashcard(card.id, status);
      addToast({
        title: 'Success',
        description: `Marked as ${status}`,
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update review status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative h-64 w-full perspective-1000 ${
        isFlipped ? 'rotate-y-180' : ''
      }`}
    >
      <div
        className={`absolute w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden border rounded-lg p-6 bg-white shadow-md">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Question</h3>
            <div className="space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isLoading}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="mt-4">{card.question}</p>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 border rounded-lg p-6 bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-4">Answer</h3>
          <p>{card.answer}</p>
          <div className="absolute bottom-6 left-6 right-6 flex justify-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkReview('needs_review');
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Need Review
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkReview('learned');
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Learned
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 