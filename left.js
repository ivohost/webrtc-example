
// Import and export
import * as right from './right.js';
export { channel };


// Global variables
let stream; // Media streem
let peer;   // Rtc peer connection


// When html document is ready
window.addEventListener('load', init);


// Initialize 
async function init() {

    // Add button click event
    let leftButton = document.getElementById("leftButton");
    leftButton.addEventListener('click', leftButtonClick);

    // Create rtc peer connection
    createPeer();

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

        // Get the media stream
        const options = { video: true, audio: false };
        const stream2 = await navigator.mediaDevices.getUserMedia(options);

        // Print the stream
        console.log("left getMedia: ", stream2);

        // Save the stream in global variable
        stream = stream2;

        // Add the stream to local html video element
        // let leftVideo = document.getElementById('leftVideo');
        // leftVideo.srcObject = stream;

    } catch (err) {
        console.error("left getMedia: ", err);
    }

}


// Add media stream to peer
function addMedia() {
    try {

        console.log("left addMedia");

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
        console.error("left getMedia: ", err);
    }


}


// ------------------------------------------------------
// Peer events


// Peer connectionstatechange event
function connectionstatechange(event) {
    try {
        // console.log("left connectionstatechange: ", event);
        console.log("left connectionstatechange: ", peer.connectionState);

    } catch (err) {
        console.error("left connectionstatechange: ", err);
    }
}


// Peer icecandidate event
// This has to be sent to the other peer
function icecandidate(event) {
    try {
        if (event.candidate) {
            console.log("left icecandidate: ", event);

            // Send ice candidate to the other peer
            right.channel('receiveIce', event.candidate);
        }

    } catch (err) {
        console.error("left icecandidate: ", err);
    }
}


// Peer track event
// Remote stream has been received
function track(event) {
    try {

        console.log("left track: ", event);

        // Add the remote peer stream to local html video
        let leftVideo = document.getElementById('leftVideo');
        leftVideo.srcObject = event.streams[0];

    } catch (err) {
        console.error("left track: ", err);
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
        peer.addEventListener('connectionstatechange', connectionstatechange);
        peer.addEventListener('icecandidate', icecandidate);
        peer.addEventListener('track', track);

        console.log("left createPeer: ", peer);

    } catch (err) {
        console.error("left createPeer: ", err);
    }

}


// Do not send other offer while negotiating
let sending = false;

// Send rtc offer to the other peer
async function sendOffer() {
    try {

        // Do not send other offer while negotiating
        if (sending) { return; }
        sending = true;
        setTimeout(() => sending = false, 3000);

        // Create offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        console.log("left sendOffer: ", offer);

        // Send offer to the other peer
        right.channel('receiveOffer', offer);

    } catch (err) {
        console.error("left sendOffer: ", err);
    }

}


// Receive request for rtc offer
async function requestOffer() {
    leftButtonClick();

}


// Receive rtc answer from the other peer
async function receiveAnswer(answer) {
    try {
        console.log("left receiveAnswer: ", answer);

        // const remoteDes = new RTCSessionDescription(answer);
        await peer.setRemoteDescription(answer);

    } catch (err) {
        console.error("left receiveAnswer: ", err);
    }

}


// Receive ice candidate from the other peer
async function receiveIce(ice) {
    try {
        console.log("left receiveIce: ", ice);

        // let candidate = new RTCIceCandidate(ice);
        await peer.addIceCandidate(ice);

    } catch (err) {
        console.error("left receiveIce: ", err);
    }

}


// ------------------------------------------------------
// Channel between peers


async function channel(message, data = {}){
    try {
        console.log("left channel: ", message);

        if(message == 'requestOffer'){
            requestOffer();
        } else if(message == 'receiveAnswer'){
            await receiveAnswer(data);
        } else if(message == 'receiveIce'){
            await receiveIce(data);
        }

    } catch (err) {
        console.error("left channel: ", err);
    }
}
