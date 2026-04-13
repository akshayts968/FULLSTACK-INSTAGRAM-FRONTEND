import './Item.css';
import { Link } from 'react-router-dom';
function Item(props) {
  function ClickHandler(e){
    if(props.name==="Search") {
      e.preventDefault();
      props.onClick(!props.isSearchActive);
    } else if (props.name === "Notifications" || props.name === "Favorite") {
      e.preventDefault();
      if(props.onNotifClick) props.onNotifClick(!props.isNotifActive);
    }
  }

  const content = (
    <div className="Item" onClick={ClickHandler}>
       {props.badgeCount > 0 ? (
           <div style={{position: 'relative'}}>
               {props.icon}
               <span style={{position:'absolute', top: -8, right: -10, background:'#ff3040', borderRadius:'10px', minWidth:16, height:16, padding:'0 4px', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>
                 {props.badgeCount > 99 ? '99+' : props.badgeCount}
               </span>
           </div>
       ) : props.icon}
        <div className='ItemName'>{props.name}</div>
    </div>
  );

  if (props.name === "Search" || props.name === "Notifications" || props.name === "Favorite") {
    return content;
  }

  return (
    <Link to={`/${props.link}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {content}
    </Link>
  );
}

export default Item;
