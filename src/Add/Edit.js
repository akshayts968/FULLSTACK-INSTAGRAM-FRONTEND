import React, { useState, useRef } from "react";
import axios from "axios";
import './Edit.css';

function Edit({ onClose }) {
  const User = JSON.parse(localStorage.getItem('user'));
  const [formData, setFormData] = useState({
    username: User.username || '',
    name: User.name || '',
    email: User.email || '',
    field: User.field || '',
    isPrivate: Boolean(User.isPrivate),
    profile: null,
  });
  const [preview, setPreview] = useState(User.profile || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setFormData({ ...formData, profile: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formPayload = new FormData();
    formPayload.append("username", formData.username);
    formPayload.append("name", formData.name);
    formPayload.append("email", formData.email);
    formPayload.append("field", formData.field);
    formPayload.append("isPrivate", formData.isPrivate);
    if (formData.profile) {
      formPayload.append("profile", formData.profile);
    }
    try {
      const response = await axios.put(`${process.env.REACT_APP_SERVER}/user/${User._id}/edit`, formPayload);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onClose(); // auto closes modal and triggers re-render through parent
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal">
        <div className="edit-header">
          <button className="close-btn" style={{visibility: 'hidden'}}>&times;</button>
          <h3>Edit Profile</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form className="edit-content" onSubmit={handleSubmit}>
          
          <div className="edit-profile-pic-container">
            <div className="edit-avatar-preview" style={{ backgroundImage: `url(${preview})` }}></div>
            <button type="button" className="upload-text-btn" onClick={handleUploadClick}>
              Change Profile Photo
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleChange} />
          </div>

          <div className="edit-input-group">
            <label>Name</label>
            <input className="edit-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name"/>
          </div>

          <div className="edit-input-group">
            <label>Username</label>
            <input className="edit-input" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username"/>
          </div>

          <div className="edit-input-group">
            <label>Email</label>
            <input className="edit-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address"/>
          </div>

          <div className="edit-input-group">
            <label>Bio</label>
            <textarea className="edit-input" name="field" value={formData.field} onChange={handleChange} placeholder="Welcome to my profile..."></textarea>
          </div>

          <div className="edit-input-group">
            <label>
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              />
              {' '}Private account (only followers can view posts, reels, tagged)
            </label>
          </div>

          <button type="submit" className="edit-save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Edit;