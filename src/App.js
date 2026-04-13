import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Main from './Main';
import Profile from './Profile/Profile';
import Message from './Message/Message';
import Login from './Signup/Login';
import SignUpForm from './Signup/Signup';
import PasswordUpdate from './PasswordUpdate';
import { SocketProvider } from './context/SocketContext';
import ExplorePage from './pages/ExplorePage';
import ReelsPage from './pages/ReelsPage';
import SettingsPage from './pages/SettingsPage';
import CreatePage from './pages/CreatePage';
import AlbumsPage from './pages/AlbumsPage';

function App() {
  return (
    <div className="App">
      <SocketProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/home" element={<Main />} />
          <Route path="/message" element={<Message />} />
          <Route path="/message/:username" element={<Message />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/passUpdate" element={<PasswordUpdate />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
      </SocketProvider>
    </div>
  );
}

export default App;
