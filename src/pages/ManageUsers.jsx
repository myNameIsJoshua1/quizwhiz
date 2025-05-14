import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const fetchedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple fetches
        if (fetchedRef.current) return;
        
        const fetchUsers = async () => {
            try {
                const data = await userService.getUsers();
                setUsers(data);
                setFilteredUsers(data);
                fetchedRef.current = true;
            } catch (err) {
                console.error('Error fetching users list:', err);
                setError('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - intentional to only run once

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.deleteUser(userId);
            const updatedUsers = users.filter((user) => user.userId !== userId);
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleMore = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

    const handleRoleFilterChange = (e) => {
        const role = e.target.value;
        setSelectedRole(role);

        if (role === '') {
            setFilteredUsers(users);
        } else if (role === 'Empty') {
            setFilteredUsers(users.filter((user) => !user.role || user.role === ''));
        } else {
            setFilteredUsers(users.filter((user) => user.role === role));
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        const filtered = users.filter(
            (user) =>
                user.userId.toLowerCase().includes(query) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(query)
        );

        setFilteredUsers(filtered);
    };

    if (loading) return <p className="text-center text-gray-500">Loading users...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="flex justify-center items-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl">
                <h1 className="text-2xl font-bold mb-4 text-center">Manage Users</h1>

                <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <label htmlFor="search" className="mr-2 text-gray-700 font-medium">
                            Search:
                        </label>
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by name or ID"
                            className="border border-gray-300 rounded px-3 py-1"
                        />
                    </div>
                    <div className="flex items-center">
                        <label htmlFor="roleFilter" className="mr-2 text-gray-700 font-medium">
                            Filter by Role:
                        </label>
                        <select
                            id="roleFilter"
                            value={selectedRole}
                            onChange={handleRoleFilterChange}
                            className="border border-gray-300 rounded px-3 py-1"
                        >
                            <option value="">All</option>
                            <option value="TEACHER">TEACHER</option>
                            <option value="STUDENT">STUDENT</option>
                            <option value="Empty">Empty</option>
                        </select>
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-100">
                                        <td className="border border-gray-300 px-4 py-2">{user.userId}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                                        <td className="border border-gray-300 px-4 py-2">{user.role || 'Empty'}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleMore(user.userId)}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                >
                                                    More
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.userId)}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;