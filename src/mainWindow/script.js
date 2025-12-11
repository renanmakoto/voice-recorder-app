const { ipcRenderer } = require('electron');

/**
 * Main Window Script - Handles audio recording functionality
 */

// DOM Elements
const display = document.querySelector('#display');
const recordButton = document.querySelector('#record');
const micInput = document.querySelector('#mic');
const micIcon = document.querySelector('#mic-icon');

// State
let isRecording = false;
let selectedDeviceId = null;
let mediaRecorder = null;
let startTime = null;
let chunks = [];
let animationFrameId = null;

/**
 * Initializes the application
 */
async function initialize() {
    await populateAudioDevices();
    setupEventListeners();
}

/**
 * Populates the microphone dropdown with available audio input devices
 */
async function populateAudioDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

        audioInputDevices.forEach((device, index) => {
            if (!selectedDeviceId) {
                selectedDeviceId = device.deviceId;
            }
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${index + 1}`;
            micInput.appendChild(option);
        });
    } catch (error) {
        console.error('Error enumerating audio devices:', error);
    }
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    micInput.addEventListener('change', handleDeviceChange);
    recordButton.addEventListener('click', handleRecordClick);
}

/**
 * Handles microphone selection change
 * @param {Event} event - The change event
 */
function handleDeviceChange(event) {
    selectedDeviceId = event.target.value;
}

/**
 * Handles record button click
 */
function handleRecordClick() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

/**
 * Updates the UI to reflect recording state
 * @param {boolean} recording - Whether currently recording
 */
function updateRecordingUI(recording) {
    if (recording) {
        recordButton.classList.add('recording');
        micIcon.classList.add('hide');
    } else {
        recordButton.classList.remove('recording');
        micIcon.classList.remove('hide');
    }
}

/**
 * Starts audio recording
 */
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
            video: false
        });

        mediaRecorder = new MediaRecorder(stream);
        chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            saveRecording();
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        startTime = Date.now();
        isRecording = true;
        updateRecordingUI(true);
        updateDisplay();
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

/**
 * Stops audio recording
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    isRecording = false;
    updateRecordingUI(false);
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Saves the recorded audio
 */
async function saveRecording() {
    if (chunks.length === 0) {
        console.warn('No audio data to save');
        return;
    }

    try {
        const blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        ipcRenderer.send('save_buffer', buffer);
        chunks = [];
    } catch (error) {
        console.error('Error saving recording:', error);
    }
}

/**
 * Updates the timer display
 */
function updateDisplay() {
    if (!isRecording) return;
    
    const elapsed = Date.now() - startTime;
    display.textContent = formatDuration(elapsed);
    animationFrameId = requestAnimationFrame(updateDisplay);
}

/**
 * Formats duration in milliseconds to HH:MM:SS.d format
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted time string
 */
function formatDuration(duration) {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const deciseconds = Math.floor((duration % 1000) / 100);

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${deciseconds}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

// Remove preload class after window loads to enable transitions
window.addEventListener('load', () => {
    document.body.classList.remove('preload');
});