import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TopNav from '../NavBar/TopNav';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';

function SettingsPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [isPrivate, setIsPrivate] = useState(Boolean(storedUser?.isPrivate));
  const [saving, setSaving] = useState(false);

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
      localStorage.setItem('user', JSON.stringify(res.data.user));
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

  return (
    <div className="Main">
      <TopNav />
      <SideNavBar />
      <div className="MainHome" style={{ padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 520, background: '#111', borderRadius: 10, padding: 16 }}>
          <h2 style={{ color: '#fff', marginTop: 0 }}>Settings</h2>
          <label style={{ color: '#ddd', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private account
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={savePrivacy} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default SettingsPage;
