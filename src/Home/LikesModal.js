import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './LikesModal.css';

const LikesModal = ({ postId, onClose }) => {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Observer ref for infinite scrolling
    const observer = useRef();
    const lastUserElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchLikes = async () => {
            setLoading(true);
            try {
                const limit = 20;
                const response = await axios.get(`${process.env.REACT_APP_SERVER}/post/${postId}/likesDetails?page=${page}&limit=${limit}`);
                setUsers(prevUsers => [...prevUsers, ...response.data.users]);
                setHasMore(response.data.hasMore);
            } catch (error) {
                console.error("Error fetching likes details:", error);
            }
            setLoading(false);
        };
        fetchLikes();
    }, [postId, page]);

    return (
        <div className="likes-modal-overlay" onClick={onClose}>
            <div className="likes-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="likes-modal-header">
                    <h4>Likes</h4>
                    <button onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
                </div>
                <div className="likes-modal-body">
                    {users.map((user, index) => {
                        if (users.length === index + 1) {
                            return (
                                <div ref={lastUserElementRef} className="likes-user-row" key={user._id || index}>
                                    <img src={user.profile} alt="profile" />
                                    <div className="likes-user-info">
                                        <span className="likes-username">{user.username}</span>
                                        <span className="likes-name">{user.name}</span>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div className="likes-user-row" key={user._id || index}>
                                    <img src={user.profile} alt="profile" />
                                    <div className="likes-user-info">
                                        <span className="likes-username">{user.username}</span>
                                        <span className="likes-name">{user.name}</span>
                                    </div>
                                </div>
                            );
                        }
                    })}
                    {loading && <div className="likes-loading">Loading...</div>}
                    {!loading && users.length === 0 && <div className="likes-loading">No likes yet.</div>}
                </div>
            </div>
        </div>
    );
};

export default LikesModal;
