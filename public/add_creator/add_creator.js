let Data;
let Result;
document.addEventListener('DOMContentLoaded', function(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const decodedValue = decodeURIComponent(urlParams.get("influencer_id"));


    const channel_name_input = document.getElementById('channel_name_input');
    const channel_description_input = document.getElementById('channel_description_input');
    const channel_link_input = document.getElementById('channel_link_input');
    const channel_ID_input = document.getElementById('channel_ID_input');

    const saveButton = document.getElementById('saveButton');
    if(decodedValue){
        fetch('/channel-info?channelID='+urlParams.get("influencer_id"))
        .then(response => response.json())
        .then(data=>{
            console.log(data);
            Data = data;
            channel_name_input.value = Data.channelData.snippet.title;
            channel_description_input.value = Data.channelData.brandingSettings.channel.description;
            channel_link_input.value = "https://www.youtube.com/channel/"+Data.channelData.id;
            channel_ID_input.value = Data.channelData.id;
            const profile_img = document.createElement('img');
            profile_img.src = Data.channelData.snippet.thumbnails.default.url;
            document.getElementById('profilePicDiv').appendChild(profile_img);

            const banner_img = document.createElement('img');
            banner_img.src = Data.channelData.brandingSettings.image.bannerExternalUrl;
            document.getElementById('bannerPicDiv').appendChild(banner_img);
        })
        .catch(err=>{
            console.error(err);
        })
        console.log(decodedValue);
    }

    saveButton.addEventListener('click',checkValues);
});

function checkValues(){
    const channel_name = document.getElementById('channel_name_input').value;
    const channel_description = document.getElementById('channel_description_input').value;
    const channel_link = document.getElementById('channel_link_input').value;
    const channel_ID = document.getElementById('channel_ID_input').value;
    const pfp_url = document.getElementById('profilePicDiv').children[0].src;
    const banner_url = document.getElementById('bannerPicDiv').children[0].src;
    const instagram = document.getElementById('instagram_input').value;
    const email = document.getElementById('email_input').value;

    const linkInputs = document.getElementsByClassName('link_input_div');
    let links = [];
    for(i in Array.from(linkInputs)){
        const type = linkInputs[i].children[0].value;
        const link = linkInputs[i].children[1].value;
        links.push({type,link});
    }

    const result = {
        [channel_name]: {
            "channel_description": channel_description,
            "channel_link": channel_link,
            "channel_ID": channel_ID,
            "pfp_url": pfp_url,
            "banner_url": banner_url,
            "email": email,
            "instagram": instagram,
            "links": links
        }
    };
    Result = result;
    console.log(result);
    fetch(`/save-influencer?channel_name=${encodeURIComponent(channel_name)}`,{
        method:'POST',
        headers:{
            'Content-Type':'application/json',
        },
        body:JSON.stringify(result)
    })
        .then(response=>{
            if(!response.ok){
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(data=>{
            console.log(data);
        })
        .catch(error=>{
            console.error(error);
        });


}