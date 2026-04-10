import './Item.css';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
function Item(props) {
  function ClickHandler(e){
    if(props.name==="Search") {
      e.preventDefault();
      props.onClick(!props.isSearchActive);
    } else if (props.name === "Favorite") {
      e.preventDefault();
      if(props.onNotifClick) props.onNotifClick(!props.isNotifActive);
    }
  }

  const content = (
    <div className="Item" onClick={ClickHandler}>
       {props.badgeCount > 0 ? (
           <div style={{position: 'relative'}}>
               {props.icon}
               <span style={{position:'absolute', top: -5, right: -5, background:'red', borderRadius:'50%', width:8, height:8}}></span>
           </div>
       ) : props.icon}
        <div className='ItemName'>{props.name}</div>
    </div>
  );

  if (props.name === "Search" || props.name === "Create" || props.name === "Favorite") {
    return content;
  }

  return (
    <Link to={`/${props.link}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {content}
    </Link>
  );
}

export default Item;
