import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNav from '../NavBar/TopNav';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';

function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/post/all?viewerId=${user?._id || ''}`);
        const allPosts = res.data.posts || [];
        const onlyReels = allPosts.filter((p) => p.isReel);
        setReels(onlyReels);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Failed to load reels', error);
      }
    };
    fetchReels();
  }, [user?._id]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(reels.length - 1, prev + 1));
  };

  const currentReel = reels[currentIndex];

  return (
    <div className="Main">
      <TopNav />
      <SideNavBar />
      <div className="MainHome" style={{ paddingTop: 12 }}>
        <h2 style={{ color: '#fff', marginBottom: 14 }}>Reels</h2>
        {currentReel ? (
          <div style={{ width: '100%', maxWidth: 520, background: '#111', borderRadius: 10, padding: 8 }}>
            <video
              key={currentReel._id}
              src={currentReel.videourl}
              controls
              autoPlay
              muted
              style={{ width: '100%', maxHeight: 540, borderRadius: 8, objectFit: 'cover' }}
            />
            <div style={{ color: '#fff', marginTop: 8, fontSize: 14 }}>{currentReel.description || 'Reel'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
              <button onClick={goPrev} disabled={currentIndex === 0}>Previous</button>
              <span style={{ color: '#a8a8a8', fontSize: 12, alignSelf: 'center' }}>
                {currentIndex + 1} / {reels.length}
              </span>
              <button onClick={goNext} disabled={currentIndex === reels.length - 1}>Next</button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#a8a8a8' }}>No reels available yet.</div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default ReelsPage;
