import { Link } from "react-router-dom";
import './ProfileMsg.css'
function ProfileMSg(props){
    return (
      <div className='ProfileMSg'>
        <img src={ props.profile||'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOr3cDHrDjizSMpE4E4zRDzGsV6F7EmO867A&s'}></img>
        <div className="ProfileNameMSg">{props.name||'APNA COLLEGE'}</div> 
        <div className="ProfileNameSubMSg">{props.Messager||'Officialapnacollege . insta'}</div>
        <Link to={`/profile/${props.id}`}><div className='viewPro'>view profile</div></Link>
      </div>
    )
  }
  export default ProfileMSg;