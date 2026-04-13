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
  const [activeStoryUser, setActiveStoryUser] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);
  const storyMediaRef = useRef(null);
  const storyInputRef = useRef(null);
  
  const User = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postRes = await axios.get(`${process.env.REACT_APP_SERVER}/post/all?viewerId=${User._id}`);
        setPosts(postRes.data.posts);
        
        const userRes = await axios.get(`${process.env.REACT_APP_SERVER}/all?viewerId=${User._id}`);
        setUsers(userRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, [storyRefreshKey]);

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
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Each story file size must be less than 50MB");
        return;
      }
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('story', file));

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/user/${User._id}/story`, formData);
      const updatedStories = response.data.user?.stories || [];
      const updatedUrl = response.data.storyUrl;
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.story = updatedUrl;
      storedUser.stories = updatedStories;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      setUsers(prev => prev.map(u => u._id === User._id ? { ...u, story: updatedUrl, stories: updatedStories } : u));
      setStoryRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Error uploading story:', error);
    }
  };

  const viewStory = (user) => {
    const stories = (user?.stories && user.stories.length) ? user.stories : (user?.story ? [{ mediaUrl: user.story, mediaType: 'image' }] : []);
    if (!stories.length) return;
    setActiveStoryUser({ ...user, stories });
    setActiveStoryIndex(0);
    setIsStoryMuted(true);
    setIsStoryPaused(false);
  };

  const closeStoryViewer = () => {
    setActiveStoryUser(null);
    setActiveStoryIndex(0);
    setIsStoryPaused(false);
  };

  const normalizedStories = (activeStoryUser?.stories || []).map((s) =>
    typeof s === 'string' ? { mediaUrl: s, mediaType: 'image' } : s
  );
  const currentStory = normalizedStories?.[activeStoryIndex];
  const isVideoStory = currentStory?.mediaType === 'video' || /\.(mp4|mov|webm|mkv)$/i.test(currentStory?.mediaUrl || '');

  useEffect(() => {
    if (!currentStory || isStoryPaused) return;
    if (isVideoStory) return;
    const t = setTimeout(() => {
      if (activeStoryIndex < normalizedStories.length - 1) {
        setActiveStoryIndex((p) => p + 1);
      } else {
        closeStoryViewer();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [activeStoryIndex, normalizedStories.length, currentStory, isStoryPaused, isVideoStory]);

  const togglePlayPause = () => {
    const media = storyMediaRef.current;
    if (!media) {
      setIsStoryPaused((prev) => !prev);
      return;
    }
    if (media.paused) {
      media.play();
      setIsStoryPaused(false);
    } else {
      media.pause();
      setIsStoryPaused(true);
    }
  };

  const deleteCurrentStory = async () => {
    if (!activeStoryUser || !currentStory || activeStoryUser._id !== User._id) return;
    try {
      const response = await axios.delete(`${process.env.REACT_APP_SERVER}/user/${User._id}/story/${currentStory._id}`);
      const updatedStories = response.data.user?.stories || [];
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.stories = updatedStories;
      storedUser.story = updatedStories.length ? updatedStories[updatedStories.length - 1].mediaUrl : "";
      localStorage.setItem('user', JSON.stringify(storedUser));
      setUsers((prev) =>
        prev.map((u) =>
          u._id === User._id
            ? { ...u, stories: updatedStories, story: storedUser.story }
            : u
        )
      );
      if (!updatedStories.length) {
        closeStoryViewer();
      } else {
        setActiveStoryUser({ ...activeStoryUser, stories: updatedStories, story: storedUser.story });
        setActiveStoryIndex((idx) => Math.max(0, Math.min(idx, updatedStories.length - 1)));
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  return (
    <div className="MainHome">
      {/* Story Viewer Overlay */}
      {activeStoryUser && currentStory && (
        <div className="story-viewer-overlay" onClick={closeStoryViewer}>
          <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="story-progress-bar"><div className="story-progress-fill"></div></div>
            {isVideoStory ? (
              <video
                ref={storyMediaRef}
                src={currentStory.mediaUrl}
                muted={isStoryMuted}
                autoPlay
                playsInline
                preload="metadata"
                onEnded={() => {
                  if (activeStoryIndex < normalizedStories.length - 1) setActiveStoryIndex((p) => p + 1);
                  else closeStoryViewer();
                }}
              />
            ) : (
              <img src={currentStory.mediaUrl} alt="Story Viewer" />
            )}
            <div className="close-story" onClick={closeStoryViewer}>✕</div>
            <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 8 }}>
              {isVideoStory && (
                <>
                  <button onClick={() => setIsStoryMuted((m) => !m)}>{isStoryMuted ? 'Unmute' : 'Mute'}</button>
                  <button onClick={togglePlayPause}>{isStoryPaused ? 'Play' : 'Pause'}</button>
                </>
              )}
              {activeStoryUser._id === User._id && <button onClick={deleteCurrentStory}>Delete Story</button>}
            </div>
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
          <input type="file" multiple ref={storyInputRef} accept="image/*,video/*" style={{display:'none'}} onChange={handleStoryChange} />
        </div>
        
        {users.filter(u => (u.stories && u.stories.length) || u.story).map(u => (
          <div className="story-item" key={u._id} onClick={() => viewStory(u)}>
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
