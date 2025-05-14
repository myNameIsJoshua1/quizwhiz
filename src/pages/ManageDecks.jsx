import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';

const ManageDecks = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const data = await flashcardService.getDecks();
                setDecks(data);
            } catch (err) {
                setError('Failed to fetch decks');
            } finally {
                setLoading(false);
            }
        };

        fetchDecks();
    }, []);

    const handleDelete = async (deckId) => {
        if (!window.confirm('Are you sure you want to delete this deck?')) return;

        try {
            await flashcardService.deleteDeck(deckId);
            setDecks(decks.filter((deck) => deck.id !== deckId));
        } catch (err) {
            alert('Failed to delete deck');
        }
    };

    const handleEdit = (deckId) => {
        navigate(`/edit-deck/${deckId}`);
    };

    const handleViewFlashcards = (deckId) => {
        navigate(`/decks/${deckId}/flashcards`);
    };

    if (loading) return <p className="text-center text-gray-500">Loading decks...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="flex justify-center items-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl">
                <h1 className="text-2xl font-bold mb-4 text-center">Manage Decks</h1>
                {decks.length === 0 ? (
                    <p className="text-center text-gray-500">No decks found.</p>
                ) : (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Catgeory</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decks.map((deck) => (
                                <tr key={deck.id} className="hover:bg-gray-100">
                                    <td className="border border-gray-300 px-4 py-2">{deck.id}</td>
                                    <td className="border border-gray-300 px-4 py-2">{deck.subject}</td>
                                    <td className="border border-gray-300 px-4 py-2">{deck.category}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleViewFlashcards(deck.id)}
                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            >
                                                View Flashcards
                                            </button>
                                            <button
                                                onClick={() => handleEdit(deck.id)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(deck.id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ManageDecks;