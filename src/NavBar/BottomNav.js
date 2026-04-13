import './BottomNav.css';
import ExploreIcon from '@mui/icons-material/Explore';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatIcon from '@mui/icons-material/Chat';
import CreateIcon from '@mui/icons-material/Create';
import { Link } from 'react-router-dom';

function BottomNav() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const fallbackImage =
    process.env.REACT_APP_FALLBACK_IMAGE ||
    'https://i.pinimg.com/originals/44/bf/66/44bf66ebb891eef4f48b8492f001c938.jpg';
  return (
    <div className="BottomNav">
      <Link className="bottom-nav-item" to="/home"><HomeIcon /></Link>
      <Link className="bottom-nav-item" to="/explore"><ExploreIcon /></Link>
      <Link className="bottom-nav-item" to="/reels"><MovieCreationIcon /></Link>
      <Link className="bottom-nav-item" to="/message"><ChatIcon /></Link>
      <Link className="bottom-nav-item" to="/create"><CreateIcon /></Link>
      <Link className="bottom-nav-item" to="/profile">
        {user?.profile ? (
          <img
            src={user.profile}
            alt="Profile"
            onError={(e) => { e.currentTarget.src = fallbackImage; }}
          />
        ) : (
          <AccountCircleIcon />
        )}
      </Link>
    </div>
  );
}

export default BottomNav;
