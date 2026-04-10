import React, { useState, useRef } from 'react';
import axios from 'axios';
import './HighlightUploadModal.css';

function HighlightUploadModal({ onClose, onSuccess, user }) {
  const [groupName, setGroupName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Derive existing highlight group names natively from user memory object organically
  const existingGroups = user.highlight ? user.highlight.map(h => h.name) : [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("Highlight exceeds 10MB limit.");
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("highlight", file);
    formData.append("groupName", groupName.trim());

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/user/${user._id}/highlight`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onSuccess(response.data.user);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to upload highlight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="highlight-modal-overlay">
      <div className="highlight-modal">
        <div className="highlight-modal-header">
          <h3>Add New Highlight</h3>
          <button className="close-modal-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="highlight-input-group">
          <label>Highlight Group Name</label>
          <input 
            type="text" 
            className="highlight-name-input"
            placeholder="Type new or existing group..."
            list="existing-highlights"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <datalist id="existing-highlights">
            {existingGroups.map((name, idx) => (
              <option key={idx} value={name} />
            ))}
          </datalist>
        </div>

        <div className="highlight-input-group">
           <label className="highlight-file-label">
              {file ? 'Change Substituted Media' : 'Select Media Stream'}
              <input type="file" style={{display: 'none'}} accept="image/*,video/*" onChange={handleFileChange} />
           </label>
        </div>

        {preview && (
          <img src={preview} alt="Highlight Preview" className="highlight-preview" />
        )}

        <button 
          className="highlight-submit-btn" 
          onClick={handleUpload} 
          disabled={loading || !file}
        >
          {loading ? 'Uploading natively...' : 'Upload to Highlight'}
        </button>
      </div>
    </div>
  );
}

export default HighlightUploadModal;
