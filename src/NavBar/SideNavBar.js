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
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import CollectionsIcon from '@mui/icons-material/Collections';
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
  'Reels',
  'Messages',
  'Notifications',
  'Create',
  'Profile',
];
const link = [
  'home',
  '',
  'explore',
  'reels',
  'message',
  '',
  'create',
  'profile'
]
const icons = [
  <HomeIcon key="home" />,
  <SearchIcon key="search" />,
  <ExploreIcon key="explore" />,
  <MovieCreationIcon key="movie_creation" />,
  <ChatIcon key="messages"/>,
  <FavoriteIcon key="notifications" />,
  <AddBoxOutlinedIcon key="create" />,
  <AccountCircleIcon key="account" />,
];
const BIcon = [
  <CollectionsIcon key="albums" />,
  <SettingsIcon key="settings" />,
  <ForumIcon key="thread"/>
];

function SideNavBar() {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const [sValue,setSValue] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNotifActive, setIsNotifActive] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
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
        setPendingRequestCount(response.data.filter(n => n.type === 'follow_request' || n.type === 'album_invite').length);
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

  const handleFollowRequest = async (notif, action) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !notif?.sender?._id) return;
    try {
      await axios.put(`${process.env.REACT_APP_SERVER}/user/${storedUser._id}/request/${notif.sender._id}`, { action });
      await axios.delete(`${process.env.REACT_APP_SERVER}/notifications/${notif._id}`);
      fetchNotifs();
    } catch (error) {
      console.error('Failed to handle follow request', error);
    }
  };

  const handleAlbumInvite = async (notif, action) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !notif?.link) return;
    const albumId = notif.link.split('/').filter(Boolean).pop();
    if (!albumId) return;
    try {
      await axios.put(`${process.env.REACT_APP_SERVER}/albums/${albumId}/invite/respond`, {
        userId: storedUser._id,
        action
      });
      await axios.delete(`${process.env.REACT_APP_SERVER}/notifications/${notif._id}`);
      fetchNotifs();
    } catch (error) {
      console.error('Failed to handle album invite', error);
    }
  };

  const clearSingleNotification = async (notifId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_SERVER}/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (error) {
      console.error('Failed to clear notification', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Promise.all((notifications || []).map((n) => axios.delete(`${process.env.REACT_APP_SERVER}/notifications/${n._id}`)));
      setNotifications([]);
      setUnreadCount(0);
      setPendingRequestCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications', error);
    }
  };

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
      (() => {
        const isProfileItem = iconNames[index] === 'Profile';
        const renderedIcon = isProfileItem && storedUser?.profile ? (
          <img
            src={storedUser.profile}
            alt="Profile"
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid #4a4a4a' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : icon;
        return (
       <Item 
          key={index} 
          icon={renderedIcon} 
          name={iconNames[index]} 
          link={link[index]} 
          onClick={handleSearchClick} 
          isSearchActive={isSearchActive}
          onNotifClick={handleNotifClick}
          isNotifActive={isNotifActive}
          badgeCount={iconNames[index] === 'Notifications' ? pendingRequestCount : 0}
        >
          {renderedIcon}
        </Item>
      )})()
      ))}
        </div><div className='sideL'>
        {BIcon.map((icon, index) => (
          <Item
            key={index}
            icon={icon}
            name={index === 0 ? 'Albums' : index === 1 ? 'Settings' : 'Threads'}
            link={index === 0 ? 'albums' : index === 1 ? 'settings' : 'message'}
          >
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
             {notifications.length > 0 && (
               <button className="clear-btn" onClick={clearAllNotifications}>Clear All</button>
             )}
           </div>
           <div className='Recent-Search' style={{marginTop: '10px'}}>
             {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif._id}>
                  <SearchUser
                    id={notif.sender?._id}
                    img={notif.sender?.profile}
                    title={
                      notif.type === 'message'
                        ? `New message from ${notif.sender?.username}`
                        : notif.type === 'follow_request'
                        ? `${notif.sender?.username} sent follow request`
                        : notif.type === 'album_invite'
                        ? `${notif.sender?.username} invited you to an album`
                        : `New follower: ${notif.sender?.username}`
                    }
                    content={notif.content}
                    username={notif.sender?.username}
                    linkType={notif.type}
                    setIsNotifActive={setIsNotifActive}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 16px 8px' }}>
                    <button className='notif-action-btn reject' onClick={() => clearSingleNotification(notif._id)}>
                      Clear
                    </button>
                  </div>
                  {notif.type === 'follow_request' && (
                    <div className='follow-request-actions'>
                      <button className='notif-action-btn accept' onClick={() => handleFollowRequest(notif, 'accept')}>Accept</button>
                      <button className='notif-action-btn reject' onClick={() => handleFollowRequest(notif, 'reject')}>Reject</button>
                    </div>
                  )}
                  {notif.type === 'album_invite' && (
                    <div className='follow-request-actions'>
                      <button className='notif-action-btn accept' onClick={() => handleAlbumInvite(notif, 'accept')}>Join Album</button>
                      <button className='notif-action-btn reject' onClick={() => handleAlbumInvite(notif, 'reject')}>Reject</button>
                    </div>
                  )}
                </div>
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