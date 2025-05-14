import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useUser } from '../contexts/UserContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import UserNavbar from '../components/UserNavbar';

const EditDeck = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const { user: contextUser } = useUser();
    const [user, setUser] = useState(contextUser);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Initialize deck data
    const [deckData, setDeckData] = useState({
        title: '',
        description: '',
        category: '',
        flashcards: []
    });
    
    // Track original flashcards for comparison
    const [originalFlashcards, setOriginalFlashcards] = useState([]);

    // Ensure we have user data - fallback to localStorage if needed
    useEffect(() => {
        console.log("EditDeck - Context user:", contextUser);
        if (!contextUser) {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    console.log('EditDeck - Loaded user from localStorage:', userData);
                    setUser(userData);
                }
            } catch (err) {
                console.error('Failed to parse user from localStorage:', err);
            }
        } else {
            setUser(contextUser);
        }
    }, [contextUser]);

    // Verify authentication and fetch deck data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log("EditDeck - Authentication check:", { 
            hasToken: !!token, 
            hasUserData: !!userData,
            user,
            deckId
        });
        
        if (!token || !userData) {
            console.error("EditDeck - Not authenticated, redirecting to login");
            navigate('/login');
            return;
        }
        
        const fetchDeckData = async () => {
            if (!deckId) return;
            
            try {
                setIsLoading(true);
                setError('');
                
                // Fetch deck info
                const deckInfo = await flashcardService.getDeck(deckId);
                console.log('EditDeck - Fetched deck:', deckInfo);
                
                if (!deckInfo) {
                    setError("Deck not found");
                    return;
                }
                
                // Check if user owns this deck
                const userId = user?.id || user?.userId;
                if (deckInfo.userId !== userId) {
                    setError("You don't have permission to edit this deck");
                    setTimeout(() => navigate('/dashboard'), 2000);
                    return;
                }
                
                // Fetch flashcards for this deck
                const flashcards = await flashcardService.getFlashcards(deckId);
                console.log('EditDeck - Fetched flashcards:', flashcards);
                
                // Set deck data
                setDeckData({
                    title: deckInfo.title || '',
                    description: deckInfo.description || '',
                    category: deckInfo.category || '',
                    flashcards: flashcards.length > 0 ? flashcards : [
                        { term: '', definition: '' }
                    ]
                });
                
                // Store original flashcards for comparison
                setOriginalFlashcards(flashcards);
                
            } catch (error) {
                console.error('Failed to fetch deck data:', error);
                setError('Failed to load deck. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchDeckData();
    }, [deckId, navigate, user]);

    // Handle input change for deck information
    const handleDeckChange = (e) => {
        const { name, value } = e.target;
        setDeckData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle flashcard changes
    const handleFlashcardChange = (index, field, value) => {
        const updatedFlashcards = [...deckData.flashcards];
        updatedFlashcards[index] = {
            ...updatedFlashcards[index],
            [field]: value
        };
        setDeckData(prev => ({
            ...prev,
            flashcards: updatedFlashcards
        }));
    };

    // Add a new empty flashcard
    const addFlashcard = () => {
        setDeckData(prev => ({
            ...prev,
            flashcards: [...prev.flashcards, { term: '', definition: '' }]
        }));
    };

    // Remove a flashcard
    const removeFlashcard = (index) => {
        if (deckData.flashcards.length <= 1) {
            setError('You need at least one flashcard');
            return;
        }

        const updatedFlashcards = deckData.flashcards.filter((_, i) => i !== index);
        setDeckData(prev => ({
            ...prev,
            flashcards: updatedFlashcards
        }));
    };

    // Save the updated deck
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Validate deck data
            if (!deckData.title.trim()) {
                throw new Error('Title is required');
            }

            // Validate flashcards - filter valid ones
            const validFlashcards = deckData.flashcards.filter(card => 
                card.term.trim() && card.definition.trim()
            );

            if (validFlashcards.length === 0) {
                throw new Error('Please create at least one flashcard with both question and answer');
            }

            // Get user ID
            const userId = user?.id || user?.userId;
            if (!userId) {
                throw new Error('User ID not available');
            }

            console.log('Updating deck for user ID:', userId);
            
            // Update the deck
            await flashcardService.updateDeck(deckId, {
                title: deckData.title,
                description: deckData.description,
                category: deckData.category,
                userId: userId
            });
            
            // Organize flashcards into categories
            const existingIds = new Set(originalFlashcards.map(card => card.id));
            const updatedIds = new Set(validFlashcards.filter(card => card.id).map(card => card.id));
            
            // Create new flashcards
            const createPromises = validFlashcards
                .filter(card => !card.id)
                .map(card => {
                    return flashcardService.createFlashcard({
                        deckId: deckId,
                        term: card.term,
                        definition: card.definition,
                        learned: false,
                        userId: userId
                    });
                });
            
            // Update existing flashcards
            const updatePromises = validFlashcards
                .filter(card => card.id && existingIds.has(card.id))
                .map(card => {
                    return flashcardService.updateFlashcard(card.id, {
                        term: card.term,
                        definition: card.definition,
                        deckId: deckId,
                        userId: userId
                    });
                });
            
            // Delete removed flashcards
            const deletePromises = originalFlashcards
                .filter(card => !updatedIds.has(card.id))
                .map(card => flashcardService.deleteFlashcard(card.id));
            
            // Execute all operations
            await Promise.all([
                ...createPromises,
                ...updatePromises,
                ...deletePromises
            ]);
            
            setSuccess('Your flashcard deck has been updated successfully!');
            
            // Navigate back after a short delay
            setTimeout(() => {
                navigate(`/decks/${deckId}`);
            }, 1500);
        } catch (err) {
            console.error('Failed to update deck:', err);
            setError(err.message || 'Failed to update deck. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/decks/${deckId}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl">Loading deck data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <UserNavbar user={user} isLoggedIn={!!user} onLogout={() => {}} />
            
            <div className="max-w-5xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Edit Flashcard Deck</h1>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Deck Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Deck Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={deckData.title}
                                    onChange={handleDeckChange}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter deck title"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={deckData.description}
                                    onChange={handleDeckChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Describe what this deck is about"
                                ></textarea>
                            </div>
                            
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={deckData.category}
                                    onChange={handleDeckChange}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a category</option>
                                    <option value="Language">Language</option>
                                    <option value="Science">Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="History">History</option>
                                    <option value="Geography">Geography</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Flashcards Editor Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Flashcards</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {deckData.flashcards.map((flashcard, index) => (
                                <div key={index} className="p-4 border rounded-md bg-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-medium">Card {index + 1}</h3>
                                        <button
                                            type="button"
                                            onClick={() => removeFlashcard(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Question
                                            </label>
                                            <input
                                                type="text"
                                                value={flashcard.term}
                                                onChange={(e) => handleFlashcardChange(index, 'term', e.target.value)}
                                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter question"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Answer
                                            </label>
                                            <textarea
                                                value={flashcard.definition}
                                                onChange={(e) => handleFlashcardChange(index, 'definition', e.target.value)}
                                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                rows="2"
                                                placeholder="Enter answer"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addFlashcard}
                                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
                            >
                                + Add Another Card
                            </button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDeck; 