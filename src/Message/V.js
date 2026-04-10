import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const VideoCall = () => {
  const [message, setMessage] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomId = 'room1';

  // WebRTC configuration
  const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    // Connect to the Socket.IO server
    socketRef.current = io('http://localhost:8080');

    // Join the room
    socketRef.current.emit('join-room', roomId);

    // Handle signaling messages
    socketRef.current.on('signal', async ({ from, data }) => {
      if (data.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketRef.current.emit('signal', {
          to: from,
          from: socketRef.current.id,
          data: peerConnection.localDescription,
        });
      }

      if (data.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      }

      if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    // Cleanup when component unmounts
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const startCall = async () => {
    // Get local media stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;

    // Create the RTCPeerConnection
    const pc = new RTCPeerConnection(config);
    setPeerConnection(pc);

    // Add local tracks to the peer connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle remote stream
    pc.ontrack = (event) => {
      if (!remoteStream) {
        setRemoteStream(new MediaStream());
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteStream.addTrack(event.track);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', {
          to: roomId,
          from: socketRef.current.id,
          data: { candidate: event.candidate },
        });
      }
    };

    // Create an offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send the offer to the remote peer
    socketRef.current.emit('signal', {
      to: roomId,
      from: socketRef.current.id,
      data: pc.localDescription,
    });
  };

  return (
    <div>
      <div>
        <video ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: '300px' }} />
      </div>
      <button onClick={startCall}>Start Call</button>
    </div>
  );
};

export default VideoCall;
