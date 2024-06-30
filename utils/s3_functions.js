import dotenv from "dotenv";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const s3Client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = "easytrack-records";

export async function uploadFile(file, key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    }

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        return "File uploaded successfully";
    } catch (err) {
        console.log(err);
        return "Internal Server Error: Failed to upload file";
    }
}

export async function generatePresignedUrl(key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: 60 * 60,
    };

    try {
        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url
    } catch (err) {
        console.log(err);
        return;
    }
}

export async function deleteFile(key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
    };

    try {
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        return "File deleted successfully";
    } catch (err) {
        console.log(err);
        return "Internal Server Error: Failed to delete file";
    }
}


