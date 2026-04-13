import React, { useEffect, useState } from 'react';
import './Main.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faComment, faBookmark, faPaperPlane, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { fetchProfileByIdCached, setCachedProfile } from '../utils/profileCache';
const socket = io(`${process.env.REACT_APP_SERVER}`);

const Main = ({ post, onClick, toggle }) => {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [comment, setComment] = useState('');
  const [date, setDate] = useState("");
  const [profileMenuData, setProfileMenuData] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);

  const fallbackImage =
    process.env.REACT_APP_FALLBACK_IMAGE ||
    process.env.REACT_APP_CLOUDINARY_URL ||
    'https://i.pinimg.com/originals/44/bf/66/44bf66ebb891eef4f48b8492f001c938.jpg';

  // --- NEW: Check for video and set the display image ---
  const isVideo = post.videourl && post.videourl.match(/\.(mp4|mov|webm|mkv)$/i);
  const displayImg = (isVideo && post.thumbnailUrl ? post.thumbnailUrl : post.videourl) || fallbackImage;
  // ------------------------------------------------------

  useEffect(() => {
    function getDaysDifference() {
      const givenDate = new Date(post.date);
      const currentDate = new Date();
      const differenceInTime = currentDate - givenDate;

      const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
      if (differenceInDays >= 1) {
        setDate(`${differenceInDays} d`);
        return;
      }

      const differenceInHours = Math.floor(differenceInTime / (1000 * 3600));
      if (differenceInHours >= 1) {
        setDate(`${differenceInHours} hr`);
        return;
      }

      const differenceInMinutes = Math.floor(differenceInTime / (1000 * 60));
      if (differenceInMinutes >= 1) {
        setDate(`${differenceInMinutes} min`);
        return;
      }

      setDate(`Just now`);
    }

    getDaysDifference();
  }, [post._id]);

  const onEmojiClick = (emojiData, event) => {
    if (emojiData && emojiData.emoji) {
      setComment(prevComment => prevComment + emojiData.emoji);
    } else {
      console.error('Emoji object or emoji is undefined.');
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prevState => !prevState);
  };

  const currUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const handleInput = (event) => {
      const commentBox = event.target;
      const postButton = commentBox.nextElementSibling;
      if (commentBox.value.trim()) {
        postButton.style.display = 'flex';
      } else {
        postButton.style.display = 'none';
      }
    };

    const commentBoxes = document.querySelectorAll(".comment");
    commentBoxes.forEach(commentBox => {
      commentBox.addEventListener("input", handleInput);
    });

    return () => {
      commentBoxes.forEach(commentBox => {
        commentBox.removeEventListener("input", handleInput);
      });
    };
  }, []);

  const heartBeat = (icon) => {
    icon.classList.toggle('clicked');
  };

  const handleInput = (e) => {
    setComment(e.target.value);
  };

  const commentAdd = async (link, postId) => {
    if (!comment.trim()) {
      console.error("Comment cannot be empty");
      return;
    }

    const User = JSON.parse(localStorage.getItem('user'));
    try {
      const response = await axios.put(`${process.env.REACT_APP_SERVER}/post/${postId}`,
        { comment: comment, post: postId, userId: User._id },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        const savedComment = response.data;
        socket.emit('sendComment', { room: postId, content: savedComment });
        setComment("");
        console.log("Database updated successfully");
      } else {
        console.error("Failed to update database");
      }
    } catch (error) {
      console.error("Failed to update database", error);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return;
    e.preventDefault();
    if (comment.trim()) {
      commentAdd(null, post._id);
    }
  };

  const handleToggle = () => {
    toggle();
  };

  const resolveOwnerProfile = async () => {
    const owner = post.postOwner;
    if (owner?._id && owner?.username) {
      setCachedProfile(owner);
      return owner;
    }
    if (typeof owner === 'string') {
      return await fetchProfileByIdCached(owner);
    }
    return owner;
  };

  const handleProfileImageClick = async () => {
    try {
      const owner = await resolveOwnerProfile();
      if (owner) setProfileMenuData(owner);
    } catch (error) {
      console.error('Failed to load profile actions', error);
    }
  };

  const openStoryPreview = () => {
    if (!profileMenuData) return;
    const stories = profileMenuData.stories || [];
    if (stories.length) {
      setStoryPreview(typeof stories[0] === 'string' ? { mediaUrl: stories[0], mediaType: 'image' } : stories[0]);
      return;
    }
    if (profileMenuData.story) {
      setStoryPreview({ mediaUrl: profileMenuData.story, mediaType: 'image' });
    }
  };
  const isStoryVideo = Boolean(storyPreview?.mediaType === 'video' || (storyPreview?.mediaUrl || '').match(/\.(mp4|mov|webm|mkv)$/i));

  return (
    <div className="home-post">
      <div className="post-heading">
        <span className="home-post-profile-pic" onClick={handleProfileImageClick}>
          <img
            src={post.postOwner.profile || fallbackImage}
            alt=""
            onClick={(e) => {
              e.stopPropagation();
              handleProfileImageClick();
            }}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </span>
        <span className="home-post-ownername">
          <span className="ml-3" style={{ color: '#f5f5f5' }} onClick={handleProfileImageClick}>{post.postOwner.username}</span>
          <span style={{ color: '#f5f5f5' }}>4h</span>
        </span>
        <span className="float-right" onClick={handleToggle}>...</span>
      </div>

      {/* --- UPDATED: Using displayImg here --- */}
      <div className="hPost" onClick={onClick}>
        <img src={displayImg} alt="Post media" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
      </div>
      {/* -------------------------------------- */}

      <div className="post-detail">
        <div className="post-buttons">
          <span className="ml-2">
            <FontAwesomeIcon onClick={(e) => heartBeat(e.target)} icon={faHeart} />
            <FontAwesomeIcon onClick={onClick} icon={faComment} />
            <FontAwesomeIcon icon={faPaperPlane} />
          </span>
          <span className="ml-2">
            <FontAwesomeIcon icon={faBookmark} />
          </span>
        </div>
        <div className="cs-bottom-2">
          <span>Liked by sachin and others</span>
        </div>
        <div className='post-description'>
          <span>
            <img
              className='IMG-Des'
              src={post.postOwner.profile || fallbackImage}
              alt="'Profile Image'"
              onClick={handleProfileImageClick}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
          </span>
          <div className='Description'>
            <span className='commentUsername'>{post.postOwner.username}</span>
            <span className='truncate'>{post.description || "Anant and Radhika, your wedding was a magical start to a lifelong partnership. May your journey together be an incredible adventure filled with love, joy, and countless unforgettable moments. Wishing you a lifetime of happiness and success!"}</span>
          </div>
        </div>
        <div onClick={onClick} style={{ margin: '5px 0', cursor: 'pointer' }}>View All comment</div>
        <div className="add-Comments">
          <textarea
            onChange={handleInput}
            onKeyDown={handleCommentKeyDown}
            name="comment"
            className="comment"
            cols="30"
            rows="auto"
            placeholder="Add comments..."
            value={comment}
          ></textarea>
          <a className="ml-1 post-button" onClick={() => commentAdd(null, post._id)} style={{ display: comment.trim() ? 'flex' : 'none' }}>Post</a>
          <FontAwesomeIcon className='faceSmile' onClick={toggleEmojiPicker} icon={faFaceSmile} />
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              pickerStyle={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
      </div>

      {profileMenuData && (
        <div className="profile-action-overlay" onClick={() => setProfileMenuData(null)}>
          <div className="profile-action-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate(`/profile/${profileMenuData.username}`)}>View Profile</button>
            <button
              onClick={openStoryPreview}
              disabled={!((profileMenuData.stories && profileMenuData.stories.length) || profileMenuData.story)}
            >
              View Story
            </button>
          </div>
        </div>
      )}

      {storyPreview && (
        <div className="profile-action-overlay" onClick={() => setStoryPreview(null)}>
          <div className="story-preview-modal" onClick={(e) => e.stopPropagation()}>
            {isStoryVideo ? (
              <video src={storyPreview.mediaUrl} controls autoPlay playsInline />
            ) : (
              <img src={storyPreview.mediaUrl || fallbackImage} alt="Story preview" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;