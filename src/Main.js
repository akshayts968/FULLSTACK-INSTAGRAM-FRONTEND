import './Main.css';
import SideNavBar from './NavBar/SideNavBar';
import MainHome from './MainHome/MainHome';
import TopNav from './NavBar/TopNav';
import BottomNav from './NavBar/BottomNav';
import Dot3 from './Profile/Dot3';
import { useEffect, useState } from 'react';
import { saveCurrentAccount } from './utils/accountStorage';

function Main() {
  const [Dot, setDot] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const toggleDot = () => {
    setDot(prevDot => !prevDot);
  };

  useEffect(() => {
    const shouldPrompt = sessionStorage.getItem('prompt_save_account_after_login') === '1';
    if (shouldPrompt && currentUser?._id) {
      setShowSavePrompt(true);
    }
    sessionStorage.removeItem('prompt_save_account_after_login');
  }, [currentUser?._id]);

  const handleSavePrompt = (shouldSave) => {
    if (shouldSave && currentUser) saveCurrentAccount(currentUser);
    setShowSavePrompt(false);
  };

  return (
    <div className="Main">
      {Dot && <Dot3 toggle={toggleDot}/>}
      {showSavePrompt && (
        <div className="main-save-overlay">
          <div className="main-save-modal">
            <h4>Save account?</h4>
            <p>Do you want to save @{currentUser?.username} on this device for quick switch?</p>
            <div className="main-save-actions">
              <button className="main-save-btn primary" onClick={() => handleSavePrompt(true)}>Save account</button>
              <button className="main-save-btn ghost" onClick={() => handleSavePrompt(false)}>Not now</button>
            </div>
          </div>
        </div>
      )}
      <TopNav />
      <SideNavBar />
      <MainHome toggle={toggleDot} />
      <BottomNav />
    </div>
  );
}

export default Main;
