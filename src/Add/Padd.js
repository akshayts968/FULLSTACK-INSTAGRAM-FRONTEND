import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './Padd.css';

function PostADD({ onClose }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isReel, setIsReel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState([]); // Array of user objects

  const fileInputRef = useRef(null);
  const User = JSON.parse(localStorage.getItem('user'));

  // Search users for tagging
  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_SERVER}/user/search/all?query=${searchQuery}`);
          setSearchResults(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      const debounce = setTimeout(fetchUsers, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleTagUser = (userToTag) => {
    if (!taggedUsers.find(u => u._id === userToTag._id)) {
      setTaggedUsers([...taggedUsers, userToTag]);
    }
    setSearchQuery("");
  };

  const handleRemoveTag = (userId) => {
    setTaggedUsers(taggedUsers.filter(u => u._id !== userId));
  };

  const handleChange = (e) => {
    const { type, files } = e.target;
    setErrorMsg("");

    if (type === "file") {
      const file = files[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg("File size exceeds the 50MB limit.");
        return;
      }
      setPost(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRemovePreview = () => {
    setPost(null);
    setPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post) {
      setErrorMsg("Please select an image or video to upload.");
      return;
    }

    setLoading(true);
    const formPayload = new FormData();
    formPayload.append("Post", post);
    if (description) formPayload.append("Description", description);
    formPayload.append("isReel", isReel);
    
    // Pass tagged user IDs as JSON
    const tagIds = taggedUsers.map(u => u._id);
    if (tagIds.length > 0) {
      formPayload.append("tags", JSON.stringify(tagIds));
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/post/${User._id}/create`, formPayload);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (onClose) {
        onClose(); // close modal
      } else {
        navigate('/profile'); 
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Failed to upload post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-overlay">
      <div className="create-post-card">
        <div className="cp-header">
           <h2>Create new post</h2>
           {onClose && <button className="cp-close-btn" onClick={onClose}>&times;</button>}
        </div>
        
        {errorMsg && <div className="error-msg">{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="cp-form-content">
          {!preview ? (
            <div className="upload-area" onClick={handleUploadClick}>
              <div className="upload-icon">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <span className="upload-text">Select from computer</span>
              <input type="file" ref={fileInputRef} style={{ display: 'none'}} accept="image/*,video/*" onChange={handleChange} />
            </div>
          ) : (
            <div className="preview-container">
              <button type="button" className="remove-btn" onClick={handleRemovePreview}>&times;</button>
              {post && post.type.startsWith('video') ? (
                <video src={preview} autoPlay muted loop className="post-preview-img" />
              ) : (
                <img src={preview} alt="Preview" className="post-preview-img" />
              )}
            </div>
          )}

          <div className="cp-options">
             <textarea
               className="description-input"
               placeholder="Write a caption..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />

             <div className="reel-toggle">
               <label>
                 <input type="checkbox" checked={isReel} onChange={(e) => setIsReel(e.target.checked)} />
                 Share as Reel (Short Video)
               </label>
             </div>

             <div className="tag-section">
                <input 
                  type="text" 
                  className="tag-input" 
                  placeholder="Search to tag someone..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                
                {searchResults.length > 0 && (
                  <div className="tag-results">
                    {searchResults.map(u => (
                      <div key={u._id} className="tag-result-item" onClick={() => handleTagUser(u)}>
                        <div className="tag-avatar" style={{backgroundImage: `url(${u.profile})`}}></div>
                        <span>{u.username}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {taggedUsers.length > 0 && (
                  <div className="tagged-users-list">
                    {taggedUsers.map(u => (
                      <div key={u._id} className="tagged-badge">
                        @{u.username} <span onClick={() => handleRemoveTag(u._id)}>&times;</span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading || !post}>
            {loading ? <span className="spinner"></span> : "Share"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostADD;
