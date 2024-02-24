import { AGORA_APP_ID } from "./env.js";

let uid = sessionStorage.getItem("uid");
if(!uid){
    uid = String(Math.floor(Math.random()*10000))
    sessionStorage.setItem("uid", uid);
}

let token = null;
let client;

// Get the roomId;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("roomId");

if(!roomId){
    roomId = "main";
}

let localTracks = [];
let remoteUsers = {};

let joinRoomInit = async() => {
    client = AgoraRTC.createClient({"mode" : "rtc", "codec" : "vp8"});
    await client.join(AGORA_APP_ID, roomId, token, uid);

    client.on("user-published", handleUserPublished);

    client.on("user-left", handleUserLeft);

    joinStream();
}




let displayFrame = document.getElementById("stream-box");
let videoFrames = document.getElementsByClassName("video-container");
let userIdInDisplayFrame = null;
let expandVideoFrame = (e) => {
    let child = displayFrame.children[0];
  
    if(child){
      document.getElementById("streams-container").appendChild(child);
    }
  
    displayFrame.style.display = 'block';
    displayFrame.appendChild(e.currentTarget);
    userIdInDisplayFrame = e.currentTarget.id;
  
    for(let i=0; i<videoFrames.length; i++){
      if(videoFrames[i].id !== userIdInDisplayFrame){
        videoFrames[i].style.height = '100px';
        videoFrames[i].style.width = '100px';
      }
    }
  }

let joinStream = async() => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig : {
        width : {min : 640, ideal : 1920, max : 1920},
        height : {min : 480, ideal : 1080, max : 1080}
    }
    });
    let player = `<div class="video-container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;

    document.getElementById("streams-container").insertAdjacentHTML('beforeend', player);

    localTracks[1].play(`user-${uid}`);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserPublished = async(user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);

    if(player === null){
        player = `<div class="video-container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>`;

        document.getElementById("streams-container").insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }


    if(displayFrame.style.display){
        let currentVideoPlayer = document.getElementById(`user-container-${user.uid}`);
        currentVideoPlayer.style.height = '100px';
        currentVideoPlayer.style.width = '100px';
    }

    

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`);
    }

    if(mediaType === 'audio'){
        user.audioTrack.play();
    }
}

let handleUserLeft = async(user) => {

    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null;

        let videoFrames = document.getElementsByClassName(`video-container`);

        for(let i=0; i<videoFrames.length; i++){
            videoFrames[i].style.width = `300px`;
            videoFrames[i].style.height = `300px`;
        }
    }
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
}

let hideDisplayFrame = () => {
    userIdInDisplayFrame = null;
    displayFrame.style.display = null;

    let child = displayFrame.children[0];
    document.getElementById(`streams-container`).appendChild(child);

    for(let i=0; i<videoFrames.length; i++){
        videoFrames[i].display.height = `300px`;
        videoFrames[i].display.width= `300px`;
    }
}

displayFrame.addEventListener('click', hideDisplayFrame);

let toggleControls = async(e) => {
    let cameraCtrl = false;
    let button = e.currentTarget;
    if(button.id === 'camera-btn'){
        cameraCtrl = true;
    }
    if(localTracks[cameraCtrl ? 1 : 0].muted){
        localTracks[cameraCtrl ? 1 : 0].setMuted(false);
        button.classList.add('active');
    }
    else{
        localTracks[cameraCtrl ? 1 : 0].setMuted(true);
        button.classList.remove('active');
    }
}

document.getElementById('camera-btn').addEventListener("click", toggleControls);
document.getElementById('mic-btn').addEventListener("click", toggleControls);
joinRoomInit();