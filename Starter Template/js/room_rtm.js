import {getDisplayNameOfUserByMemberId, updateMemberCount} from './room_rtc.js';

let handleMemberJoined = async(MemberId) => {
    console.log("A new member joined : ", MemberId);
    addMemberToDom(MemberId);
    updateMemberCount();
}

let addMemberToDom = async(MemberId) => {
    let memberWrapper = document.getElementById(`member__list`);
    let name = await getDisplayNameOfUserByMemberId(MemberId);
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}"__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`;
    memberWrapper.insertAdjacentHTML('beforeend', memberItem);
}


let handleMemberLeft = async(MemberId) => {
    removeMemberFromDom(MemberId);
    updateMemberCount();
}

let removeMemberFromDom = async(MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
    memberWrapper.remove();
}

export {handleMemberJoined, handleMemberLeft};