const express = require("express");
const path = require('path');

const router = express.Router();
const fileparser = require('./fileparser');
const { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
router.use(express.static(path.join(__dirname, 'public')));

// Middleware to fetch list of files from S3
const fetchFilesFromS3 = async (req, res, next) => {
  try {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET }));
    res.locals.files = data.Contents;
    next();
  } catch (error) {
    next(error);
  }
};
const downloadFile = async (req, res) => {
  const { Key } = req.query;

  if (!Key) {
    return res.status(400).send('Missing Key parameter');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key,
    });

    const data = await s3Client.send(command);
    const fileStream = data.Body;

    res.attachment(Key);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
};


const deleteFile = async (bucketName, key) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};



// Middleware to log requests
router.use((request, response, next) => {
  console.log("middleware!!!!!");
  next();
});
router.use(express.static('public')); // Serve static files from the 'public' directory

// Define the GET endpoint
router.route("/").get(async (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    next(error);
  }
});


router.delete('/api/delete', async (req, res) => {
  const { Key } = req.body;

  if (!Key) {
    return res.status(400).json({ message: 'File key is required.' });
  }

  try {
    await deleteFile(process.env.S3_BUCKET, Key);
    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file.', error });
  }
});

router.route('/api/upload').post(async (req,res,next)=>{
  await fileparser(req)
  .then(data => {
    res.render('upload-success', { data }); // Render the 'upload-success' view with data
  })
  .catch(error => {
    res.status(400).json({
      message: "An error occurred!",
      error
    })
  })
});


// Assuming this is in your Express router setup
router.get('/api/files',fetchFilesFromS3, async (req, res, next) => {
  try {
      const data = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET }));
      // const dataContent = data.Contents;
      const { files } = res.locals; // Retrieve files from res.locals
      res.render('list', { files }); // Render the 'list' view with dataContent
  } catch (error) {
      next(error);
  }
});




router.get('/api/all_data', async (req, res, next) => {
  try {
      const data = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET }));
      const dataContent = data.Contents;
      // const { files } = res.locals; // Retrieve files from res.locals
      // res.render('data', { files }); // Render the 'list' view with dataContent
      res.json(dataContent)
  } catch (error) {
      next(error);
  }
});



router.get('/api/download', downloadFile);

// Download file from S3 bucket
router.get('/api/files/:filename', async (req, res, next) => {
  const { filename } = req.params;
  const bucketParams = {
      Bucket: process.env.S3_BUCKET,
      Key: filename
  };

  try {
      const command = new GetObjectCommand(bucketParams);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
      res.redirect(url);
  } catch (error) {
      next(error);
  }
});

// Delete file from S3 bucket
router.delete('/api/files/:filename', async (req, res, next) => {
  const { filename } = req.params;
  const bucketParams = {
      Bucket: process.env.S3_BUCKET,
      Key: filename
  };

  try {
      const data = await s3Client.send(new DeleteObjectCommand(bucketParams));
      res.status(200).json({ message: "File deleted successfully", data });
  } catch (error) {
      next(error);
  }
});
  

module.exports = router;
