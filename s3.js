require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');

const { Upload } = require('@aws-sdk/lib-storage');


const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});


async function uploadGIF(fileStream, filename) {
    console.log('Video upload function called.');
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: filename,
    };
    console.log('Uploading to S3...');
    const parallelUploads3 = new Upload({ client: s3Client, params: uploadParams });
    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(progress);
    });
    await parallelUploads3.done();
  
    console.log('Upload Completed');
    return 'success';
  }

  
  exports.uploadGIF = uploadGIF;

  async function uploadJSON(fileStream, filename) {
    console.log('JSON upload function called.');
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: filename,
      ContentType: 'application/json'
    };
    console.log('Uploading to S3...');
    const parallelUploads3 = new Upload({ client: s3Client, params: uploadParams });
    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(progress);
    });
    await parallelUploads3.done();
  
    console.log('Upload Completed');
    return 'success';
  }

  
  exports.uploadJSON = uploadJSON;