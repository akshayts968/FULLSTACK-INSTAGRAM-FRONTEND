import { useState, useRef } from "react";
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PhotoIcon from '@mui/icons-material/Photo';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmojiPicker from 'emoji-picker-react';
import axios from "axios";
import './MessageBox.css';

function MessageBox(props) {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [message, setMessage] = useState('');
    const [toggleBtn, setToggleBtn] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        setToggleBtn(e.target.value.trim() !== "");
    };

    const handleFileUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMediaFiles(prev => [...prev, ...files]);
            
            const previews = files.map(file => URL.createObjectURL(file));
            setMediaPreviews(prev => [...prev, ...previews]);
            setToggleBtn(true);
        }
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice_memo.webm", { type: 'audio/webm' });
                
                setMediaFiles(prev => [...prev, audioFile]);
                setMediaPreviews(prev => [...prev, URL.createObjectURL(audioBlob)]);
                setToggleBtn(true);
                audioChunksRef.current = [];
            };
            
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
        setToggleBtn(true);
    };

    const handleSubmit = async () => {
        setShowEmoji(false);
        let uploadedMediaUrls = [];

        if (mediaFiles.length > 0) {
            const formData = new FormData();
            mediaFiles.forEach((file) => {
                formData.append("Image", file);
            });

            try {
                const uploadResponse = await axios.post(
                    `${process.env.REACT_APP_SERVER}/cloudinary/upload`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                uploadedMediaUrls = uploadResponse.data.urls;
            } catch (error) {
                console.error('Error uploading media:', error);
                return;
            }
        }

        try {
            const payload = {
                content: message,
                media: uploadedMediaUrls
            };
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/messages/${storedUser._id}/${props.RID}`, payload);
            
            // Send socket real-time message payload inside current chat room
            props.socket.emit('sendMessage', { room: props.room, content: response.data });
            
            // Send global socket real-time notification push to receiver
            props.socket.emit('sendNotification', { receiver: props.RID, sender: storedUser.username });
            
            props.contentSave(response.data);
            
            setMessage('');
            setMediaFiles([]);
            setMediaPreviews([]);
            setToggleBtn(false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className='MessageBox'>
            {showEmoji && (
                <div style={{ position: 'absolute', bottom: '80px', zIndex: 10 }}>
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
            )}
            
            {mediaPreviews.length > 0 && (
                <div className="MsgImgPreview">
                    <img 
                        src='https://www.pngplay.com/wp-content/uploads/8/Upload-Icon-Logo-PNG-Photos.png' 
                        onClick={handleFileUploadClick} 
                        alt="Upload more" 
                        style={{ width: '60px', height: '60px', padding: '16px', cursor: 'pointer' }} 
                    />
                    {mediaPreviews.map((preview, index) => {
                        const fileType = mediaFiles[index]?.type;
                        return (
                            <div key={index} style={{ position: "relative" }}>
                                {fileType && fileType.startsWith("video") ? (
                                    <video src={preview} controls style={{ width: '150px', borderRadius: '8px' }} />
                                ) : fileType && fileType.startsWith("audio") ? (
                                    <audio src={preview} controls style={{ width: '200px' }} />
                                ) : (
                                    <img src={preview} alt={'Preview'} style={{ width: '60px', height: '60px', padding: '16px', borderRadius: '8px' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className='Message-Box'>
                <EmojiEmotionsIcon className='Emoji' onClick={() => setShowEmoji(!showEmoji)} style={{ cursor: 'pointer' }} />
                <div className='INPUT'>
                    <input 
                        className="Iinput"
                        placeholder='Write Message' 
                        value={message} 
                        onChange={handleInputChange}
                    />
                </div>
                
                {toggleBtn ? (
                    <button className="MSGSend" onClick={handleSubmit}>Submit</button>
                ) : (
                    <>
                        {isRecording ? (
                            <StopIcon className='Emoji' onClick={handleStopRecording} style={{ color: 'red', cursor: 'pointer' }} />
                        ) : (
                            <MicIcon className='Emoji' onClick={handleStartRecording} style={{ cursor: 'pointer' }} />
                        )}
                        <PhotoIcon className='Emoji' onClick={handleFileUploadClick} style={{ cursor: 'pointer' }} />
                        <FavoriteBorderIcon className='Emoji' onClick={() => {
                            setMessage('❤️');
                            setToggleBtn(true);
                        }} style={{ cursor: 'pointer' }} />
                    </>
                )}
                
                {/* Keep file input mounted globally so multiple file picker clicks don't crash */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}

export default MessageBox;