const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { renderVideo } = require('./modules/remotion/render');
const { PostToTiktok } = require('./modules/tiktok/tiktok');

const app = express();
const PORT = process.env.PORT || 3004;

// Configuration
const CONFIG = {
    VOCABULARY_FILE: path.resolve(__dirname, 'public', 'data', 'vocabulary.json'),
    INDEX_FILE: 'current_index.json',
    VIDEOS_PER_DAY: 5,
};

// Improved Vocabulary Manager Class
class VocabularyManager {
    constructor() {
        this.vocabularyData = [];
        this.currentState = {
            dailyVideoCount: 0,
            currentIndex: 0,
            lastResetDate: new Date().toISOString().split('T')[0]
        };
    }

    // Load vocabulary data
    async loadVocabularyData() {
        try {
            const data = await fs.readFile(CONFIG.VOCABULARY_FILE, 'utf8');
            this.vocabularyData = JSON.parse(data);
        } catch (error) {
            console.error('Error reading vocabulary file:', error);
            this.vocabularyData = [];
        }
    }

    // Load or initialize state
    async loadState() {
        try {
            const stateData = await fs.readFile(CONFIG.INDEX_FILE, 'utf8');
            this.currentState = JSON.parse(stateData);

            // Reset daily count if it's a new day
            const today = new Date().toISOString().split('T')[0];
            if (this.currentState.lastResetDate !== today) {
                this.currentState.dailyVideoCount = 0;
                this.currentState.lastResetDate = today;
            }
        } catch (error) {
            // Initialize state if file doesn't exist
            await this.saveState();
        }
    }

    // Save current state
    async saveState() {
        try {
            await fs.writeFile(
                CONFIG.INDEX_FILE,
                JSON.stringify(this.currentState, null, 2)
            );
        } catch (error) {
            console.error('Error saving current state:', error);
        }
    }

    // Get next word for video
    getNextWord() {
        if (this.vocabularyData.length === 0) return null;

        const word = this.vocabularyData[this.currentState.currentIndex];
        this.currentState.currentIndex =
            (this.currentState.currentIndex + 1) % this.vocabularyData.length;

        return word;
    }

    // Format word for video
    formatWordContent(wordData) {
        return {
            word: wordData.word,
            pronunciation: wordData.wordForms.pronunciation,
            type: wordData.type[0],
            meaning: wordData.meaning,
            example1: wordData.exampleSentences[0],
            example2: wordData.exampleSentences[1],
            synonyms1: wordData.synonyms[0],
            synonyms2: wordData.synonyms[1],
            synonyms3: wordData.synonyms[2],
            synonyms4: wordData.synonyms[3],
        };
    }

    // Check if we can generate more videos today
    canGenerateVideo() {
        return this.currentState.dailyVideoCount < CONFIG.VIDEOS_PER_DAY;
    }

    // Increment daily video count
    incrementVideoCount() {
        this.currentState.dailyVideoCount++;
    }
}

// Video Processing Service
class VideoProcessingService {
    constructor(vocabularyManager) {
        this.vocabularyManager = vocabularyManager;
    }

    async processVideo() {
        try {
            // Check if we can generate more videos today
            // if (!this.vocabularyManager.canGenerateVideo()) {
            //     console.log('Daily video limit reached');
            //     return false;
            // }

            // Get next word
            const wordData = this.vocabularyManager.getNextWord();
            if (!wordData) {
                console.log('No vocabulary data available');
                return false;
            }

            console.log(`Processing word: ${wordData.word}`);

            // Format content for video
            const videoContent = this.vocabularyManager.formatWordContent(wordData);

            // Render and post video
            const videoPath = await renderVideo({ videoContent });
            await PostToTiktok(videoPath);
            await fs.unlink(videoPath);
            
            // Update state
            this.vocabularyManager.incrementVideoCount();
            await this.vocabularyManager.saveState();

            console.log('Video processing completed successfully');
            return true;
        } catch (error) {
            console.error('Error in video processing:', error);
            return false;
        }
    }
}

// Initialize services
const vocabularyManager = new VocabularyManager();
const videoProcessingService = new VideoProcessingService(vocabularyManager);

// Initialize app
async function initializeApp() {
    await vocabularyManager.loadVocabularyData();
    await vocabularyManager.loadState();

    await videoProcessingService.processVideo();

    // Schedule videos three times a day
    cron.schedule('0 6,12,18 * * *', async () => {
        await videoProcessingService.processVideo();
    });

    // Setup Express routes
    app.get('/trigger-video', async (req, res) => {
        try {
            const result = await videoProcessingService.processVideo();
            res.json({
                message: result
                    ? 'Video processing triggered successfully.'
                    : 'Could not process video.'
            });
        } catch (error) {
            res.status(500).json({
                message: 'Video processing failed',
                error: error.message
            });
        }
    });

    app.get('/current-word', async (req, res) => {
        try {
            const currentIndex = vocabularyManager.currentState.currentIndex;
            res.json({
                currentWord: vocabularyManager.vocabularyData[currentIndex],
                currentIndex,
                totalWords: vocabularyManager.vocabularyData.length,
                dailyVideosProcessed: vocabularyManager.currentState.dailyVideoCount
            });
        } catch (error) {
            res.status(500).json({
                message: 'Failed to get current word status',
                error: error.message
            });
        }
    });

    app.get('/health-check', (req, res) => {
        res.json({
            message: 'Server is working fine.',
            dailyVideosProcessed: vocabularyManager.currentState.dailyVideoCount
        });
    });
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initializeApp();
});