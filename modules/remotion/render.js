const { renderMedia, renderStill, selectComposition } = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { exec } = require("child_process");
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();
const https = require('https');

const generateTTSAudio = async (newsData) => {
    console.error("Data Here:", newsData.videoContent.word);

    return new Promise((resolve, reject) => {
        try {
            // Prepare request body
            const requestBody = JSON.stringify({
                "content": `<voice name="en-US-AndrewNeural">${newsData.videoContent.word}, a ${newsData.videoContent.type}, means ${newsData.videoContent.meaning}. For example, ${newsData.videoContent.example1}</voice>`,
                "locale": "en-US",
                "ip": "127.0.0.1"
            });

            // Parse the URL
            const url = new URL(`https://mmhomepageapi.azurewebsites.net/api/MMHomePageApi?code=${process.env.MIC_MONSTOR_CODE}`);

            // Prepare request options
            const requestOptions = {
                method: 'POST',
                hostname: url.hostname,
                path: url.pathname + url.search,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            };

            // Create the request
            const req = https.request(requestOptions, (res) => {
                let responseData = '';

                // A chunk of data has been received
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                // The whole response has been received
                res.on('end', async () => {
                    try {
                        // Decode base64 data
                        const audioBuffer = Buffer.from(responseData, 'base64');

                        // Generate random filename and save path
                        const randomId_audio = crypto.randomBytes(6).toString('hex');
                        const audioOutputPath = path.resolve(`./output/${randomId_audio}.mp3`);

                        // Ensure output directory exists
                        await fsPromises.mkdir(path.dirname(audioOutputPath), { recursive: true });

                        // Write the buffer to an MP3 file
                        await fsPromises.writeFile(audioOutputPath, audioBuffer);

                        console.log(`TTS audio generated at: ${audioOutputPath}`);
                        resolve(audioOutputPath);
                    } catch (error) {
                        console.error('Error processing TTS response:', error);
                        reject(error);
                    }
                });
            });

            // Handle request errors
            req.on('error', (error) => {
                console.error('Error generating TTS audio:', error.message);
                reject(error);
            });

            // Write request body and end the request
            req.write(requestBody);
            req.end();

        } catch (error) {
            console.error('Unexpected error in TTS generation:', error);
            reject(error);
        }
    });
}

const generateVideo = async (imagePath, audioPath, outputPath) => {
    return new Promise((resolve, reject) => {
        // Ensure paths are absolute for FFmpeg
        const absoluteImagePath = path.resolve(imagePath);
        const absoluteAudioPath = path.resolve(audioPath);
        const absoluteOutputPath = path.resolve(outputPath);

        // FFmpeg command
        const command = `ffmpeg -y -loop 1 -i "${absoluteImagePath}" -i "${absoluteAudioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -shortest -vf "scale=1080:1920" "${absoluteOutputPath}"`;

        // Execute FFmpeg command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error generating video:", error.message);
                reject(error);
                return;
            }
            if (stderr) {
                // console.error("FFmpeg stderr:", stderr);
            }
            console.log(`Video successfully generated at: ${absoluteOutputPath}`);
            // Clean up temporary files
            fs.unlink(absoluteImagePath, (err) => {
                if (err) console.error('Error deleting image:', err);
            });
            fs.unlink(absoluteAudioPath, (err) => {
                if (err) console.error('Error deleting audio:', err);
            });
            resolve(absoluteOutputPath);
        });
    });
}

async function renderVideo(newsData) {
    try {
        // Generate TTS audio first
        const ttsAudioPath = await generateTTSAudio(newsData);

        const bundleLocation = await bundle({
            entryPoint: path.resolve('./modules/remotion/index.tsx'),
            webpackOverride: (config) => ({
                ...config,
                resolve: {
                    ...config.resolve,
                    fallback: {
                        ...config.resolve?.fallback,
                        fs: false,
                        path: false,
                        os: false,
                    },
                },
            }),
        });

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'BackgroundVideo',
            inputProps: { newsData },
        });

        const randomId = crypto.randomBytes(6).toString('hex');
        const outputLocation = path.resolve('./output', `${randomId}.png`);

        await renderStill({
            composition,
            serveUrl: bundleLocation,
            output: outputLocation,
            inputProps: { newsData },
        });

        // if (fs.existsSync(outputLocation)) {
        //     console.log(`Image confirmed at: ${outputLocation}`);
        // } else {
        //     console.error(`Image NOT found at: ${outputLocation}`);
        //     throw new Error('Generated image not found');
        // }

        // Generate final video with TTS audio
        const randomId_video = crypto.randomBytes(6).toString('hex');
        const video_output = path.resolve(`./output/${randomId_video}.mp4`);

        return generateVideo(outputLocation, ttsAudioPath, video_output);

    } catch (error) {
        console.error('Error during rendering:', error);
        if (error.stackFrame) {
            console.error('Stack frame:', error.stackFrame);
        }
        throw error;
    }
}

module.exports = { renderVideo };