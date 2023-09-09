const express = require('express');
const port = 3003;
const ytdl = require('ytdl-core');
const { google } = require('googleapis');

const ffmpeg = require('fluent-ffmpeg');

const {uploadGIF, uploadJSON} = require('./s3');
const Video = require('@google-cloud/video-intelligence');
const fs = require('fs');
require('dotenv').config();
const apikey = process.env.GOOGLE_API_KEY;
const youtube = google.youtube({
    version: 'v3',
    auth: apikey, // Replace with your API key or use OAuth 2.0 for authentication
  });

const app = express();

app.use(express.json());

app.use(express.static('public'));
app.listen(port,()=>{
    console.log('server running on http://localhost:'+port);
})

app.get('/ytdl-info',async(req,res)=>{
    const videoUrl = decodeURIComponent(req.query.videoUrl);
    const info  = await ytdl.getInfo(videoUrl);
    res.send({info});
})

app.post('/save-influencer',async(req,res)=>{
    const data = req.body;
    const channel_name = decodeURIComponent(req.query.channel_name);
    console.log(data,channel_name);
    console.log(data[channel_name]);
    let existingData = {};
    try {
        existingData = JSON.parse(fs.readFileSync('public/influencers.json', 'utf8'));
    } catch(error){
        console.error(error);
    }
    existingData[channel_name] = data[channel_name];
    fs.writeFileSync('public/influencers.json', JSON.stringify(existingData, null, 2), 'utf8');
    res.send({message: 'successful'});
})

app.get('/video-intelligence',async(req,res)=>{
    const url = decodeURIComponent(req.query.videoUrl);
    const directory = req.query.name;

    const fileName = await downloadVideo(url,directory);

    const response = analyzeLocalVideo('test.mp4');
    res.send(response);
});

app.get('/gif',async (req,res)=>{
    const startTime = req.query.startTime;
    const endTime = req.query.endTime;
    const videoPath = req.query.videoSrc;
    const videoUrl =  'https://taewons3.s3.ap-northeast-2.amazonaws.com/'+videoPath;
    const name = decodeURIComponent(req.query.name);
    console.log(videoUrl,startTime,endTime);
    const response = await createShortVideo(videoUrl, startTime, endTime, name);
    res.send({response});
  });

async function downloadVideo(url,directory){
    let format;
    let info = await ytdl.getInfo(url);
    try{
      format = ytdl.chooseFormat(info.formats, { quality: '137' });
    }catch(error){
      try{
        format = ytdl.chooseFormat(info.formats, { quality: '136' });
      }catch(error){
        console.error('Desired formats (1080p and 720p) are unavailable for this video.');
        return 'error occured finding video format';
      }
    }
    console.log('Video Format Found!');

    await ytdl(url).pipe(fs.createWriteStream('test'+'.mp4'));
    return directory+'.mp4';
}   
app.get('/channel-info',async(req,res)=>{
    const channelId = decodeURIComponent(req.query.channelID);
    
    try{
        const response = await youtube.channels.list({
            part: 'snippet,statistics,contentDetails,brandingSettings',
            id: channelId,
          });
      
          const channelData = response.data.items[0];
          if (channelData) {
                console.log(channelData);
                res.send({channelData});
          } else {
            throw new Error('Channel not found');
          }
    }catch(err){
        console.error(err);
        res.send(err);
    }
})



const mp4OutputFilePath = 'result1.mp4';
async function createShortVideo(src, startTime, endTime, key) {
    try{
    await new Promise((resolve, reject) => {
      ffmpeg(src)
        .inputOptions([
          '-ss', startTime, // Start time in seconds  
          '-t', endTime - startTime, // Duration in seconds
        ])
        .output(mp4OutputFilePath)
        .format('mp4')
        .on('end', () => {
          console.log('GIF creation completed.');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error creating GIF:', err);
          reject(err);
        })
        .on('stderr', (stderrLine) => console.log(stderrLine))
        .run();
    });
    const mp4File = fs.createReadStream(mp4OutputFilePath);
    await uploadGIF(mp4File, `${key}.mp4`); // Upload the file to S3
    fs.unlinkSync(mp4OutputFilePath); // Remove the temporary file
    return 'mp4 creation completed.';
  }catch(error){
    console.error('An error occurred:', error);
      return 'Error creating GIF.';
  }    
}

async function analyzeLocalVideo(path) {
    const video = new Video.VideoIntelligenceServiceClient();
    const file = fs.readFileSync(path);
    const inputContent = file.toString('base64');
    const request = {
      inputContent: inputContent,
      features: ['OBJECT_TRACKING'],
      locationId: 'us-east1', 
    };
  
    const [operation] = await video.annotateVideo(request);
    const results = await operation.promise();
  
    console.log('Waiting for operation to complete...');
  
    const annotations = results[0].annotationResults[0];
    const objects = annotations.objectAnnotations;
  
    const data = objects.map((object) => {
      const entityDescription = object.entity.description;
      const entityId = object.entity.entityId;
      const time = object.segment;
      const startTime = `${time.startTimeOffset.seconds || 0}.${(time.startTimeOffset.nanos / 1e6).toFixed(0)}s`;
      const endTime = `${time.endTimeOffset.seconds || 0}.${(time.endTimeOffset.nanos / 1e6).toFixed(0)}s`;
      const confidence = object.confidence;
      const frame = object.frames[0];
      const box = frame.normalizedBoundingBox;
      const timeOffset = frame.timeOffset;
      const firstFrameTime = `${timeOffset.seconds || 0}.${(timeOffset.nanos / 1e6).toFixed(0)}s`;
      const boundingBox = {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
      };
  
      return {
        entityDescription,
        entityId,
        segment: {
          startTime,
          endTime,
        },
        confidence,
        timeOffset: firstFrameTime,
        boundingBox,
      };
    });
  
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync('output.json', jsonData);
  
    console.log('Analysis completed. Results saved to output.json');

    return jsonData;
  }