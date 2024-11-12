
// Import and export
import * as right from './right.js';
export { channel };


// Global variables
let stream; // Media streem
let peer;   // Rtc peer connection
let icelist = []; // Hold ice util remote description is ready


// When html document is ready
window.addEventListener('load', documentLoad);


// Initialize 
async function documentLoad() {

    // Events
    let permButton = document.getElementById("permButton");
    let leftButton = document.getElementById("leftButton");

    permButton.addEventListener('click', getPermissions);
    leftButton.addEventListener('click', leftButtonClick);

    // Check browser media permissions
    checkPermissions()

    // Create rtc peer connection
    createPeer();

}


// Check browser media permissions
async function checkPermissions() {

    const cam = await navigator.permissions.query({ name: 'camera' });

    // If permissions are enabled, enable left and right button
    if (cam.state == 'granted') {
        document.getElementById("permButton").disabled = true;
        document.getElementById("leftButton").disabled = false;
        document.getElementById("rightButton").disabled = false;

    }

}


// Get media permissions
async function getPermissions() {
    try {

        let conf = { video: true, audio: false };
        let stream = await navigator.mediaDevices.getUserMedia(conf);

        stream.getTracks().forEach(function (track) {
            track.stop();
        });

        stream = null;
        location.reload();
        return Promise.resolve(true);

    } catch (err) {
        console.error('Error media permissions.', err.message);
        return Promise.resolve(false);

    }

}


// Button click
async function leftButtonClick() {

    // Get media for the first time
    if (!stream) {
        await getMedia();   // Get user media
        addMedia();         // Add media to peer    
    }

    await sendOffer();  // Send offer to other peer

}


// ------------------------------------------------------
// Media, video, audio,


// Get user media, audio, video
async function getMedia() {
    try {

        // Release the media
        if (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });

        }

        // Get the media stream
        const options = { video: true, audio: false };
        const stream2 = await navigator.mediaDevices.getUserMedia(options);

        // Print the stream
        console.log("getMedia: ", stream2);

        // Save the stream in global variable
        stream = stream2;

        // Add the stream to local html video element
        // let leftVideo = document.getElementById('leftVideo');
        // leftVideo.srcObject = stream;

    } catch (err) {
        console.error("getMedia: ", err);
    }

}


// Add media stream to peer
function addMedia() {
    try {

        console.log("addMedia");

        // Remove old media tracks from peer
        const senders = peer.getSenders();
        senders.forEach((track) => {
            peer.removeTrack(track)
        });

        // Add media tracks to peer
        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });

    } catch (err) {
        console.error("getMedia: ", err);
    }


}


// ------------------------------------------------------
// Peer events


// Peer peerState event
function peerState(event) {
    try {
        // console.log("peerState: ", event);
        console.log("peerState: ", peer.connectionState);

    } catch (err) {
        console.error("peerState: ", err);
    }
}


// Peer peerIce event
// This has to be sent to the other peer
function peerIce(event) {
    try {
        if (event.candidate) {
            console.log("peerIce: ", event);

            // Send ice candidate to the other peer
            right.channel('receiveIce', event.candidate);
        }

    } catch (err) {
        console.error("peerIce: ", err);
    }
}


// Peer track event
// Remote stream has been received
function peerTrack(event) {
    try {

        console.log("peerTrack: ", event);

        // Add the remote stream to local video
        let leftVideo = document.getElementById('leftVideo');
        leftVideo.srcObject = event.streams[0];

    } catch (err) {
        console.error("peerTrack: ", err);
    }
}


// ------------------------------------------------------
// Peer functions

// Create rtc peer connection
function createPeer() {
    try {

        // Ice servers
        const options = {
            'iceServers': [
                { "urls": "stun:stun1.l.google.com:19302" },
                { "urls": "stun:stun2.l.google.com:19302" }
            ]
        };

        // Create peer
        peer = new RTCPeerConnection(options);

        // Add event listeners
        peer.addEventListener('connectionstatechange', peerState);
        peer.addEventListener('icecandidate', peerIce);
        peer.addEventListener('track', peerTrack);

        console.log("createPeer: ", peer);

    } catch (err) {
        console.error("createPeer: ", err);
    }

}


// Send rtc offer to the other peer
async function sendOffer() {
    try {

        // Create offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        console.log("sendOffer: ", offer);

        // Send offer to the other peer
        right.channel('receiveOffer', offer);


    } catch (err) {
        console.error("sendOffer: ", err);
    }

}


// Receive rtc offer from the other peer
async function receiveOffer(offer) {
    try {

        console.log("receiveOffer: ", offer);

        // Get media for the first time
        if (!stream) {
            await getMedia();   // Get user media
            addMedia();         // Add media to peer    
        }

        // 
        await peer.setRemoteDescription(offer);
        while(icelist.lenght){
            await peer.addIceCandidate(icelist.shift());
        }

        // Create answer
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        // Send answer to the other peer
        right.channel('receiveAnswer', answer);

    } catch (err) {
        console.error("receiveOffer: ", err);
    }
}



// Receive rtc answer from the other peer
async function receiveAnswer(answer) {
    try {
        console.log("receiveAnswer: ", answer);

        // const remoteDes = new RTCSessionDescription(answer);
        await peer.setRemoteDescription(answer);

    } catch (err) {
        console.error("receiveAnswer: ", err);
    }

}


// Receive ice candidate from the other peer
async function receiveIce(ice) {
    try {
        console.log("receiveIce: ", ice);

        // If remote description is not ready save the ice
        if(!peer.remoteDescription){
            icelist.push(ice);
            return;
        }

        // let candidate = new RTCpeerIce(ice);
        await peer.addIceCandidate(ice);

    } catch (err) {
        console.error("receiveIce: ", err);
    }

}


// ------------------------------------------------------
// Channel between peers


async function channel(message, data = {}) {
    try {
        console.log("channel: ", message);

        if (message == 'receiveOffer') {
            await receiveOffer(data);
        } else if (message == 'receiveAnswer') {
            await receiveAnswer(data);
        } else if (message == 'receiveIce') {
            await receiveIce(data);
        }

    } catch (err) {
        console.error("channel: ", err);
    }
}
