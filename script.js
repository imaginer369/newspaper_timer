/**
 * Lap-Based Alarm Stopwatch on github
 * 
 * Core Features:
 * - Stopwatch with start, pause, resume, and reset
 * - Lap recording with individual elapsed time tracking
 * - Lap-based alarm system with independent timers per lap
 * - Keyboard shortcuts for all major actions
 * - Alarm triggering and audio playback
 * 
 * Architecture:
 * - Main stopwatch timer runs continuously via setInterval
 * - Each lap tracks its creation time and alarm configuration
 * - Alarm triggering logic checks elapsed time against alarm duration
 * - Alarms only trigger once per lap (prevented via 'triggered' flag)
 */

// ============================================
// State Management
// ============================================

const state = {
    isRunning: false,
    elapsedTime: 0,            // Total elapsed milliseconds
    startTime: null,           // Timestamp when stopwatch started
    pausedTime: 0,             // Accumulated time before current run
    currentLapStartTime: null, // Timestamp when current lap timer started
    laps: [],                  // Array of lap objects
    intervalId: null,          // Reference to setInterval for animation
    defaultAlarmDurations: [    // Default alarm durations in milliseconds
        1 * 60 * 1000,         // Lap 1: 5 minutes
        1 * 60 * 1000,         // Lap 2: 3 minutes
        1 * 60 * 1000,         // Lap 3: 3 minutes
        5 * 60 * 1000,         // Lap 4: 5 minutes
        5 * 60 * 1000          // Lap 5: 5 minutes
    ]
};

// ============================================
// DOM References
// ============================================

const elements = {
    stopwatchTime: document.getElementById('stopwatch-time'),
    startPauseBtn: document.getElementById('start-pause-btn'),
    lapBtn: document.getElementById('lap-btn'),
    resetBtn: document.getElementById('reset-btn'),
    lapsContainer: document.getElementById('laps-container'),
    currentLapTime: document.getElementById('current-lap-time'),
    alarmSound: document.getElementById('alarm-sound')
};

// ============================================
// Utility: Local Storage (Record Laps)
// ============================================

/**
 * Save lap data to local storage
 * Persists all recorded laps so they can be retrieved later
 */
function saveLapsToStorage() {
    try {
        const lapsData = state.laps.map(lap => ({
            createdAt: lap.createdAt,
            recordedTime: lap.recordedTime,
            alarmDuration: lap.alarmDuration,
            triggered: lap.triggered,
            enabled: lap.enabled
        }));
        localStorage.setItem('lapsHistory', JSON.stringify(lapsData));
        console.log('Laps saved to local storage');
    } catch (error) {
        console.warn('Error saving laps to storage:', error);
    }
}

/**
 * Load lap data from local storage
 * @returns {array} Array of saved lap objects, or empty array if none exist
 */
function loadLapsFromStorage() {
    try {
        const stored = localStorage.getItem('lapsHistory');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Error loading laps from storage:', error);
    }
    return [];
}

/**
 * Clear all recorded lap history from local storage
 */
function clearLapsHistory() {
    try {
        localStorage.removeItem('lapsHistory');
        console.log('Lap history cleared');
    } catch (error) {
        console.warn('Error clearing laps history:', error);
    }
}

/**
 * Export recorded laps as JSON
 * @returns {string} JSON string of all recorded laps
 */
function exportLapsAsJSON() {
    const lapsData = state.laps.map((lap, index) => ({
        lapNumber: index + 1,
        createdAt: new Date(lap.createdAt).toISOString(),
        recordedTime: formatTime(lap.recordedTime),
        alarmDuration: formatTime(lap.alarmDuration),
        triggered: lap.triggered,
        enabled: lap.enabled
    }));
    return JSON.stringify(lapsData, null, 2);
}

// ============================================
// Utility: Time Formatting
// ============================================

/**
 * Convert milliseconds to HH:MM:SS format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map(unit => String(unit).padStart(2, '0'))
        .join(':');
}

// ============================================
// Utility: Audio Playback
// ============================================

/**
 * Play the alarm sound from alarm_sound.mp3 file
 * Resets and plays the audio file from the beginning
 */
function playAlarmSound() {
    try {
        const audio = elements.alarmSound;
        // Reset to beginning and play
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.warn('Failed to play alarm sound:', error);
        });
    } catch (error) {
        console.warn('Error playing alarm sound:', error);
    }
}

/**
 * Stop the currently playing alarm sound
 */
function stopAlarmSound() {
    try {
        const audio = elements.alarmSound;
        audio.pause();
        audio.currentTime = 0;
    } catch (error) {
        console.warn('Error stopping alarm sound:', error);
    }
}

// ============================================
// Core Stopwatch Logic
// ============================================

/**
 * Start or resume the stopwatch
 */
function startStopwatch() {
    if (state.isRunning) return;

    state.isRunning = true;
    state.startTime = Date.now() - state.pausedTime;
    
    // Initialize current lap timer on first start
    if (state.currentLapStartTime === null) {
        state.currentLapStartTime = state.startTime;
    }

    // Create the first lap box when stopwatch starts (only if no laps exist)
    if (state.laps.length === 0) {
        const lap = {
            createdAt: Date.now(),
            recordedTime: 0,
            alarmDuration: state.defaultAlarmDurations[0] || 5 * 60 * 1000,
            triggered: false,
            enabled: true,
            isRecorded: false  // Mark this as pending, not yet recorded
        };
        state.laps.push(lap);
        renderLaps();
    }

    // Update UI
    elements.startPauseBtn.textContent = 'Pause';
    elements.lapBtn.disabled = false;
    elements.resetBtn.disabled = false;

    // Continuous animation loop (updating time display)
    // Use requestAnimationFrame for smooth updates at ~60fps
    state.intervalId = setInterval(() => {
        updateStopwatchDisplay();
        updateCurrentLapDisplay();
        checkLapAlarms();
    }, 100); // Update every 100ms for smooth display without excessive CPU usage
}

/**
 * Pause the stopwatch (can be resumed)
 * Also pauses the current lap timer (both display and backend)
 */
function pauseStopwatch() {
    if (!state.isRunning) return;

    state.isRunning = false;
    clearInterval(state.intervalId);

    // Update UI
    elements.startPauseBtn.textContent = 'Resume';
}

/**
 * Reset the stopwatch and clear all laps
 */
function resetStopwatch() {
    state.isRunning = false;
    state.elapsedTime = 0;
    state.pausedTime = 0;
    state.startTime = null;
    state.currentLapStartTime = null;
    state.laps = [];

    clearInterval(state.intervalId);
    clearLapsHistory();

    // Update UI
    elements.stopwatchTime.textContent = '00:00:00';
    elements.currentLapTime.textContent = '00:00:00';
    elements.startPauseBtn.textContent = 'Start';
    elements.lapBtn.disabled = true;
    elements.resetBtn.disabled = true;
    elements.lapsContainer.innerHTML = '<p class="empty-state">No laps yet. Press Start and then Lap to begin.</p>';
}

/**
 * Update the stopwatch display with current elapsed time
 */
function updateStopwatchDisplay() {
    if (!state.isRunning) return;

    state.pausedTime = Date.now() - state.startTime;
    state.elapsedTime = state.pausedTime;
    elements.stopwatchTime.textContent = formatTime(state.elapsedTime);
}

/**
 * Update the current lap display
 * Shows elapsed time of the current active lap (not yet recorded)
 */
function updateCurrentLapDisplay() {
    if (state.currentLapStartTime === null) {
        // No lap has started yet, show 00:00:00
        elements.currentLapTime.textContent = '00:00:00';
        return;
    }

    // Calculate current lap elapsed time from when it started
    let currentLapElapsedTime;
    if (state.isRunning) {
        currentLapElapsedTime = Date.now() - state.currentLapStartTime;
    } else {
        currentLapElapsedTime = state.pausedTime - (state.currentLapStartTime - state.startTime);
    }
    
    elements.currentLapTime.textContent = formatTime(Math.max(0, currentLapElapsedTime));
}

// ============================================
// Lap Management
// ============================================

/**
 * Create a new lap with current stopwatch time
 * Each lap stores its creation time and alarm configuration
 * 
 * When a new lap is recorded:
 * - Record the elapsed time from the current active lap
 * - Stop the currently playing alarm sound
 * - Disable the alarm for the previously recorded lap
 * - Reset its triggered state
 * - Start a new current lap timer
 */
function createLap() {
    if (!state.isRunning && state.laps.length === 0) {
        console.warn('Start the stopwatch before creating laps');
        return;
    }

    // Get the elapsed time from the current lap BEFORE creating a new one
    let recordedTime = 0;
    if (state.currentLapStartTime !== null) {
        if (state.isRunning) {
            recordedTime = Date.now() - state.currentLapStartTime;
        } else {
            recordedTime = state.pausedTime - (state.currentLapStartTime - state.startTime);
        }
    }

    // Stop any currently playing alarm when a new lap is recorded
    stopAlarmSound();

    if (state.laps.length > 0) {
        const currentLapIndex = state.laps.length - 1;
        const currentLap = state.laps[currentLapIndex];
        
        // If this is the first lap (pending), just record it
        if (!currentLap.isRecorded) {
            currentLap.recordedTime = Math.max(0, recordedTime);
            currentLap.isRecorded = true;
            currentLap.enabled = false;
            currentLap.triggered = false;
        } else {
            // For subsequent laps, disable the current one
            currentLap.enabled = false;
            currentLap.triggered = false;
        }
        updateLapUI(currentLapIndex);
    }

    const lapIndex = state.laps.length;
    const defaultDuration = state.defaultAlarmDurations[lapIndex] || 5 * 60 * 1000;

    // Lap object structure:
    // - createdAt: when the lap was created (timestamp)
    // - recordedTime: the final elapsed time when this lap was recorded (frozen)
    // - alarmDuration: configured alarm duration in milliseconds
    // - triggered: flag to prevent alarm from retriggering
    // - enabled: whether the alarm is active
    // - isRecorded: whether this lap has been finalized
    const lap = {
        createdAt: Date.now(),
        recordedTime: 0,
        alarmDuration: defaultDuration,
        triggered: false,
        enabled: true,
        isRecorded: false
    };

    state.laps.push(lap);
    
    // Reset current lap timer for the next lap
    state.currentLapStartTime = state.isRunning ? Date.now() : state.startTime + state.pausedTime;
    
    renderLaps();
    
    // Save the recorded lap to local storage
    saveLapsToStorage();
}

/**
 * Get the elapsed time for a specific lap
 * Uses the main stopwatch's pausedTime as reference to prevent jump on resume
 * Lap elapsed time = main stopwatch time - when the lap was created
 * 
 * @param {number} lapIndex - Index of the lap
 * @returns {number} Elapsed time in milliseconds
 */
function getLapElapsedTime(lapIndex) {
    if (lapIndex >= state.laps.length) return 0;

    const lap = state.laps[lapIndex];
    
    // Get main stopwatch's current elapsed time
    let mainElapsedTime;
    if (state.isRunning) {
        mainElapsedTime = Date.now() - state.startTime;
    } else {
        mainElapsedTime = state.pausedTime;
    }
    
    // Lap elapsed time = main elapsed time - time when this lap was created
    return Math.max(0, mainElapsedTime - (lap.createdAt - state.startTime));
}

/**
 * Check all lap alarms and trigger if conditions are met
 * 
 * Alarm triggering logic:
 * 1. Only check the current lap (most recently created lap)
 * 2. Check if lap alarm is enabled
 * 3. Check if lap elapsed time >= configured alarm duration
 * 4. Check if alarm hasn't been triggered yet (prevent retriggering)
 * 5. Mark alarm as triggered and play sound
 * 
 * Alarms only trigger once per lap and reset when:
 * - The stopwatch is reset
 * - A new lap is created
 */
function checkLapAlarms() {
    // Only check the current lap (the most recently created one)
    if (state.laps.length === 0) return;

    const currentLapIndex = state.laps.length - 1;
    const currentLap = state.laps[currentLapIndex];

    // Skip if alarm is disabled or already triggered
    if (!currentLap.enabled || currentLap.triggered) return;

    const lapElapsedTime = getLapElapsedTime(currentLapIndex);

    // Trigger alarm if elapsed time reaches or exceeds alarm duration
    if (lapElapsedTime >= currentLap.alarmDuration) {
        currentLap.triggered = true;
        playAlarmSound();
        updateLapUI(currentLapIndex);
    }
}

// ============================================
// Lap Alarm Management
// ============================================

/**
 * Update alarm duration for a lap
 * @param {number} lapIndex - Index of the lap
 * @param {number} durationMs - New duration in milliseconds
 */
function updateLapAlarmDuration(lapIndex, durationMs) {
    if (lapIndex < state.laps.length) {
        state.laps[lapIndex].alarmDuration = durationMs;
        // Reset triggered flag when duration is changed (allows re-triggering at new time)
        state.laps[lapIndex].triggered = false;
        updateLapUI(lapIndex);
    }
}

/**
 * Toggle alarm enabled/disabled for a lap
 * @param {number} lapIndex - Index of the lap
 */
function toggleLapAlarm(lapIndex) {
    if (lapIndex < state.laps.length) {
        state.laps[lapIndex].enabled = !state.laps[lapIndex].enabled;
        // Reset triggered flag when toggling (allows fresh alarm state)
        state.laps[lapIndex].triggered = false;
        updateLapUI(lapIndex);
    }
}

// ============================================
// UI Rendering
// ============================================

/**
 * Render all laps with their times, alarms, and edit controls
 */
function renderLaps() {
    if (state.laps.length === 0) {
        elements.lapsContainer.innerHTML = '<p class="empty-state">No laps yet. Press Start and then Lap to begin.</p>';
        return;
    }

    elements.lapsContainer.innerHTML = state.laps
        .map((lap, index) => createLapElement(lap, index))
        .join('');

    // Re-attach event listeners after rendering
    attachLapEventListeners();
}

/**
 * Create HTML for a single lap item
 * @param {object} lap - Lap object
 * @param {number} index - Lap index (0-based)
 * @returns {string} HTML string
 */
function createLapElement(lap, index) {
    const lapNumber = index + 1;
    const alarmDurationFormatted = formatTime(lap.alarmDuration);
    const recordedTimeFormatted = formatTime(lap.recordedTime);
    const isTriggered = lap.triggered;
    const isRecorded = lap.isRecorded;
    
    // Status: "Done" if recorded, "Triggered" if alarm triggered, "Pending" otherwise
    let statusClass, statusText;
    if (isRecorded) {
        statusClass = 'status-done';
        statusText = 'Done';
    } else if (isTriggered) {
        statusClass = 'status-triggered';
        statusText = 'Triggered';
    } else {
        statusClass = 'status-pending';
        statusText = 'Pending';
    }
    
    const itemClass = isRecorded ? 'lap-item lap-done' : isTriggered ? 'lap-item alarm-triggered' : 'lap-item';

    return `
        <div class="${itemClass}" data-lap-index="${index}">
            <div class="lap-header">
                <span class="lap-number">Lap ${lapNumber}</span>
                <span class="lap-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="lap-times">
                <div class="time-info">
                    <span class="time-label">Lap Time</span>
                    <span class="time-value">${recordedTimeFormatted}</span>
                </div>
                <div class="time-info">
                    <span class="time-label">Alarm At</span>
                    <span class="time-value">${alarmDurationFormatted}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update a single lap's UI without re-rendering all laps
 * More efficient than full re-render
 * @param {number} lapIndex - Index of lap to update
 */
function updateLapUI(lapIndex) {
    const lapElement = document.querySelector(`[data-lap-index="${lapIndex}"]`);
    if (!lapElement) {
        renderLaps();
        return;
    }

    const lap = state.laps[lapIndex];
    const elapsedTime = getLapElapsedTime(lapIndex);
    const alarmDurationFormatted = formatTime(lap.alarmDuration);
    const elapsedTimeFormatted = formatTime(elapsedTime);
    const isTriggered = lap.triggered;
    const isRecorded = lap.isRecorded;

    // Update elapsed time
    const elapsedElement = lapElement.querySelector('.lap-times .time-value');
    if (elapsedElement) {
        elapsedElement.textContent = elapsedTimeFormatted;
    }

    // Update status based on lap state
    const statusElement = lapElement.querySelector('.lap-status');
    if (statusElement) {
        if (isRecorded) {
            statusElement.textContent = 'Done';
            statusElement.className = 'lap-status status-done';
        } else if (isTriggered) {
            statusElement.textContent = 'Triggered';
            statusElement.className = 'lap-status status-triggered';
        } else {
            statusElement.textContent = 'Pending';
            statusElement.className = 'lap-status status-pending';
        }
    }

    // Update item class
    if (isRecorded) {
        lapElement.classList.add('lap-done');
        lapElement.classList.remove('alarm-triggered');
    } else if (isTriggered) {
        lapElement.classList.add('alarm-triggered');
        lapElement.classList.remove('lap-done');
    } else {
        lapElement.classList.remove('alarm-triggered');
        lapElement.classList.remove('lap-done');
    }
}

/**
 * Attach event listeners to lap controls
 * Must be called after rendering to attach handlers
 */
function attachLapEventListeners() {
    // Event listeners removed - alarm duration and disable controls are no longer displayed
}

/**
 * Parse time string in MM:SS format to milliseconds
 * @param {string} timeString - Time in MM:SS format
 * @returns {number|null} Duration in milliseconds, or null if invalid
 */
function parseTimeString(timeString) {
    // Support formats: MM:SS, M:SS, SS
    const parts = timeString.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        if (!isNaN(minutes) && !isNaN(seconds) && seconds < 60) {
            return (minutes * 60 + seconds) * 1000;
        }
    } else if (parts.length === 1) {
        const seconds = parts[0];
        if (!isNaN(seconds)) {
            return seconds * 1000;
        }
    }

    return null;
}

// ============================================
// Event Listeners: Button Controls
// ============================================

elements.startPauseBtn.addEventListener('click', () => {
    if (state.isRunning) {
        pauseStopwatch();
    } else {
        startStopwatch();
    }
});

elements.lapBtn.addEventListener('click', createLap);

elements.resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the stopwatch? All laps will be lost.')) {
        resetStopwatch();
    }
});

// ============================================
// Event Listeners: Keyboard Shortcuts
// ============================================

/**
 * Keyboard shortcuts:
 * - Space: Start/Pause
 * - L: Create Lap
 * - R: Reset
 */
document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT') {
        return;
    }

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            elements.startPauseBtn.click();
            break;
        case 'KeyL':
            e.preventDefault();
            if (!elements.lapBtn.disabled) {
                elements.lapBtn.click();
            }
            break;
        case 'KeyR':
            e.preventDefault();
            if (!elements.resetBtn.disabled) {
                elements.resetBtn.click();
            }
            break;
    }
});

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    console.log('Lap-Based Alarm Stopwatch initialized');
    // Initial UI state is already correct (stopwatch at 00:00:00, buttons properly disabled)
    // No need to explicitly render empty laps or set up default state
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
