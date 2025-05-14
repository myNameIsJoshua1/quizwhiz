import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { flashcardService } from '../services/flashcardService';

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const fetchedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple fetches
        if (fetchedRef.current) return;
        
        const fetchData = async () => {
            try {
                const userResponse = await userService.getUserById(userId);
                const decksResponse = await flashcardService.getDecks();
                setUser(userResponse);
                setDecks(decksResponse.filter((deck) => deck.userId === userId)); // Filter decks by owner
                fetchedRef.current = true;
            } catch (err) {
                console.error('Error fetching user details:', err);
                setError('Failed to fetch user details or decks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);  // Empty dependency array to only run once

    const handleViewFlashcards = (deckId) => {
        navigate(`/decks/${deckId}/flashcards`);
    };

    const handleDeleteDeck = async (deckId) => {
        if (!window.confirm('Are you sure you want to delete this deck?')) return;

        try {
            await flashcardService.deleteDeck(deckId);
            setDecks(decks.filter((deck) => deck.id !== deckId));
        } catch (err) {
            alert('Failed to delete deck');
        }
    };

    if (loading) return <p>Loading user details...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)} // Navigate back to the previous page
                className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
                Back
            </button>
            <h1 className="text-2xl font-bold mb-4">User Details</h1>
            <div className="mb-6">
                <p><strong>ID:</strong> {user.userId}</p>
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role || 'Empty'}</p>
            </div>
            <h2 className="text-xl font-bold mb-4">Decks</h2>
            {decks.length === 0 ? (
                <p>No decks found for this user.</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
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
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        >
                                            Flashcards
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDeck(deck.id)}
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
    );
};

export default UserDetails;