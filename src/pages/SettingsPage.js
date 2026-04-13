import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TopNav from '../NavBar/TopNav';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';
import { getSavedAccounts, removeSavedAccount, saveCurrentAccount } from '../utils/accountStorage';
import './SettingsPage.css';

function SettingsPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [isPrivate, setIsPrivate] = useState(Boolean(storedUser?.isPrivate));
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState(getSavedAccounts());
  const [lastTap, setLastTap] = useState({ accountId: null, time: 0 });

  const savePrivacy = async () => {
    if (!storedUser?._id) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', storedUser.username || '');
      formData.append('name', storedUser.name || '');
      formData.append('email', storedUser.email || '');
      formData.append('field', storedUser.field || '');
      formData.append('isPrivate', isPrivate);
      const res = await axios.put(`${process.env.REACT_APP_SERVER}/user/${storedUser._id}/edit`, formData);
      saveCurrentAccount(res.data.user);
      setAccounts(getSavedAccounts());
      alert('Settings saved');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const switchAccount = (account) => {
    localStorage.setItem('user', JSON.stringify(account));
    navigate('/profile');
    window.location.reload();
  };

  const removeAccount = (accountId) => {
    removeSavedAccount(accountId);
    const updatedAccounts = getSavedAccounts();
    setAccounts(updatedAccounts);

    // If current account is removed, switch to another saved account or go to login.
    if (accountId === storedUser?._id) {
      localStorage.removeItem('user');
      if (updatedAccounts.length > 0) {
        localStorage.setItem('user', JSON.stringify(updatedAccounts[0]));
        navigate('/home');
        window.location.reload();
      } else {
        navigate('/login');
      }
    }
  };

  const handleAccountTap = (account) => {
    if (account._id === storedUser?._id) return;
    const now = Date.now();
    if (lastTap.accountId === account._id && now - lastTap.time <= 350) {
      switchAccount(account);
      setLastTap({ accountId: null, time: 0 });
      return;
    }
    setLastTap({ accountId: account._id, time: now });
  };

  return (
    <div className="Main">
      <TopNav />
      <SideNavBar />
      <div className="MainHome" style={{ padding: 24 }}>
        <div className="settings-wrap">
          <h2 className="settings-title">Settings</h2>
          <label className="settings-private">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private account
          </label>
          <div className="settings-actions">
            <button className="settings-btn primary" onClick={savePrivacy} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="settings-btn danger" onClick={logout}>Logout</button>
          </div>
          <div className="settings-switch-block">
            <h3 className="settings-switch-heading">Switch account</h3>
            <p className="settings-switch-hint">Double tap an account row to switch quickly.</p>
            {(accounts || []).length === 0 && <p className="settings-empty">No saved accounts yet.</p>}
            {(accounts || []).map((acc) => (
              <div
                key={acc._id}
                className={`settings-account-row ${acc._id === storedUser?._id ? 'active' : ''}`}
                onClick={() => handleAccountTap(acc)}
              >
                <div className="settings-account-name">@{acc.username}</div>
                <div className="settings-account-actions">
                  <button className="settings-btn secondary" onClick={(e) => { e.stopPropagation(); switchAccount(acc); }} disabled={acc._id === storedUser?._id}>
                    {acc._id === storedUser?._id ? 'Current' : 'Switch'}
                  </button>
                  <button className="settings-btn danger" onClick={(e) => { e.stopPropagation(); removeAccount(acc._id); }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default SettingsPage;
