import {getDisplayNameOfUserByMemberId, updateMemberCount} from './room_rtc.js';

let handleMemberJoined = async(MemberId) => {
    addMemberToDom(MemberId);
    updateMemberCount();
    let currentMemberId = sessionStorage.getItem("uid");
    if(currentMemberId !== MemberId){
        let name = await getDisplayNameOfUserByMemberId(MemberId);
        addBotMessageToDom(`${name} has joined the room!`);
    }
}

let addMemberToDom = async(MemberId) => {
    let memberWrapper = document.getElementById(`member__list`);
    let name = await getDisplayNameOfUserByMemberId(MemberId);
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`;
    memberWrapper.insertAdjacentHTML('beforeend', memberItem);
}

let addMessageToDom = async(name, message) => {
    let messageWrapper = document.getElementById("messages");
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`;
    messageWrapper.insertAdjacentHTML('beforeend', newMessage);

    let lastMessage = document.querySelector("#messages .message__wrapper:last-child");
    if(lastMessage){
        lastMessage.scrollIntoView();
    }
}

let addBotMessageToDom = async(botMessage) => {
    let messageWrapper = document.getElementById("messages");
    let botMessageDiv = `<div class="message__wrapper">
                            <div class="message__body__bot">
                                <strong class="message__author__bot">🤖 Vidat Bot</strong>
                                <p class="message__text__bot">${botMessage}</p>
                            </div>
                        </div>`;
    messageWrapper.insertAdjacentHTML('beforeend', botMessageDiv);
    let lastMessage = document.querySelector("#messages .message__wrapper:last-child");
    if(lastMessage){
        lastMessage.scrollIntoView();
    }
}



let handleMemberLeft = async(MemberId) => {
    console.log(MemberId)
    removeMemberFromDom(MemberId);
    updateMemberCount();
    
}

let removeMemberFromDom = async(MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
    let name = memberWrapper.getElementsByClassName("member_name")[0].textContent;
    addBotMessageToDom(`${name} left the room!`)
    memberWrapper.remove();
}

export {handleMemberJoined, handleMemberLeft, addMessageToDom, addBotMessageToDom};