import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Main from '../Home/Main';
import SubMain from '../Home/SubMain';
import './MainHome.css';

function MainHome({ toggle }) {
  const [posts, setPosts] = useState([]);
  const [currPost, setCurrPost] = useState(null);
  const [separatePost, setSeparatePost] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const storyInputRef = useRef(null);
  
  const User = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postRes = await axios.get(`${process.env.REACT_APP_SERVER}/post/all`);
        setPosts(postRes.data.posts);
        
        const userRes = await axios.get(`${process.env.REACT_APP_SERVER}/all`);
        setUsers(userRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const handlePostClick = (post) => {
    setCurrPost(post);
    setSeparatePost(true);
  };

  const handleCloseClick = () => {
    setSeparatePost(false);
  };

  const triggerStoryUpload = () => {
    if (storyInputRef.current) storyInputRef.current.click();
  };

  const handleStoryChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Story file size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append('story', file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/user/${User._id}/story`, formData);
      const updatedUrl = response.data.storyUrl;
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.story = updatedUrl;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      setUsers(prev => prev.map(u => u._id === User._id ? { ...u, story: updatedUrl } : u));
    } catch (error) {
      console.error('Error uploading story:', error);
    }
  };

  const viewStory = (storyUrl) => {
    if (!storyUrl) return;
    setActiveStory(storyUrl);
  };

  return (
    <div className="MainHome">
      {/* Story Viewer Overlay */}
      {activeStory && (
        <div className="story-viewer-overlay" onClick={() => setActiveStory(null)}>
          <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="story-progress-bar"><div className="story-progress-fill"></div></div>
            <img src={activeStory} alt="Story Viewer" />
            <div className="close-story" onClick={() => setActiveStory(null)}>✕</div>
          </div>
        </div>
      )}

      {separatePost && currPost && <SubMain post={currPost} onClose={handleCloseClick} />}
      
      {/* Stories Bar */}
      <div className="stories-container">
        <div className="story-item" onClick={triggerStoryUpload}>
          <div className="story-bubble add-story">
            <img src={User && User.profile ? User.profile : 'https://i.pinimg.com/originals/44/bf/66/44bf66ebb891eef4f48b8492f001c938.jpg'} alt="You"/>
            <div className="add-icon">+</div>
          </div>
          <span className="story-username">Your Story</span>
          <input type="file" ref={storyInputRef} accept="image/*,video/*" style={{display:'none'}} onChange={handleStoryChange} />
        </div>
        
        {users.filter(u => u.story).map(u => (
          <div className="story-item" key={u._id} onClick={() => viewStory(u.story)}>
            <div className="story-bubble active">
              <img src={u.profile} alt={u.username} />
            </div>
            <span className="story-username">{u.username}</span>
          </div>
        ))}
      </div>

      <div className="feed-container">
        {posts.map((post, index) => (
          <Main key={index} post={post} toggle={toggle} onClick={() => handlePostClick(post)} />
        ))}
      </div>
    </div>
  );
}

export default MainHome;
