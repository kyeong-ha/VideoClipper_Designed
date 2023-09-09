let Data;
let influencerData;
let influencer_registered = false;
function setup(){
    influencerData = loadJSON('influencers.json');
    console.log(influencerData);
}

document.addEventListener('DOMContentLoaded', function(){
    //const videoForm = document.getElementById('videoForm');

    const submitVideoButton = document.getElementById('submitVideoButton');
    const linkInput = document.getElementById('linkInput');
    const creatorInput = document.getElementById('creatorInput');
    const videoNameInput = document.getElementById('videoNameInput');
    const automizeButton = document.getElementById('linkAutomizeButton');
    const creatorButton = document.getElementById('creatorButton');
    function Submitted(event){
        event.preventDefault();

        const link = linkInput.value;
        const influencer = creatorInput.value;
        const videoName = videoNameInput.value;

        if(creatorButton.textContent==="✔"){
            window.location.href = `video_trimmer/video.html?videoUrl=${encodeURIComponent(link)}&influencer=${encodeURIComponent(influencer)}&videoName=${encodeURIComponent(videoName)}`;
        }
        console.log('Link:', link);
        console.log('Influencer:', influencer);
        console.log('Video Name:', videoName);

    }

    function toggleAutomizeButton() {
        if (linkInput.value.trim() !== '') {
            automizeButton.style.display = 'block';
        } else {
            automizeButton.style.display = 'none';
        }
    }
    function addInfluencer(){
        event.preventDefault();
        const valueToSend = Data.info.videoDetails.author.id;
        const encodedValue = encodeURIComponent(valueToSend);
        window.location.href = `add_creator/add_creator.html?influencer_id=${encodedValue}`;
        console.log('add Influencer');
    }

    function toggleCreatorButton(){
        if(creatorInput.value.trim()!==''){
            if(creatorInput.value in influencerData){
                creatorButton.textContent = "✔";
                influencer_registered = true;
            }
            else{
                creatorButton.textContent = "+";
                influencer_registered = false;
            }
            creatorButton.style.display='block';
        }else{
            automizeButton.style.display='none';
        }
    }
    function Ytdl_info_get(){
        const link = linkInput.value;
        event.preventDefault();
        fetch('/ytdl-info'+'?videoUrl='+encodeURIComponent(link))
            .then(response => response.json())
            .then(data => {
                console.log(data);
                Data = data;
                creatorInput.value = Data.info.videoDetails.author.name;
                videoNameInput.value = Data.info.videoDetails.title;
                toggleCreatorButton();
            })
            .catch(error=>{
                console.error(error);
            });
    }

    linkInput.addEventListener('input', toggleAutomizeButton);

    creatorInput.addEventListener('input',toggleCreatorButton);

    submitVideoButton.addEventListener('click', Submitted);

    automizeButton.addEventListener('click',Ytdl_info_get);

    creatorButton.addEventListener('click',addInfluencer);
});