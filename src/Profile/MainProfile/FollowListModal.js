import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function FollowListModal({ userId, type, onClose }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const listRef = useRef(null);

  const fetchPage = async (targetPage = 1, reset = false) => {
    if (!userId) return;
    const res = await axios.get(
      `${process.env.REACT_APP_SERVER}/user/${userId}/follows?type=${type}&page=${targetPage}&limit=20&query=${encodeURIComponent(query)}`
    );
    setItems((prev) => (reset ? res.data.users : [...prev, ...res.data.users]));
    setHasMore(res.data.hasMore);
    setPage(targetPage);
  };

  useEffect(() => {
    fetchPage(1, true);
  }, [userId, type, query]);

  const onScroll = async () => {
    const node = listRef.current;
    if (!node || !hasMore) return;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 30;
    if (nearBottom) fetchPage(page + 1, false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000 }} onClick={onClose}>
      <div
        style={{ width: 380, maxHeight: '70vh', margin: '8vh auto', background: '#111', color: '#fff', borderRadius: 12, padding: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{type === 'followers' ? 'Followers' : 'Following'}</h3>
        <input
          style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 8 }}
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div ref={listRef} onScroll={onScroll} style={{ overflowY: 'auto', maxHeight: '52vh' }}>
          {items.map((u) => (
            <Link key={u._id} to={`/profile/${u.username}`} onClick={onClose} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', color: '#fff', textDecoration: 'none' }}>
              <img src={u.profile} alt={u.username} style={{ width: 34, height: 34, borderRadius: '50%' }} />
              <div>
                <div>{u.username}</div>
                <div style={{ color: '#aaa', fontSize: 12 }}>{u.name}</div>
              </div>
            </Link>
          ))}
          {!items.length && <div style={{ color: '#aaa' }}>No users found.</div>}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;
