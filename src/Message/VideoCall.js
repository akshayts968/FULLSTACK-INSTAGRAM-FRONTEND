import React, { useEffect, useRef, useState, useCallback } from 'react';
import CallEndIcon from '@mui/icons-material/CallEnd';
import './VideoCall.css';

const VideoCall = ({ socket, receiverId, callerId, type, isReceiving, incomingSignal, onEndCall }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const peerConnection = useRef(null);

    const remoteId = isReceiving ? callerId : receiverId;

    // 1. Initialize Media Stream
    useEffect(() => {
        const getUserMedia = async () => {
            try {
                const constraints = {
                    video: type === 'video',
                    audio: true
                };
                const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            } catch (err) {
                console.error("Media Access Error:", err);
                alert("Could not access camera/microphone. Please check permissions.");
            }
        };

        getUserMedia();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [type]);

    // 2. Peer Connection Logic
    const createPeerConnection = useCallback((localStream) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    to: remoteId,
                    candidate: event.candidate
                });
            }
        };

        return pc;
    }, [socket, remoteId]);

    // 3. Signaling Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('callAccepted', async (signal) => {
            setCallAccepted(true);
            if (peerConnection.current && signal.description) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.description));
            }
        });

        socket.on('iceCandidate', async (candidate) => {
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding ice candidate', e);
                }
            }
        });

        socket.on('callEnded', () => leaveCall());

        return () => {
            socket.off('callAccepted');
            socket.off('iceCandidate');
            socket.off('callEnded');
        };
    }, [socket]);

    // 4. Call Actions
    const callUser = useCallback(async (localStream) => {
        const pc = createPeerConnection(localStream);
        peerConnection.current = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('callUser', {
            userToCall: remoteId,
            signalData: { description: offer },
            from: callerId,
            type: type
        });
    }, [createPeerConnection, callerId, remoteId, socket, type]);

    const answerCall = async () => {
        if (!stream) return;
        setCallAccepted(true);
        const pc = createPeerConnection(stream);
        peerConnection.current = pc;

        if (incomingSignal?.description) {
            await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.description));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answerCall', {
                signal: { description: answer },
                to: remoteId
            });
        }
    };

    // Auto-initiate call for the caller
    useEffect(() => {
        if (!isReceiving && stream && !peerConnection.current) {
            callUser(stream);
        }
    }, [isReceiving, stream, callUser]);

    const leaveCall = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        socket.emit('endCall', { to: remoteId });
        onEndCall();
    };

    return (
        <div className="VideoCallOverlay">
            <div className="VideoCallContainer">
                <h2>{isReceiving && !callAccepted ? `Incoming ${type} call...` : `Ongoing ${type} call...`}</h2>

                <div className="VideoStreams">
                    <div className="LocalStream window">
                        <video playsInline muted ref={myVideo} autoPlay />
                    </div>
                    {callAccepted && (
                        <div className="RemoteStream window">
                            <video playsInline ref={userVideo} autoPlay />
                        </div>
                    )}
                </div>

                <div className="CallControls">
                    {isReceiving && !callAccepted ? (
                        <>
                            <button className="accept-btn" onClick={answerCall}>Answer</button>
                            <button className="decline-btn" onClick={leaveCall}>Decline</button>
                        </>
                    ) : (
                        <button className="end-btn" onClick={leaveCall}>
                            <CallEndIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoCall;