import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {

    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
async function DataCheck(event){
    event.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
        const response = await axios.post(`${process.env.REACT_APP_SERVER}/login`, {
          username: username,
          password: password
        });
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      navigate("/profile");
      } catch (error) {
        console.error('Login Error:', error);
        setErrorMsg(error.response?.data?.message || 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
}
    return (
        <div className="auth-main">
            <div className="auth-content">
                <div className="auth-left-visual">
                    <img src="https://media.gcflearnfree.org/content/633d944b3823fb02e84dce55_10_05_2022/Screen%20Shot%202022-10-10%20at%202.28.19%20PM.png" alt="Preview" />
                </div>
                <div className="auth-right">
                    <div className="auth-box">
                        <div className="auth-logo-wrap">
                            <img src="https://e7.pngegg.com/pngimages/712/1009/png-clipart-letter-instagram-font-instagram-text-logo-thumbnail.png" alt="" />
                        </div>
                        <div className="auth-form-wrap">
                            <form onSubmit={DataCheck} className="auth-form">
                                <input
                                  className="auth-input"
                                  type="text"
                                  name="username"
                                  placeholder="Phone number, username, or email"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  required
                                />
                                <input
                                  className="auth-input"
                                  type="password"
                                  name="password"
                                  placeholder="Password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                />
                                <button className="auth-btn" type="submit" disabled={loading}>
                                  {loading ? 'Logging in...' : 'Log in'}
                                </button>
                                <div className="auth-divider">
                                  <div className="line"></div>
                                  <span>OR</span>
                                  <div className="line"></div>
                                </div>
                                <button className="auth-facebook-btn" type="button">
                                  <i className="fa-brands fa-square-facebook"></i>
                                  <span>Continue with Facebook</span>
                                </button>
                                <button className="auth-link-btn" type="button">Forgot password?</button>
                                {errorMsg && <div className="auth-error">{errorMsg}</div>}
                            </form>
                        </div>
                    </div>
                    <div className="auth-switch-box">
                        <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                    </div>
                    <div className="auth-app-box">
                        <div className="auth-app-title">
                            <span>Get the app.</span>
                        </div>
                        <div className="auth-app-badges">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Get_it_from_Microsoft_Badge.svg/800px-Get_it_from_Microsoft_Badge.svg.png" alt="" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Get_it_from_Microsoft_Badge.svg/800px-Get_it_from_Microsoft_Badge.svg.png" alt="" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;