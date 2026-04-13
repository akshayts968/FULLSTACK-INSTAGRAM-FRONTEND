import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/signup`, {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        name: formData.name
      });

      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      navigate("/profile");
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-main">
      <div className="signup-content">
        <div className="signup-box">
          {/* Re-using the logo from Login */}
          <img 
            className="signup-logo" 
            src="/pixelforge-logo.png" 
            alt="PixelForge" 
          />
          <h2 style={{ margin: '8px 0 6px', color: '#fff' }}>PixelForge</h2>
          <p className="signup-subtitle">
            Sign up to see photos and videos from your friends.
          </p>
          
          <button className="signup-btn" style={{ width: '100%', marginBottom: '15px' }} type="button">
            <i className="fa-brands fa-square-facebook" style={{ marginRight: '8px' }}></i>
            Log in with Facebook
          </button>
          
          <div className="signup-divider">
            <div className="line"></div>
            <span>OR</span>
            <div className="line"></div>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                className="signup-input"
                type="email"
                name="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-group">
              <input
                className="signup-input"
                type="text"
                name="name"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                className="signup-input"
                type="text"
                name="username"
                placeholder="Username"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-group">
              <input
                className="signup-input"
                type="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <p className="signup-terms">
              By signing up, you agree to our Terms, Data Policy and Cookies Policy.
            </p>
            
            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Sign Up'}
            </button>

            {errorMsg && <div className="error-banner">{errorMsg}</div>}
          </form>
        </div>

        <div className="signup-login-box">
          <p>
            Have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;