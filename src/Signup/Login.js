import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSavedAccounts } from '../utils/accountStorage';

function Login() {

    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastTap, setLastTap] = useState({ accountId: null, time: 0 });
    const savedAccounts = getSavedAccounts();
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
      sessionStorage.setItem('prompt_save_account_after_login', '1');
      navigate('/home');
      } catch (error) {
        console.error('Login Error:', error);
        setErrorMsg(error.response?.data?.message || 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
}

    const handleSavedAccountTap = (acc) => {
      const now = Date.now();
      if (lastTap.accountId === acc._id && now - lastTap.time <= 350) {
        localStorage.setItem('user', JSON.stringify(acc));
        navigate('/home');
        setLastTap({ accountId: null, time: 0 });
        return;
      }
      setLastTap({ accountId: acc._id, time: now });
    };

    return (
        <div className="auth-main">
            <div className="auth-content">
                <div className="auth-left-visual">
                    <img src="https://is.zobj.net/image-server/v1/images?r=KvsSgJSlBmD3ZcjU342RtEx7aRL99lkTHgkmB1ozHiS1oQkMwoaRt4SiMBdpZ1ESdRfmHdMvMt5_bApVd0mOE6LA4zZZfUJAJAfFoKfhgaHaSY2WmJhqjH1YIymX6tbVmAU2HQYiFY_SWrdGBf60daQAa80DxtJuu91yVXO9VOZB4JhxTUgvLti-_uQqIf463ctVMRx0cv3DDd2AcaFIM940f55PRqb-XnAT3A" alt="Preview" />
                </div>
                <div className="auth-right">
                    <div className="auth-box">
                        <div className="auth-logo-wrap">
                            <img src="/pixelforge-logo.png" alt="PixelForge" />
                            <h2 style={{ marginTop: 10, color: '#fff' }}>PixelForge</h2>
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
                            {savedAccounts.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ color: '#a8a8a8', fontSize: 12, marginBottom: 8 }}>Saved accounts</div>
                                <div style={{ color: '#8f8f8f', fontSize: 11, marginBottom: 6 }}>Double tap an account to switch</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {savedAccounts.slice(0, 4).map((acc) => (
                                    <button
                                      key={acc._id}
                                      type="button"
                                      className="auth-link-btn"
                                      onClick={() => handleSavedAccountTap(acc)}
                                    >
                                      Continue as @{acc.username}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
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