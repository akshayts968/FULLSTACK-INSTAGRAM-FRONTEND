import './SideNavBar.css'
import { useState, useEffect } from 'react';
import Logo from './component/Logo'
import Item from './component/Item';
import ExploreIcon from '@mui/icons-material/Explore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import CreateIcon from '@mui/icons-material/Create';
import ForumIcon from '@mui/icons-material/Forum';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function SearchUser(props){
  const handleUserClick = () => {
    if(props.setIsSearchActive) props.setIsSearchActive(false);
    if(props.setIsNotifActive) props.setIsNotifActive(false);
    if (props.onHistoryAdd) {
      props.onHistoryAdd({
        _id: props.id,
        img: props.img,
        name: props.name,
        username: props.username,
        profile: props.img
      });
    }
  };

  return (
    <Link to={`/${props.linkType === 'message' ? 'message' : 'profile'}/${props.username}`} onClick={handleUserClick} style={{textDecoration: 'none', color:'white'}}>
    <div className='SearchUser' >
      <img className='Search-img' src={`${props.img}`}/>
      <div className='User-deta'>
         <div className='username'>{props.title}</div>
         <div className='name' style={{color: '#a8a8a8'}}>{props.content}</div>
      </div>
    </div>
    </Link>
  )
}

const iconNames = [
  'Home',
  'Search',
  'Explore',
  'Movie Creation',
  'Messager',
  'Favorite',
  'Create',
  'Account',
];
const link = [
  'home',
  '',
  'explore',
  'reels',
  'message',
  '',
  '',
  'profile'
]
const icons = [
  <HomeIcon key="home" />,
  <SearchIcon key="search" />,
  <ExploreIcon key="explore" />,
  <MovieCreationIcon key="movie_creation" />,
  <ChatIcon key="Messager"/>,
  <FavoriteIcon key="favorite" />,
  <CreateIcon key="create" />,
  <AccountCircleIcon key="account" />,
];
const BIcon = [ 
  <SettingsIcon key="settings" />,
  <ForumIcon key="thread"/>
];

function SideNavBar() {
  const [sValue,setSValue] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNotifActive, setIsNotifActive] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchNotifs = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;
    try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER}/notifications/${storedUser._id}`);
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch(error) {}
  };

  useEffect(() => {
    fetchNotifs();
    
    if (socket) {
        const handleNewNotif = async (data) => {
            if (data?.sender) {
               const currentPath = window.location.pathname;
               if (currentPath === `/message/${data.sender}`) {
                   const storedUser = JSON.parse(localStorage.getItem('user'));
                   if (storedUser) {
                       try {
                           // Silently mark this specific conversation's notifications as read
                           await axios.put(`${process.env.REACT_APP_SERVER}/notifications/${storedUser._id}/read`);
                       } catch(err) {}
                   }
                   return; // Suppress the dropdown/badge refresh
               }
            }
            fetchNotifs();
        };
        
        socket.on('newNotification', handleNewNotif);
        
        return () => {
            socket.off('newNotification', handleNewNotif);
        }
    }
  }, [socket]);

  const handleNotifClick = async (state) => {
    setIsNotifActive(state);
    setIsSearchActive(false); // Close search if open
    
    if(state && unreadCount > 0) {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        await axios.put(`${process.env.REACT_APP_SERVER}/notifications/${storedUser._id}/read`);
        setUnreadCount(0);
    }
  };

  const handleSearchClick = (state) => {
    setIsSearchActive(state);
    setIsNotifActive(false); // Close notifs if open
  }

  const handleSaveHistory = (user) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(u => u._id !== user._id);
      const newHistory = [user, ...filtered].slice(0, 15);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  function Search(e){
    setSValue(e.target.value)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (sValue) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_SERVER}/sresult?query=${sValue}`);
          setSearchResult(response.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        setSearchResult("");
      }
    };
    fetchData();
  }, [sValue]);

  return (
    <div className="SideNavBar">
        <Logo></Logo>
        <div className='sideM'>
        <div className='iconDiv' >
        {icons.map((icon, index) => (
       <Item 
          key={index} 
          icon={icon} 
          name={iconNames[index]} 
          link={link[index]} 
          onClick={handleSearchClick} 
          isSearchActive={isSearchActive}
          onNotifClick={handleNotifClick}
          isNotifActive={isNotifActive}
          badgeCount={iconNames[index] === 'Favorite' ? unreadCount : 0}
        >
          {icon}
        </Item>
      ))}
        </div><div className='sideL'>
        {BIcon.map((icon, index) => (
          <Item key={index} icon={icon}>
            {icon}
          </Item>  
        ))}
        </div></div>

        {isSearchActive &&<div className='Search-Div'>
           <div className='Search-Bar'>
              <input className='Search-INPUT' placeholder='Search' onChange={Search} autoFocus></input>
           </div>
           <div className='Recent-Search'>
             <div className='Recent-Search-Head'>
               <span className="title">{sValue ? "Results" : "Recent"}</span>
               {!sValue && searchHistory.length > 0 && (
                 <button className="clear-btn" onClick={clearHistory}>Clear all</button>
               )}
             </div>
             
             {sValue && searchResult ? (
               searchResult.map((user) => (
                 <SearchUser key={user._id} id={user._id} img={user.profile} title={user.username} content={user.name} username={user.username} setIsSearchActive={setIsSearchActive} onHistoryAdd={handleSaveHistory} />
               ))
             ) : (
               !sValue && searchHistory.map((user) => (
                 <SearchUser key={user._id} id={user._id} img={user.profile} title={user.username} content={user.name} username={user.username} setIsSearchActive={setIsSearchActive} onHistoryAdd={handleSaveHistory} />
               ))
             )}
           </div>
        </div>}

        {isNotifActive && <div className='Search-Div' style={{zIndex: 100, borderLeft: '1px solid #262626'}}>
           <div className='Recent-Search-Head' style={{paddingTop: '20px'}}>
             <span className="title" style={{fontSize: '24px', fontWeight: 'bold'}}>Notifications</span>
           </div>
           <div className='Recent-Search' style={{marginTop: '10px'}}>
             {notifications.length > 0 ? (
               notifications.map((notif) => (
                 <SearchUser 
                    key={notif._id} 
                    id={notif.sender?._id} 
                    img={notif.sender?.profile} 
                    title={notif.type === 'message' ? `New message from ${notif.sender?.username}` : `New follower: ${notif.sender?.username}`} 
                    content={notif.content} 
                    username={notif.sender?.username} 
                    linkType={notif.type}
                    setIsNotifActive={setIsNotifActive} 
                 />
               ))
             ) : (
                <div style={{color:'#a8a8a8', textAlign:'center', marginTop:'20px'}}>No new notifications.</div>
             )}
           </div>
        </div>}
    </div>
  );
}

export default SideNavBar;