import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../NavBar/TopNav';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';
import PostADD from '../Add/Padd';

function CreatePage() {
  const navigate = useNavigate();

  return (
    <div className="Main">
      <TopNav />
      <SideNavBar />
      <div className="MainHome">
        <PostADD onClose={() => navigate('/profile')} />
      </div>
      <BottomNav />
    </div>
  );
}

export default CreatePage;
