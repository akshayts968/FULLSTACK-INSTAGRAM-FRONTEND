import './SingleMsg.css';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';

function SingleMsg(props) {
  const sender = props.userid != props.sender ? "Sender" : 'Receiver';
  const SBOOL = sender != "Sender";
  return (
    <div className={`${sender} SingleMsg`}>
      {SBOOL && <img className='IMG' src={props.profile || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOr3cDHrDjizSMpE4E4zRDzGsV6F7EmO867A&s'}></img>}
      <div className='MSG'>
        {props.message?.media && props.message.media.length > 0 && (
          <div className={props.message.media.length > 1 ? 'media-grid' : 'media-single'}>
            {props.message.media.map((url, i) => {
              if (url.endsWith('.mp4') || url.endsWith('.mov')) return <video key={i} src={url} controls className='media-item' />;
              if (url.endsWith('.webm') || url.endsWith('.mp3')) return <audio key={i} src={url} controls className='media-audio' />;
              return <img key={i} src={url} alt="media" className='media-item' />;
            })}
          </div>
        )}
        {props.content && (
          <div className='MSG-content'>
            {props.content}
            {!SBOOL && (
              <span className='msg-status-tick'>
                {props.message.status === 'read' ? (
                  <DoneAllIcon sx={{ fontSize: 14, color: '#34B7F1' }} />
                ) : props.message.status === 'delivered' ? (
                  <DoneAllIcon sx={{ fontSize: 14, color: '#a8a8a8' }} />
                ) : (
                  <DoneIcon sx={{ fontSize: 14, color: '#a8a8a8' }} />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SingleMsg;