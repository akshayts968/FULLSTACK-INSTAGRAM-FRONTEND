import React, { useState, useEffect } from 'react';
import './HighlightViewer.css';

function HighlightViewer({ highlightGroup, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
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

      <div className="highlight-media-container">
        
        <div className="highlight-nav-left" onClick={handlePrev}></div>
        <div className="highlight-nav-right" onClick={handleNext}></div>

        <img src={medias[currentIndex]} className="highlight-media-img" alt="Highlight Slide" />
      </div>

    </div>
  );
}

export default HighlightViewer;
