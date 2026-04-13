import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SideNavBar from '../NavBar/SideNavBar';
import BottomNav from '../NavBar/BottomNav';
import './AlbumsPage.css';

function AlbumsPage() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [users, setUsers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [name, setName] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [timeCapsuleEnabled, setTimeCapsuleEnabled] = useState(false);
  const [revealAt, setRevealAt] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const availableMembers = useMemo(
    () => users.filter((u) => u._id !== user?._id),
    [users, user]
  );

  const fetchAlbums = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER}/albums/user/${user._id}`);
      setAlbums(res.data || []);
      setErrorMsg('');
    } catch (error) {
      setAlbums([]);
      setErrorMsg(
        error?.response?.status === 404
          ? 'Albums API not found. Restart/update backend to load collaborative albums.'
          : 'Failed to load albums.'
      );
    }
  }, [user?._id]);

  const loadAlbum = async (albumId) => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER}/albums/${albumId}/view/${user._id}`);
      setSelectedAlbum(res.data);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to open selected album.');
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    axios
      .get(`${process.env.REACT_APP_SERVER}/all`)
      .then((res) => setUsers(res.data || []))
      .catch(() => setUsers([]));
    fetchAlbums();
  }, [user?._id, fetchAlbums]);

  const createAlbum = async () => {
    if (!name.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_SERVER}/albums`, {
        ownerId: user._id,
        name,
        memberIds,
        timeCapsuleEnabled,
        revealAt: timeCapsuleEnabled ? revealAt : null
      });
      setName('');
      setMemberIds([]);
      setTimeCapsuleEnabled(false);
      setRevealAt('');
      setErrorMsg('');
      await fetchAlbums();
    } catch (error) {
      setErrorMsg('Failed to create album.');
    }
  };

  const uploadToAlbum = async () => {
    if (!selectedAlbum?._id || uploadFiles.length === 0) return;
    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append('Image', f));
      const upload = await axios.post(`${process.env.REACT_APP_SERVER}/cloudinary/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await axios.post(`${process.env.REACT_APP_SERVER}/albums/${selectedAlbum._id}/items`, {
        userId: user._id,
        mediaUrls: upload.data.urls || []
      });
      setUploadFiles([]);
      setErrorMsg('');
      await loadAlbum(selectedAlbum._id);
      await fetchAlbums();
    } catch (error) {
      setErrorMsg('Failed to upload photo to album.');
    }
  };

  return (
    <>
      <SideNavBar />
      <div className="albums-page">
        <div className="albums-create">
          <h2>Collaborative Albums</h2>
          {errorMsg && <p className="capsule-note">{errorMsg}</p>}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Album name (e.g. Goa Trip 2026)"
          />
          <label className="albums-label">Invite friends:</label>
          <div className="albums-members">
            {availableMembers.map((u) => (
              <label key={u._id} className="member-option">
                <input
                  type="checkbox"
                  checked={memberIds.includes(u._id)}
                  onChange={(e) => {
                    if (e.target.checked) setMemberIds((prev) => [...prev, u._id]);
                    else setMemberIds((prev) => prev.filter((id) => id !== u._id));
                  }}
                />
                {u.username}
              </label>
            ))}
          </div>
          <label className="albums-checkbox">
            <input
              type="checkbox"
              checked={timeCapsuleEnabled}
              onChange={(e) => setTimeCapsuleEnabled(e.target.checked)}
            />
            Enable Time Capsule (blur photos until reveal date)
          </label>
          {timeCapsuleEnabled && (
            <input
              type="datetime-local"
              value={revealAt}
              onChange={(e) => setRevealAt(e.target.value)}
            />
          )}
          <button onClick={createAlbum}>Create Album</button>
        </div>

        <div className="albums-list">
          <h3>Your Shared Albums</h3>
          {(albums || []).map((album) => (
            <button key={album._id} className="album-card" onClick={() => loadAlbum(album._id)}>
              <div>{album.name}</div>
              <small>{album.items?.length || 0} photos</small>
            </button>
          ))}
        </div>

        {selectedAlbum && (
          <div className="albums-viewer">
            <h3>{selectedAlbum.name}</h3>
            {selectedAlbum.timeCapsuleEnabled && selectedAlbum.revealAt && (
              <p className="capsule-note">
                Time Capsule reveal: {new Date(selectedAlbum.revealAt).toLocaleString()}
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
            />
            <small className="upload-hint">
              Step: choose photos here, then click "Upload to Album".
            </small>
            <button onClick={uploadToAlbum}>Upload to Album</button>
            <div className="albums-grid">
              {(selectedAlbum.items || []).map((item) => (
                <div key={item._id} className={`albums-photo ${item.isBlurred ? 'blurred' : ''}`}>
                  <img src={item.mediaUrl} alt="Album item" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}

export default AlbumsPage;
