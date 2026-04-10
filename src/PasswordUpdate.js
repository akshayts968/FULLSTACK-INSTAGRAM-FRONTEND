import React, { useState } from 'react';

const PasswordUpdate = ({  }) => {
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const userId="66970ad6d9a73b991038c76a"
    // Handle input change
    const handleInputChange = (e) => {
        setNewPassword(e.target.value);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!newPassword) {
            setError('New password is required');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER}/user/${userId}/forgotten`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage('Password updated successfully');
                setError('');
            } else {
                setMessage('');
                setError(result.message || 'An error occurred');
            }
        } catch (err) {
            setMessage('');
            setError('Server error. Please try again later.');
        }
    };

    return (
        <div>
            <h2>Update Your Password</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="newPassword">New Password:</label>
                <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={handleInputChange}
                    required
                />
                <button type="submit">Update Password</button>
            </form>

            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default PasswordUpdate;
