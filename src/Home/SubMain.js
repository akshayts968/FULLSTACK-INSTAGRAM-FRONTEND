import React, { useEffect, useState, useRef } from 'react';
import './SubMain.css';
import axios from 'axios';
import Comment from './Comment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ADDED Volume icons for the mute button
import { faXmark, faHeart, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { faComment, faBookmark, faPaperPlane, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import Dot3 from '../Profile/Dot3';
import DeletePost from '../Add/DeletePost';
import io from 'socket.io-client';
import { fetchProfileByIdCached } from '../utils/profileCache';

const socket = io(`${process.env.REACT_APP_SERVER}`);

const SubMain = (props) => {
  const [replyTo, setReplyTo] = useState("");
  const [showDot3, setShowDot3] = useState(false);
  const [showDeletePost, setShowDeletePost] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currUser, setCurrUser] = useState("");
  const [room, setRoom] = useState("");
  const User = JSON.parse(localStorage.getItem('user'));

  // --- NEW: Video Control States & Refs ---
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true); // Browsers require muted for autoplay to work

  const isVideo = props.post.videourl && props.post.videourl.match(/\.(mp4|mov|webm|mkv)$/i);

  const toggleMute = (e) => {
    e.stopPropagation(); // Prevents the video from pausing when clicking mute
    setIsMuted(!isMuted);
  };
  // ... inside SubMain component
  const [likes, setLikes] = useState(props.post.likes || []); // Array of User IDs who liked the post
  const [followingLikes, setFollowingLikes] = useState([]);

  // 1. Logic to find which of your followings liked this post
  useEffect(() => {
    if (User.following && likes.length > 0) {
      // Filter likes to see if any ID exists in your following list
      const followedPeopleWhoLiked = User.following.filter(followedId =>
        likes.includes(followedId)
      );

      // We only need the first 1 or 2 names for the "Social Proof" text
      // This assumes your User.following contains objects with usernames, 
      // or you might need a quick fetch if it's just IDs.
      setFollowingLikes(followedPeopleWhoLiked);
    }
  }, [likes, User.following]);

  const handleLike = async () => {
    // Optimistic Update: Toggle the heart locally so it feels instant
    const isLiked = likes.some(id => String(id) === String(User._id));
    let updatedLikes;

    if (isLiked) {
      updatedLikes = likes.filter(id => String(id) !== String(User._id));
    } else {
      updatedLikes = [...likes, User._id];
    }

    setLikes(updatedLikes); // Change color immediately

    try {
      const response = await axios.put(`${process.env.REACT_APP_SERVER}/post/like/${props.post._id}`, {
        userId: User._id
      });

      // Sync with the actual server data
      if (response.data.likes) {
        setLikes(response.data.likes);
        socket.emit('likePost', { postId: props.post._id, likes: response.data.likes });
      }
    } catch (error) {
      // Rollback if the server fails
      setLikes(likes);
      console.error("Error liking post", error);
    }
  };
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };
  // ----------------------------------------

  useEffect(() => {
    setRoom(props.post._id);
  }, [props.post._id]);
  useEffect(() => {
    if (videoRef.current) {
      // Force the video node to be muted before trying to play
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;

      // Tell the browser to play it, catching any policy errors
      videoRef.current.play().catch(error => {
        console.log("Browser autoplay policy blocked playback:", error);
      });
    }
  }, [props.post.videourl]);
  useEffect(() => {
    socket.on('sendComment', (data) => {
      setComments((prevComments) => {
        // 1. Check if this is a reply to an existing comment
        if (data.parentCommentId) { // Ensure your backend sends the parent ID back
          return prevComments.map(comment => {
            if (comment._id === data.parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data]
              };
            }
            return comment;
          });
        }
        // 2. Otherwise, it's a new top-level comment
        // Prevent duplicate if the sender already added it to state
        if (prevComments.find(c => c._id === data._id)) return prevComments;
        return [...prevComments, data];
      });
    });

    return () => socket.off('sendComment');
  }, []);

  useEffect(() => {
    if (room) {
      socket.emit('joinRoom', room);
    }
  }, [room]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (props.post.postOwner.username) {
          setCurrUser(props.post.postOwner);
        } else {
          if (User._id === props.post.postOwner) {
            setCurrUser(User);
          } else {
            const profile = await fetchProfileByIdCached(props.post.postOwner);
            setCurrUser(profile);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [props.post]);

  const [date, setDate] = useState("");
  useEffect(() => {
    function getDaysDifference() {
      const givenDate = new Date(props.post.date);
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
  }, [props.post._id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER}/comment/${props.post._id}`, {
          timeout: 100000
        });
        const data = response.data;
        console.log('comment', data);
        setComments(data.comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [props.post._id]);

  const handleCommentAdd = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.put(`${process.env.REACT_APP_SERVER}/post/${props.post._id}`, {
        comment: newComment,
        post: props.post._id,
        userId: User._id,
        commentId: replyTo // This is your parent ID
      });

      if (response.status === 200) {
        const savedComment = response.data.savedComment;

        // Emit the comment with the parent ID so other clients know where it goes
        socket.emit('sendComment', {
          room: room,
          content: { ...savedComment, parentCommentId: replyTo }
        });

        // Update local state with nesting logic
        setComments(prev => {
          if (replyTo) {
            return prev.map(c => c._id === replyTo
              ? { ...c, replies: [...(c.replies || []), savedComment] }
              : c
            );
          }
          return [...prev, savedComment];
        });

        setNewComment("");
        setReplyTo(""); // Reset the reply pointer
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setNewComment(newValue);

    const postButton = event.target.nextElementSibling;
    if (postButton) {
      if (newValue.trim()) {
        postButton.style.display = 'flex';
      } else {
        postButton.style.display = 'none';
      }
    }
  };

  const currText = (username, cId) => {
    console.log(username, cId, "is this");
    setReplyTo(cId);
    console.log(replyTo, "is this");
    setNewComment(`@${username} `);
  };

  return (
    <div className="centre-display">
      <div className="centre-display-div">
        <div className="video-side" style={{ position: 'relative' }}>

          {/* --- NEW: Conditional Rendering for Image vs Video --- */}
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                className="video-side-img"
                src={props.post.videourl}
                autoPlay
                loop
                playsInline      // <-- IMPORTANT: Required for iOS Safari autoplay
                muted={isMuted}  // <-- IMPORTANT: Must be true on initial load
                onClick={handlePlayPause}
                style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Mute Toggle Button */}
              <button
                onClick={toggleMute}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} size="sm" />
              </button>
            </>
          ) : (
            <img className="video-side-img" alt="Post content" src={props.post.videourl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* --------------------------------------------------- */}

        </div>
        <div className="comment-side">
          <div className="cs-head">
            <img
              className="status-img rounded-circle"
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#ccc',
                objectFit: 'cover'
              }}
              src={currUser.profile || props.post.postOwner.profile}
              alt=""
            />
            <div>
              <span className="cs-head-sp-1">{currUser.username}</span><br />
            </div>
            <button onClick={() => setShowDot3(true)}>...</button>
          </div>
          <div className="cs-mid">

            <div className="cs-mid-div-2">
              <div className="cs-mid-div-1">
                <span>
                  <img className='IMG-Des' src={currUser.profile} alt="'Profile Image'" /></span>
                <div className='Description'>
                  <span className='commentUsername'>{currUser.username}</span> {props.post.description || "Anant and Radhika, your wedding was a magical start to a lifelong partnership. May your journey together be an incredible adventure filled with love, joy, and countless unforgettable moments. Wishing you a lifetime of happiness and success!"}</div>
              </div>
              {comments.map((comment) => (
                <Comment key={comment._id} index={comment._id} text={comment.text} replies={comment.replies} ownerId={comment.owner} owner={comment.owner.profile} date={comment.date} currText={currText} />
              ))}
            </div>
          </div>
          <div className="cs-bottom">
            <div className="cs-bottom-1">
              <div className="post-buttons">
                <span className="ml-2">
                  {/* Heart Icon Toggle */}
                  <FontAwesomeIcon
                    icon={faHeart}
                    onClick={handleLike}
                    style={{
                      // Use .some to check if the current user's ID exists in the likes array
                      color: likes.some(id => String(id) === String(User._id)) ? 'red' : 'inherit',
                      cursor: 'pointer',
                      fontSize: '24px', // optional: make it more visible
                      transition: 'color 0.2s ease' // optional: smooth transition
                    }}
                  />
                  <FontAwesomeIcon icon={faComment} />
                  <FontAwesomeIcon icon={faPaperPlane} />
                </span>
                {/* ... bookmark icon */}
              </div>
            </div>

            <div className="cs-bottom-2">
              <span style={{ fontWeight: '600', fontSize: '14px' }}>
                {likes.length > 0 ? (
                  <>
                    {followingLikes.length > 0 ? (
                      <>
                        Liked by <b>{followingLikes[0].username || 'a friend'}</b>
                        {likes.length > 1 && ` and ${likes.length - 1} others`}
                      </>
                    ) : (
                      `${likes.length} ${likes.length === 1 ? 'like' : 'likes'}`
                    )}
                  </>
                ) : (
                  "Be the first to like this"
                )}
              </span>
            </div>

            {/* Actual Comment Count */}
            <div className="comment-count-display" style={{ fontSize: '12px', color: 'gray', marginLeft: '15px' }}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </div>

            <span className="cs-bottom-2 posttime">{date}</span>
          </div>
          <div className="cs-comment">
            <div className="add-comments">
              <textarea onChange={handleInputChange} value={newComment} name="comment" id="comment" cols="30" rows="auto" placeholder="Add comments..."></textarea>
              <a className="ml-1" onClick={handleCommentAdd}>Post</a>
            </div>
          </div>
        </div>
      </div>
      <button className="closeButton" onClick={props.onClose}><FontAwesomeIcon icon={faXmark} /></button>

      {showDot3 && (
        <Dot3
          toggle={(e) => { e && e.stopPropagation(); setShowDot3(false); }}
          isOwner={User._id === (props.post.postOwner._id || props.post.postOwner)}
          onDeleteClick={() => { setShowDot3(false); setShowDeletePost(true); }}
        />
      )}
      {showDeletePost && (
        <DeletePost
          postId={props.post._id}
          onClose={() => setShowDeletePost(false)}
          onDelete={(deletedId) => { window.location.reload(); }}
        />
      )}
    </div>
  );
};

export default SubMain;