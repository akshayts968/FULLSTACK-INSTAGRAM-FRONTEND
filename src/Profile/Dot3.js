import React from 'react';
import './Dot3.css';
import { useState } from 'react';
import { faL } from '@fortawesome/free-solid-svg-icons';

function Item({ text, color, onClick }) {
  return (
    <div className='dotItem' style={{ color, cursor: 'pointer' }} onClick={onClick}>
      {text}
    </div>
  );
}

function Dot3({toggle, isOwner, onDeleteClick}) {
  const items = isOwner 
    ? ['Delete', 'Edit', 'Hide like count', 'Turn off commenting', 'Cancel']
    : ['Report', 'Unfollow', 'Add to favorites', 'Go to post', 'Share to..', 'Copy link', 'Embed', 'About this account', 'Cancel'];

  const handleClick = (e, item) => {
    e.stopPropagation();
    if (item === 'Delete' && onDeleteClick) {
      onDeleteClick();
    } else {
      toggle(e);
    }
  };

  return (
    <div className='Dot' onClick={toggle}>
    <div className="Dot3">
      <div className="Dot3Main">
        {items.map((item, index) => (
          <Item 
            key={index} 
            text={item} 
            color={(item === 'Delete' || item === 'Report' || item === 'Unfollow') ? 'rgb(237, 73, 86)' : 'white'} 
            onClick={(e) => handleClick(e, item)}
          />
        ))}
      </div>
    </div> </div>
  );
}

export default Dot3;
