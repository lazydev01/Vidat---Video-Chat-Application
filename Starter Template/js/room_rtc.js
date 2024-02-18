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

let joinStream = async() => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    let player = `<div class="video-container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;

    document.getElementById("streams-container").insertAdjacentHTML('beforeend', player);

    localTracks[1].play(`user-${uid}`);

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