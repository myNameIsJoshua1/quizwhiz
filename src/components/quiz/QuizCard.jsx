import React, { useState } from 'react';
import { quizService } from '../../services/quizService';
import { useToast } from '../../hooks/use-toast';

export function QuizCard({ quizId, card, onNext }) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await quizService.submitAnswer(quizId, card.id, answer);
      setIsCorrect(result.correct);
      setShowResult(true);

      if (result.correct) {
        addToast({
          title: 'Correct!',
          description: 'Well done!',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Incorrect',
          description: `The correct answer was: ${card.answer}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to submit answer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setAnswer('');
    setShowResult(false);
    onNext();
  };

  return (
    <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Question</h3>
      <p className="text-lg mb-6">{card.question}</p>

      {!showResult ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              isCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <h4 className="font-semibold mb-2">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            <p>
              <span className="font-medium">Your answer:</span> {answer}
            </p>
            {!isCorrect && (
              <p>
                <span className="font-medium">Correct answer:</span> {card.answer}
              </p>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next Question
          </button>
        </div>
      )}
    </div>
  );
} 