import './BottomNav.css';
import Item from './component/Item';
import ExploreIcon from '@mui/icons-material/Explore';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatIcon from '@mui/icons-material/Chat';
import CreateIcon from '@mui/icons-material/Create';
import { Link } from 'react-router-dom';

function BottomNav() {
  return (
    <div className="BottomNav">
      <Link to="/home"><Item icon={<HomeIcon />} name="Home" link="home" /></Link>
      <Link to="/explore"><Item icon={<ExploreIcon />} name="Explore" link="explore" /></Link>
      <Link to="/reels"><Item icon={<MovieCreationIcon />} name="Movie Creation" link="reels" /></Link>
      <Link to="/message"><Item icon={<ChatIcon />} name="Messager" link="message" /></Link>
      <Link to="/create"><Item icon={<CreateIcon />} name="Create" link="create" /></Link>
      <Link to="/profile">
        <Item key={6} icon={ <AccountCircleIcon key="account" />}></Item>
      </Link>
    </div>
  );
}

export default BottomNav;
