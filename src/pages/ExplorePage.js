import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNav from '../NavBar/TopNav';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';
import './ExplorePage.css';

function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const fallbackImage =
    process.env.REACT_APP_FALLBACK_IMAGE ||
    'https://i.pinimg.com/originals/44/bf/66/44bf66ebb891eef4f48b8492f001c938.jpg';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/post/all?viewerId=${user?._id || ''}`);
        setPosts(res.data.posts || []);
      } catch (error) {
        console.error('Failed to load explore posts', error);
      }
    };
    fetchPosts();
  }, [user?._id]);

  const getPostMedia = (post) => post?.thumbnailUrl || post?.videourl || fallbackImage;
  const isVideoPost = (post) => Boolean(post?.videourl && post.videourl.match(/\.(mp4|mov|webm|mkv)$/i));
  const closeModal = () => {
    setSelectedPost(null);
    setMediaFailed(false);
  };

  return (
    <div className="Main">
      <TopNav />
      <SideNavBar />
      <div className="explore-page-content">
        <h2 className="explore-title">Explore</h2>
        <div className="explore-grid">
          {posts.map((post) => (
            <div
              key={post._id}
              className="explore-card"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={getPostMedia(post)}
                alt="Explore"
                className="explore-image"
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedPost && (
        <div className="explore-modal-overlay" onClick={closeModal}>
          <div className="explore-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="explore-modal-close" onClick={closeModal}>x</button>
            <div className="explore-modal-media-wrap">
              {isVideoPost(selectedPost) && !mediaFailed ? (
                <video
                  className="explore-modal-media"
                  src={selectedPost.videourl}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setMediaFailed(true)}
                  poster={fallbackImage}
                />
              ) : (
                <img
                  className="explore-modal-media"
                  src={mediaFailed ? fallbackImage : getPostMedia(selectedPost)}
                  alt="Post"
                  onError={(e) => {
                    setMediaFailed(true);
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              )}
            </div>
            <div className="explore-modal-info">
              <img
                className="explore-owner-avatar"
                src={selectedPost?.postOwner?.profile || fallbackImage}
                alt={selectedPost?.postOwner?.username || 'owner'}
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
              <div className="explore-owner-text">
                <div className="explore-owner-name">{selectedPost?.postOwner?.username || 'unknown'}</div>
                <div className="explore-owner-desc">{selectedPost?.description || 'No caption added.'}</div>
                <div className="explore-owner-meta">
                  {selectedPost?.isReel ? 'Reel' : 'Post'} - {selectedPost?.nLikes || 0} likes - {selectedPost?.nComments || 0} comments
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default ExplorePage;
