import { AGORA_APP_ID } from "./env.js";
import {addBotMessageToDom, addMessageToDom, handleMemberJoined, handleMemberLeft} from "./room_rtm.js"

let uid = sessionStorage.getItem("uid");
if(!uid){
    uid = String(Math.floor(Math.random()*10000))
    sessionStorage.setItem("uid", uid);
}

let token = null;
let client;

//RTM Configuration

let rtmClient;
let channel;

// Get the roomId;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

let displayName = sessionStorage.getItem("display_name");
if(!displayName){
    window.location = `lobby.html`;
}

if(!roomId){
    roomId = "main";
}

let localTracks = [];
let remoteUsers = {};
let localScreenTracks;
let screenShared = false;

let joinRoomInit = async() => {
    rtmClient = await AgoraRTM.createInstance(AGORA_APP_ID);
    await rtmClient.login({uid, token});
    
    await rtmClient.addOrUpdateLocalUserAttributes({"name" : displayName});
    
    channel = await rtmClient.createChannel(roomId);
    await channel.join();
    
    channel.on('MemberJoined', handleMemberJoined);
    channel.on('MemberLeft', handleMemberLeft);
    channel.on("ChannelMessage", handleChannelMessage);
    
    getMembers();
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`);



    client = AgoraRTC.createClient({"mode" : "rtc", "codec" : "vp8"});
    await client.join(AGORA_APP_ID, roomId, token, uid);

    client.on("user-published", handleUserPublished);

    client.on("user-left", handleUserLeft);
}

let handleChannelMessage = async(messageData, MemberId) => {
    let data = JSON.parse(messageData.text);
    if(data.type==='chat'){
        addMessageToDom(data.displayName, data.message);
    }

    if(data.type==='user_left'){
        document.getElementById(`user-container-${data.uid}`).remove();

        if(userIdInDisplayFrame === `user-container-${user.uid}`){
            displayFrame.style.display = null;
    
            let videoFrames = document.getElementsByClassName(`video-container`);
    
            for(let i=0; i<videoFrames.length; i++){
                videoFrames[i].style.width = `300px`;
                videoFrames[i].style.height = `300px`;
            }
        }
        
    }
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
    document.getElementById("join-btn").style.display = "none";
    document.getElementsByClassName("stream__actions")[0].style.display = "flex";

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
    let item = document.getElementById(`user-container-${user.uid}`);
    if(item){
        item.remove();
    }
    
}

let hideDisplayFrame = () => {
    userIdInDisplayFrame = null;
    displayFrame.style.display = null;

    let child = displayFrame.children[0];
    document.getElementById(`streams-container`).appendChild(child);
    for(let i=0; i<videoFrames.length; i++){
        videoFrames[i].style.height = `300px`;
        videoFrames[i].style.width= `300px`;
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

let switchToCamera = async () => {
    let player = `<div class="video-container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
    document.getElementById('streams-container').insertAdjacentHTML('beforeend', player);

    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);
    
    document.getElementById('mic-btn').classList.remove('active');
    document.getElementById('stream-btn').classList.remove('active');

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[1]]);
    let currentVideoPlayer = document.getElementById(`user-container-${uid}`);
    currentVideoPlayer.style.width = `100px`;
    currentVideoPlayer.style.height = `100px`;
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget;
    let cameraButton = document.getElementById("camera-btn");
    if(!screenShared){
        screenShared =true;
        screenButton.classList.add('active');
        cameraButton.classList.remove('active');
        cameraButton.style.display = 'none';

        localScreenTracks = await AgoraRTC.createScreenVideoTrack();

        document.getElementById(`user-container-${uid}`).remove();
        displayFrame.style.display = 'block';

        let player = `<div class="video-container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                    </div>`;

        displayFrame.insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);
        userIdInDisplayFrame = `user-container-${uid}`;
        localScreenTracks.play(`user-${uid}`);
        await client.unpublish([localTracks[1]]);
        await client.publish([localScreenTracks]);
        let videoFrames = document.getElementsByClassName(`video-container`);
        for(let i=0; i<videoFrames.length; i++){
            videoFrames[i].style.height = `300px`;
            videoFrames[i].style.width= `300px`;
        }
    }
    else{
        screenShared = false;
        cameraButton.style.display = 'block';
        document.getElementById(`user-container-${uid}`).remove();
        await client.unpublish([localScreenTracks]);
        switchToCamera();
    }
}

let leaveChannel = async() => {
    await channel.leave();
    await rtmClient.logout();
}

export const updateMemberCount = async() => {
    let members = await channel.getMembers();

    let count = document.getElementById("members__count");
    count.innerHTML = members.length;
}

let getMembers = async() => {
    let members = await channel.getMembers();
    updateMemberCount();
    for(let i=0; i<members.length; i++){
        handleMemberJoined(members[i]);
    }
}

export const getDisplayNameOfUserByMemberId = async (MemberId) => {
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
    return name;
}

let sendMessage = async(e) => {
    e.preventDefault();
    let message = e.target.message.value;
    await channel.sendMessage({text : JSON.stringify({'type' : 'chat', 'message' : message, 'displayName' : displayName})});
    e.target.reset();
    addMessageToDom(displayName, message);
}

let leaveStream = async (e) => {
    e.preventDefault();
    document.getElementById("join-btn").style.display = "block";
    document.getElementsByClassName("stream__actions")[0].style.display = "none";

    for(let i=0; i<localTracks.length; i++){
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.unpublish([localTracks[0], localTracks[1]]);
    if(localScreenTracks){
        await client.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();

    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = "none";
        for(let i=0; i<videoFrames.length; i++){
            videoFrames[i].style.width = "300px";
            videoFrames[i].style.height = "300px";
        }
    }

    channel.sendMessage({text : JSON.stringify({'type' : 'user_left', 'uid' : uid})});
}

window.addEventListener('beforeunload', leaveChannel);

document.getElementById('camera-btn').addEventListener("click", toggleControls);
document.getElementById('mic-btn').addEventListener("click", toggleControls);
document.getElementById('stream-btn').addEventListener("click", toggleScreen);
document.getElementById('join-btn').addEventListener("click", joinStream);
document.getElementById('leave-btn').addEventListener("click", leaveStream);
joinRoomInit();

let messageForm = document.getElementById('message__form');
messageForm.addEventListener("submit", sendMessage);