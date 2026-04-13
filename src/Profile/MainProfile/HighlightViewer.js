import React, { useState, useEffect } from 'react';
import './HighlightViewer.css';
import axios from 'axios';

function HighlightViewer({ highlightGroup, onClose, ownerId, canManage, onHighlightUpdated }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const medias = highlightGroup.medias || [];

  useEffect(() => {
    if (medias.length === 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      handleNext();
    }, 5000); // 5 seconds per slide natively

    return () => clearTimeout(timer);
  }, [currentIndex, medias.length]);

  const handleNext = () => {
    if (currentIndex < medias.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose(); // Automatically exit on last slide natively
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Loop or bounce back
      setCurrentIndex(0);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!canManage || !ownerId) return;
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_SERVER}/user/${ownerId}/highlight/${encodeURIComponent(highlightGroup.name)}/media/${currentIndex}`
      );
      if (onHighlightUpdated) onHighlightUpdated(response.data.user, highlightGroup.name);
      const nextLength = (response.data.user?.highlight || []).find((h) => h.name === highlightGroup.name)?.medias?.length || 0;
      if (nextLength === 0) onClose();
      else setCurrentIndex((prev) => Math.max(0, Math.min(prev, nextLength - 1)));
    } catch (error) {
      console.error('Failed to delete highlight media', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (medias.length === 0) return null;

  return (
    <div className="highlight-viewer-overlay">
      
      <div className="highlight-viewer-header">
        {medias.map((_, index) => (
          <div key={index} className="highlight-progress-bar">
            <div 
              className="highlight-progress-fill" 
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? '100%' : '0%',
                transition: index === currentIndex ? 'width 5s linear' : 'none'
              }}
            ></div>
          </div>
        ))}
      </div>

      <div className="highlight-title">{highlightGroup.name}</div>
      <button className="highlight-close-btn" onClick={onClose}>&times;</button>
      {canManage && (
        <button className="highlight-delete-media-btn" onClick={() => setShowDeleteConfirm(true)}>
          Delete This
        </button>
      )}

      <div className="highlight-media-container">
        
        <div className="highlight-nav-left" onClick={handlePrev}></div>
        <div className="highlight-nav-right" onClick={handleNext}></div>

        <img src={medias[currentIndex]} className="highlight-media-img" alt="Highlight Slide" />
      </div>

      {showDeleteConfirm && (
        <div className="highlight-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="highlight-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="highlight-confirm-title">Delete this highlight item?</div>
            <div className="highlight-confirm-subtitle">This action cannot be undone.</div>
            <div className="highlight-confirm-actions">
              <button className="highlight-confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="highlight-confirm-btn delete" onClick={handleDeleteCurrent}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default HighlightViewer;
