import { AGORA_APP_ID } from "./env.js";

let uid = sessionStorage.getItem("uid");
if(!uid){
    let uid = String(Math.floor(Math.random()*10000))
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
  
    console.log(videoFrames);
  
    for(let i=0; i<videoFrames.length; i++){
      if(videoFrames[i].id !== userIdInDisplayFrame){
        videoFrames[i].style.height = '100px';
        videoFrames[i].style.width = '100px';
      }
    }
  }

let joinStream = async() => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    let player = `<div class="video-container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;

    document.getElementById("streams-container").insertAdjacentHTML('beforeend', player);

    localTracks[1].play(`user-${uid}`);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserPublished = async(user, mediaType) => {
    console.log("new user published");
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

    

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`);
    }

    if(mediaType === 'audio'){
        user.audioTrack.play();
    }
}

let handleUserLeft = async(user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
}

joinRoomInit();