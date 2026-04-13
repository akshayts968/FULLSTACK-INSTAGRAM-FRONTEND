import './MainProfile.css';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Edit from '../../Add/Edit';
import PostADD from '../../Add/Padd';
import HighlightUploadModal from './HighlightUploadModal';
import HighlightViewer from './HighlightViewer';
import FollowListModal from './FollowListModal';

function Post({ post, img, postView }) {
  const handleClick = () => {
    postView(post);
  };
  return (
    <div className='img' onClick={handleClick}>
      <img
        src={img || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOr3cDHrDjizSMpE4E4zRDzGsV6F7EmO867A&s'}
        alt='Post'
      />
    </div>
  );
}

function MainProfile(props) {
  const [edit, setEdit] = useState(false);
  const [addPost, setAddPost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState({});
  const [profileData, setProfileData] = useState({});
  const { username } = useParams();
  const navigate = useNavigate();
  const [follow, setFollow] = useState("Follow");

  const [nFollowers, setNFollowers] = useState(0);
  const [nFollowing, setNFollowing] = useState(0);

  const [activeTab, setActiveTab] = useState('POSTS'); // POSTS, REELS, TAGGED

  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);
  const [isPrivateLocked, setIsPrivateLocked] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followModalType, setFollowModalType] = useState(null);

  const toggleEdit = () => {
    setEdit(!edit);
    if (edit) window.location.reload();
  };
  const toggleAddPost = () => setAddPost(!addPost);
  const User = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
  }, [username]);

  // Handle Fetching
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = username
          ? await axios.get(`${process.env.REACT_APP_SERVER}/post/user/${username}?viewerId=${User._id}`)
          : await axios.get(`${process.env.REACT_APP_SERVER}/post/user/${User.username}?viewerId=${User._id}`);

        setPosts(response.data.data);
        setProfileData(response.data.User);
        setIsPrivateLocked(Boolean(response.data.isPrivateLocked));
        setNFollowers(response.data.User.nFollowers);
        setNFollowing(response.data.User.nFollowing);

        // Update follow state safely based on the User's array locally
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && Array.isArray(storedUser.followings) && response.data.User) {
          if (username && storedUser.followings.includes(response.data.User._id)) {
            setFollow("Following");
          } else {
            setFollow("Follow");
          }
        }
        if (response.data.User?.pendingFollowRequests?.includes(storedUser?._id)) {
          setIsRequested(true);
          setFollow("Requested");
        } else {
          setIsRequested(false);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, [username, addPost, edit]);

  async function followADD() {
    if (!profileData._id) return;
    const response = await axios.put(`${process.env.REACT_APP_SERVER}/user/${profileData._id}/${User._id}`);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    if (response.data.isRequested) {
      setFollow("Requested");
      setIsRequested(true);
    } else {
      setFollow(prev => prev === "Follow" ? "Following" : "Follow");
      setIsRequested(false);
    }
    setNFollowers(response.data.coMan.nFollowers);
  }

  const handleHighlightSuccess = (updatedUser) => {
    setProfileData(updatedUser);
  };

  const handleHighlightUpdated = (updatedUser, groupName) => {
    setProfileData(updatedUser);
    const updatedGroup = (updatedUser.highlight || []).find((h) => h.name === groupName);
    if (!updatedGroup) {
      setActiveViewerGroup(null);
    } else {
      setActiveViewerGroup(updatedGroup);
    }
  };

  const removeHighlight = async (groupName) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_SERVER}/user/${User._id}/highlight/${encodeURIComponent(groupName)}`);
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Failed to delete highlight', error);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const displayPosts = posts.filter(post => {
    if (activeTab === 'POSTS') return !post.isReel;
    if (activeTab === 'REELS') return post.isReel;
    if (activeTab === 'TAGGED') return post.taggedUsers && post.taggedUsers.includes(profileData._id);
    return true;
  });

  return (
    <div className='MainProfile'>
      {edit && <Edit onClose={toggleEdit} />}
      {addPost && <PostADD onClose={toggleAddPost} />}
      {showHighlightModal && <HighlightUploadModal onClose={() => setShowHighlightModal(false)} onSuccess={handleHighlightSuccess} user={profileData} />}
      {activeViewerGroup && (
        <HighlightViewer
          highlightGroup={activeViewerGroup}
          onClose={() => setActiveViewerGroup(null)}
          ownerId={profileData._id}
          canManage={!username || username === User.username}
          onHighlightUpdated={handleHighlightUpdated}
        />
      )}

      <div className='profile-header-container'>
        <div className='profile-avatar-container'>
          <div
            className="profile-avatar"
            style={{ backgroundImage: `url(${profileData.profile})` }}
          ></div>
        </div>

        <div className='profile-info'>
          <div className='profile-actions'>
            <h2 className='profile-username'>{profileData.username || 'username'}</h2>
            {username && username !== User.username ? (
              <>
                <button className={`profile-btn ${follow === 'Follow' ? 'primary' : ''}`} onClick={followADD} disabled={isRequested}>
                  {follow}
                </button>
                <button className='profile-btn'>Message</button>
              </>
            ) : (
              <>
                <button className='profile-btn' onClick={toggleEdit}>Edit Profile</button>
                <button className='profile-btn primary' onClick={toggleAddPost}>+ New Post</button>
                <button className='profile-btn' onClick={handleLogout} style={{ color: '#ed4956', borderColor: '#ed4956' }}>Logout</button>
              </>
            )}
          </div>

          <div className='profile-stats'>
            <div><span>{posts.length || '0'}</span> posts</div>
            <div style={{ cursor: 'pointer' }} onClick={() => setFollowModalType('followers')}><span>{nFollowers || '0'}</span> followers</div>
            <div style={{ cursor: 'pointer' }} onClick={() => setFollowModalType('followings')}><span>{nFollowing || '0'}</span> following</div>
          </div>

          <div className='profile-bio'>
            <div className='profile-bio-name'>{profileData.name || 'Account Name'}</div>
            <div style={{ color: '#a8a8a8' }}>{profileData.field || 'Welcome to my profile!'}</div>
          </div>
        </div>
      </div>

      <div className='highlights-container'>
        {(!username || username === User.username) && (
          <div className='highlight-item' onClick={() => setShowHighlightModal(true)}>
            <div className='highlight-add-bubble'>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span className='highlight-text'>New</span>
          </div>
        )}

        {profileData.highlight && profileData.highlight.map((hlGroup, index) => (
          typeof hlGroup === 'object' ? (
            <div className='highlight-item' key={index} onClick={() => setActiveViewerGroup(hlGroup)}>
              <div className='highlight-bubble' style={{ backgroundImage: `url(${hlGroup.cover})` }}></div>
              <span className='highlight-text'>{hlGroup.name}</span>
              {(!username || username === User.username) && (
                <button
                  type="button"
                  className='highlight-remove-btn'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHighlight(hlGroup.name);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ) : null
        ))}
      </div>

      <div className='profile-tabs'>
        <div className={`profile-tab ${activeTab === 'POSTS' ? 'active' : ''}`} onClick={() => setActiveTab('POSTS')}>
          POSTS
        </div>
        <div className={`profile-tab ${activeTab === 'REELS' ? 'active' : ''}`} onClick={() => setActiveTab('REELS')}>
          REELS
        </div>
        <div className={`profile-tab ${activeTab === 'TAGGED' ? 'active' : ''}`} onClick={() => setActiveTab('TAGGED')}>
          TAGGED
        </div>
      </div>

      <div className='Posts'>
        {isPrivateLocked ? (
          <div style={{ color: '#a8a8a8', padding: '30px 0',flexGrow: 1,width: '100vw',justifyContent: 'center',alignItems: 'center',textAlign: 'center',gridColumn: '1 / -1',     // Spans all columns (Use camelCase in JSX)
            width: '100%' }}>
            This account is private. Follow to view posts, reels, and tagged content.
          </div>
        ) : displayPosts.map((post) => {
          // 1. Check if the URL string ends with a common video extension
          const isVideo = post.videourl && post.videourl.match(/\.(mp4|mov|webm|mkv)$/i);

          // 2. If it's a video AND a thumbnail exists, use the thumbnail. 
          // Otherwise, use the standard videourl (which handles images and older posts).
          const displayImg = isVideo && post.thumbnailUrl ? post.thumbnailUrl : post.videourl;

          return (
            <Post
              key={post._id}
              img={displayImg}
              post={post}
              postView={props.postView}
            />
          );
        })}
      </div>
      {followModalType && (
        <FollowListModal
          userId={profileData._id}
          type={followModalType}
          onClose={() => setFollowModalType(null)}
        />
      )}
    </div>
  );
}

export default MainProfile;
