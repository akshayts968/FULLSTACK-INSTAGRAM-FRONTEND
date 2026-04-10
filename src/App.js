import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Main from './Main';
import Profile from './Profile/Profile';
import Message from './Message/Message';
import Login from './Signup/Login';
import SignUpForm from './Signup/Signup';
import PasswordUpdate from './PasswordUpdate';
import VideoCall from './Message/VideoCall';
import { SocketProvider } from './context/SocketContext';

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
