const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client } = require("@aws-sdk/client-s3");
const formidable = require('formidable');
const fs = require('fs');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const parsefile = async (req) => {
    return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm({
            maxFileSize: 100 * 1024 * 1024, // 100 MBs
            allowEmptyFiles: true
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('Error parsing form:', err);
                return reject(err);
            }

            // Debugging: Log the files object to see its structure
            // console.log('Files object:', files);

            const file = files.file[0]; // Access the first file in the array

            if (!file || !file.filepath) {
                const error = new Error('File path is undefined');
                console.error(error);
                return reject(error);
            }

            if (!file || file.size === 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: No file uploaded or file size is zero.');
                return;
            }


            const fileStream = fs.createReadStream(file.filepath);

            const uploadParams = {
                ACL: 'public-read',
                Bucket,
                Key: `${Date.now().toString()}-${file.originalFilename}`,
                Body: fileStream
            };

            const s3Client = new S3Client({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey
                }
            });

            const upload = new Upload({
                client: s3Client,
                params: uploadParams,
                tags: [], // optional tags
                queueSize: 4, // optional concurrency configuration
                partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
                leavePartsOnError: false // optional manually handle dropped parts
            });

            upload.done()
                .then(data => {
                    resolve(data);
                })
                .catch(err => {
                    reject(err);
                });
        });
    });
};

module.exports = parsefile;





