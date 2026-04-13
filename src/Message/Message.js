import './Message.css';
import SideNavBar from '../NavBar/SideNavBar';
import TopProfile from '../Profile/TopProfile';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SingleMsg from './SingleMsg';
import fetchData from './component/fetchData';
import MessageOne from './pages/MessageOne';
import MessageBox from './pages/MessageBox';
import ProfileMSg from './pages/ProfileMSg';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import InfoIcon from '@mui/icons-material/Info';
import VideoCall from './VideoCall';
import './MessageInd.css';

function MessageInd({ receiver, isMe, isOnline, onDetailsClick, onCallClick }) {
  return (
    <div className='MessageInd'>
      <div className='MessageIndTOP'>
        <div className='MsgMinProfile'>
          <img src={receiver?.profile || 'https://images.unsplash.com/photo-1544502062-f82887f03d1c?q=80&w=1000&auto=format&fit=crop'} alt="Profile" />
        </div>
        <div className='MsgMinName'>
          <span>{isMe ? `${receiver?.name || receiver?.username} (Me)` : (receiver?.name || receiver?.username)}</span>
          <span>{isOnline ? 'Active now' : 'Offline'}</span>
        </div>
        <div className='MsgMinIcons'>
          <span onClick={() => onCallClick('audio')} title="Audio Call">
            <CallIcon fontSize="large" style={{ padding: '4px' }} />
          </span>
          <span onClick={() => onCallClick('video')} title="Video Call">
            <VideocamIcon fontSize="large" style={{ padding: '4px' }} />
          </span>
          <span onClick={onDetailsClick} title="Details">
            <InfoIcon fontSize="large" style={{ padding: '4px' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
function Message() {
  const [showDetails, setShowDetails] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState('video');
  const socket = useSocket();
  const [onlineList, setOnlineList] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) socket.emit('registerUser', currentUser._id);
    });

    socket.on('onlineUsers', (users) => {
      setOnlineList(users);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('message', (data) => {
      console.log('Received message:', data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.off('onlineUsers');
    };
  }, [socket]);
  const { username } = useParams();
  const [MessageList, SetMessageList] = useState([]);
  const [Receiver, setReceiver] = useState({});
  const [MsgView, setMsgView] = useState(false);
  const [room, setRoom] = useState("");
  const [Rid, setRid] = useState(null);
  const [messageRequestStatus, setMessageRequestStatus] = useState(null);
  const [msgOffset, setMsgOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const msgMainRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const id = storedUser._id;

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('registerUser', id);

    const handleMessage = (data) => {
      console.log('Received message:', data);
      SetMessageList((prevMessages) => [...prevMessages, data]);

      // Auto mark as read if room is open
      if (Rid && data.sender === Rid) {
        socket.emit('markMessageRead', { room, senderId: id, receiverId: Rid });
      }
    };

    const handleStatusUpdate = (data) => {
      SetMessageList(prevMessages => prevMessages.map(msg => {
        // 1. Update if the specific message ID matches (works for fetched messages)
        if (data.messageId && msg._id === data.messageId) {
          return { ...msg, status: data.status };
        }

        // 2. Bulk update fallback (Crucial for newly sent local messages without an _id)
        if (data.sender === msg.sender && data.receiver === msg.receiver) {
          // If marked as read, update it
          if (data.status === 'read') {
            return { ...msg, status: 'read' };
          }
          // If marked as delivered, only update if it isn't already read
          if (data.status === 'delivered' && msg.status !== 'read') {
            return { ...msg, status: 'delivered' };
          }
        }

        return msg;
      }));
    };

    const handleIncomingCall = (data) => {
      setIncomingCall({
        signal: data.signal,
        from: data.from,
        name: data.name,
        type: data.type
      });
      setCallType(data.type);
      setCallActive(true);
    };

    socket.on('sendMessage', handleMessage);
    socket.on('messageStatusUpdate', handleStatusUpdate);
    socket.on('callUser', handleIncomingCall);

    return () => {
      socket.off('sendMessage', handleMessage);
      socket.off('messageStatusUpdate', handleStatusUpdate);
      socket.off('callUser', handleIncomingCall);
    };
  }, [socket, Rid, id, room]);

  const contentSave = (message) => {
    // Inject a default 'sent' status if it doesn't exist yet
    const newMsg = {
      ...message,
      status: message.status || 'sent'
    };
    SetMessageList((prevMessages) => [...prevMessages, newMsg]);
    setMsgOffset((prev) => prev + 1);
  };

  useEffect(() => {
    if (username) {
      const fetchReceiver = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_SERVER}/user/by-username/${username}`);
          setReceiver(response.data);
          setRid(response.data._id);
          setMsgView(true);
        } catch (error) {
          console.error('Error fetching receiver by username:', error);
          setMsgView(false);
        }
      };
      fetchReceiver();
    } else {
      setMsgView(false);
      setReceiver({});
      setRid(null);
    }
  }, [username]);

  useEffect(() => {
    if (Rid && id) {
      setMsgOffset(0);
      setHasMoreMessages(true);
      const currentRoom = [id, Rid].sort().join('-');
      setRoom(currentRoom);
      socket.emit('joinRoom', currentRoom);
      socket.emit('markMessageRead', { room: currentRoom, senderId: id, receiverId: Rid });

      const fetchMessageData = async () => {
        try {
          const data = await fetchData(id, Rid, 0, 5);
          SetMessageList(data.messages || []);
          setMsgOffset((data.messages || []).length);
          setHasMoreMessages(Boolean(data.hasMore));
          setMessageRequestStatus(data.requestStatus || null);
        } catch (error) {
          console.error('Error in fetchMessageData:', error);
        }
      };
      fetchMessageData();
    }
  }, [Rid, id]);

  useEffect(() => {
    const node = msgMainRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [Rid]);

  const loadOlderMessages = async () => {
    if (!Rid || !id || !hasMoreMessages || loadingMoreMessages) return;
    const node = msgMainRef.current;
    const prevHeight = node ? node.scrollHeight : 0;
    setLoadingMoreMessages(true);
    try {
      const data = await fetchData(id, Rid, msgOffset, 10);
      const older = data.messages || [];
      if (older.length) {
        SetMessageList((prev) => [...older, ...prev]);
        setMsgOffset((prev) => prev + older.length);
      }
      setHasMoreMessages(Boolean(data.hasMore));
      if (data.requestStatus) setMessageRequestStatus(data.requestStatus);
      requestAnimationFrame(() => {
        if (node) {
          const nextHeight = node.scrollHeight;
          node.scrollTop = nextHeight - prevHeight;
        }
      });
    } catch (error) {
      console.error('Error loading older messages', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  const respondToMessageRequest = async (action) => {
    if (!messageRequestStatus?._id) return;
    try {
      const res = await axios.put(`${process.env.REACT_APP_SERVER}/messages/request/${messageRequestStatus._id}`, {
        userId: id,
        action
      });
      setMessageRequestStatus(res.data.requestStatus);
    } catch (error) {
      console.error('Failed to respond request', error);
    }
  };

  const formatDateLabel = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startToday - startMsg) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const sameDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  const [ChatList, setChatList] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER}/all`);
        console.log(response);
        setChatList(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <SideNavBar></SideNavBar>
      <div className="Message">
        <TopProfile cl={"Message_TOP"} username={storedUser.username}></TopProfile>
        <div className='Message-header'>
          <div className='Message-TL'>Messages</div>
          <div className='request'>Request</div>
        </div>
        {ChatList && ChatList.map((messageId) => {
          let displayName = messageId.name || messageId.username;
          if (messageId._id === id) {
            displayName += " (Me)";
          }
          return (
            <Link to={`/message/${messageId.username}`} key={messageId._id}>
              <MessageOne profile={messageId.profile} name={displayName} ></MessageOne></Link>
          )
        })}
      </div>
      {MsgView && <div className='MessageView'>
        <MessageInd
          receiver={Receiver}
          isMe={Receiver._id === id}
          isOnline={onlineList.includes(Receiver._id)}
          onDetailsClick={() => setShowDetails(!showDetails)}
          onCallClick={(type) => {
            setCallType(type);
            setIncomingCall(null);
            setCallActive(true);
          }}
        />
        <div
          className='msgMain'
          ref={msgMainRef}
          onScroll={(e) => {
            if (e.currentTarget.scrollTop <= 20) loadOlderMessages();
          }}
        >
          <ProfileMSg key={Receiver._id} id={Receiver._id} name={Receiver._id === id ? `${Receiver.name || Receiver.username} (Me)` : (Receiver.name || Receiver.username)} profile={Receiver.profile} ></ProfileMSg>
          {loadingMoreMessages && <div className='msg-load-indicator'>Loading older messages...</div>}
          {MessageList && MessageList.map((msg, index) => (
            <div key={index}>
              {(index === 0 || !sameDay(MessageList[index - 1]?.timestamp, msg.timestamp)) && (
                <div className='msg-date-separator'>{formatDateLabel(msg.timestamp)}</div>
              )}
              <SingleMsg message={msg} id={msg._id} userid={Receiver._id} sender={msg.sender} profile={Receiver.profile} receiver={msg.receiver} content={msg.content} />
            </div>
          ))}
        </div>
        {messageRequestStatus?.status === 'pending' && String(messageRequestStatus.recipient) === String(id) && (
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            <button onClick={() => respondToMessageRequest('accept')}>Accept Request</button>
            <button onClick={() => respondToMessageRequest('reject')}>Reject Request</button>
          </div>
        )}
        <MessageBox
          RID={Receiver._id}
          socket={socket}
          room={room}
          contentSave={contentSave}
          requestStatus={messageRequestStatus}
          currentUserId={id}
        ></MessageBox>
      </div>}

      {MsgView && showDetails && (
        <div className='MessageDetailsPanel'>
          <div className='details-header'>
            <h4>Details</h4>
          </div>
          <div className='details-body'>
            <div className='details-profile-pic'>
              <img src={Receiver?.profile || 'https://images.unsplash.com/photo-1544502062-f82887f03d1c?q=80&w=1000&auto=format&fit=crop'} alt="Profile" />
            </div>
            <div className='details-info'>
              <h3>{Receiver?.name || Receiver?.username}</h3>
              {Receiver?.username && <p>@{Receiver.username}</p>}
              {Receiver?.bio && <p className="details-bio">{Receiver.bio}</p>}
            </div>
          </div>
        </div>
      )}

      {callActive && (
        <VideoCall
          socket={socket}
          receiverId={Receiver?._id}
          callerId={id}
          type={callType}
          isReceiving={!!incomingCall}
          incomingSignal={incomingCall?.signal}
          callerName={incomingCall?.name}
          onEndCall={() => {
            setCallActive(false);
            setIncomingCall(null);
          }}
        />
      )}
    </>
  );
}

export default Message;
