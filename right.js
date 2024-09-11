
// Import and export
import * as left from './left.js';
export { channel };


// Global variables
let stream; // Media streem
let peer;   // Rtc peer connection
let icelist = []; // Hold ice util remote description is ready

// When html document is ready
window.addEventListener('load', init);


// Initialize 
async function init() {

    // Add button click event
    let rightButton = document.getElementById("rightButton");
    rightButton.addEventListener('click', rightButtonClick);

    // Create rtc peer connection
    createPeer();

}


// Button click
async function rightButtonClick() {

        // Get media for the first time
        if (!stream) {
            await getMedia();   // Get user media
            addMedia();         // Add media to peer    
        }

        // Request offer from other peer
        left.channel('requestOffer', {});

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
        console.log("right getMedia: ", stream2);

        // Save the stream in global variable
        stream = stream2;

        // Add the stream to local html video element
        // let rightVideo = document.getElementById('rightVideo');
        // rightVideo.srcObject = stream;

    } catch (err) {
        console.error("right getMedia: ", err);
    }

}


// Add media stream to peer
function addMedia() {
    try {

        console.log("right addMedia");

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
        console.error("right getMedia: ", err);
    }


}


// ------------------------------------------------------
// Peer events


// Peer connectionstatechange event
function connectionstatechange(event) {
    try {
        // console.log("right connectionstatechange: ", event);
        console.log("right connectionstatechange: ", peer.connectionState);

    } catch (err) {
        console.error("right connectionstatechange: ", err);
    }
}


// Peer icecandidate event
// This has to be sent to the other peer
function icecandidate(event) {
    try {
        if (event.candidate) {
            console.log("right icecandidate: ", event);

            // Send ice candidate to the other peer
            left.channel('receiveIce', event.candidate);
        }

    } catch (err) {
        console.error("right icecandidate: ", err);
    }
}


// Peer track event
// Remote stream has been received
function track(event) {
    try {

        console.log("right track: ", event);

        // Add the remote peer stream to local html video
        let rightVideo = document.getElementById('rightVideo');
        rightVideo.srcObject = event.streams[0];

    } catch (err) {
        console.error("right track: ", err);
    }
}


// ------------------------------------------------------
// Peer functions

// Create rtc peer connection
function createPeer() {
    try {

        // Ice servers
        const options = {
            'icelistervers': [
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

        console.log("right createPeer: ", peer);

    } catch (err) {
        console.error("right createPeer: ", err);
    }

}


// Receive rtc offer from the other peer
async function receiveOffer(offer) {
    try {

        // Get media for the first time
        if(!stream){
            await getMedia();   // Get user media
            addMedia();         // Add media to peer    
        }

        // let sessionDes = new RTCSessionDescription(offer);
        await peer.setRemoteDescription(offer);
        while(icelist.lenght){
            await peer.addIceCandidate(icelist.shift());

        }

        // Create answer
        const answer = await peer.createAnswer(offer);
        await peer.setLocalDescription(answer);
        console.log("right receiveOffer: ", answer);

        // Send answer to the other peer
        left.channel('receiveAnswer', answer);

    } catch (err) {
        console.error("left receiveOffer: ", err);
    }
}


// Receive ice candidate from the other peer
async function receiveIce(ice) {
    try {
        console.log("right receiveIce: ", ice);

        // If remote description is not ready save the ice
        // 
        if(!peer.remoteDescription){
            icelist.push(ice);
            return;
        }

        // let candidate = new RTCIceCandidate(ice);
        await peer.addIceCandidate(ice);

    } catch (err) {
        console.error("right receiveIce: ", err);
    }

}


// ------------------------------------------------------
// Channel between peers


async function channel(message, data = {}){
    try {
        console.log("right channel: ", message);

        if(message == 'receiveOffer'){
            await receiveOffer(data);
        } else if(message == 'receiveIce'){
            await receiveIce(data);
        }

    } catch (err) {
        console.error("right channel: ", err);
    }
}
