import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useDocumentTitle from '../components/useDocumentTitle';
import './Auth.css';

const Register = () => {
    useDocumentTitle('Đăng ký - KowFlix');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await authAPI.register(email, password);
            // Backend returns: { success: true, data: { user, token } }
            // So we need data.data.token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page">
            <header className="auth-header">
                <Link to="/" className="logo">KowFlix</Link>
            </header>

            <div className="auth-container">
                <form className="auth-form" onSubmit={handleRegister}>
                    <h1>Sign Up</h1>
                    {error && <div className="error-message" style={{ color: '#e87c03', marginBottom: '1rem' }}>{error}</div>}
                    <div className="form-group">
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit">Sign Up</button>

                    <div className="auth-footer">
                        <span>Already have an account?</span>
                        <Link to="/login" className="auth-link">Sign in now.</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
