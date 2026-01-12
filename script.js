/**
 * Lap-Based Alarm Stopwatch
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
    laps: [],                  // Array of lap objects
    intervalId: null,          // Reference to setInterval for animation
    defaultAlarmDurations: [    // Default alarm durations in milliseconds
        5 * 60 * 1000,         // Lap 1: 5 minutes
        3 * 60 * 1000,         // Lap 2: 3 minutes
        3 * 60 * 1000,         // Lap 3: 3 minutes
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

    // Automatically create the first lap when stopwatch starts (only if no laps exist)
    if (state.laps.length === 0) {
        createLap();
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
    state.laps = [];

    clearInterval(state.intervalId);

    // Update UI
    elements.stopwatchTime.textContent = '00:00:00';
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
 * Shows elapsed time of the most recently created lap
 */
function updateCurrentLapDisplay() {
    if (state.laps.length === 0) {
        // No laps yet, show 00:00:00
        elements.currentLapTime.textContent = '00:00:00';
        return;
    }

    // Get the current (last created) lap
    const currentLapIndex = state.laps.length - 1;
    const currentLapElapsedTime = getLapElapsedTime(currentLapIndex);
    elements.currentLapTime.textContent = formatTime(currentLapElapsedTime);
}

// ============================================
// Lap Management
// ============================================

/**
 * Create a new lap with current stopwatch time
 * Each lap stores its creation time and alarm configuration
 */
function createLap() {
    if (!state.isRunning && state.laps.length === 0) {
        console.warn('Start the stopwatch before creating laps');
        return;
    }

    // Stop any currently playing alarm when a new lap is recorded
    stopAlarmSound();

    const lapIndex = state.laps.length;
    const defaultDuration = state.defaultAlarmDurations[lapIndex] || 5 * 60 * 1000;

    // Lap object structure:
    // - createdAt: when the lap was created (timestamp)
    // - alarmDuration: configured alarm duration in milliseconds
    // - triggered: flag to prevent alarm from retriggering
    // - enabled: whether the alarm is active
    const lap = {
        createdAt: Date.now(),
        alarmDuration: defaultDuration,
        triggered: false,
        enabled: true
    };

    state.laps.push(lap);
    renderLaps();
}

/**
 * Get the elapsed time for a specific lap
 * Measured from the moment the lap was created
 * 
 * @param {number} lapIndex - Index of the lap
 * @returns {number} Elapsed time in milliseconds
 */
function getLapElapsedTime(lapIndex) {
    if (lapIndex >= state.laps.length) return 0;

    const lap = state.laps[lapIndex];
    const now = state.isRunning ? Date.now() : Date.now() - (state.pausedTime - (Date.now() - state.startTime));
    
    // If stopwatch is paused, use the paused elapsed time as reference
    const currentTime = state.isRunning ? Date.now() : state.startTime + state.pausedTime;
    return Math.max(0, currentTime - lap.createdAt);
}

/**
 * Check all lap alarms and trigger if conditions are met
 * 
 * Alarm triggering logic:
 * 1. Check if lap alarm is enabled
 * 2. Check if lap elapsed time >= configured alarm duration
 * 3. Check if alarm hasn't been triggered yet (prevent retriggering)
 * 4. Mark alarm as triggered and play sound
 * 
 * Alarms only trigger once per lap and reset when:
 * - The stopwatch is reset
 * - A new lap is created
 */
function checkLapAlarms() {
    state.laps.forEach((lap, index) => {
        // Skip if alarm is disabled or already triggered
        if (!lap.enabled || lap.triggered) return;

        const lapElapsedTime = getLapElapsedTime(index);

        // Trigger alarm if elapsed time reaches or exceeds alarm duration
        if (lapElapsedTime >= lap.alarmDuration) {
            lap.triggered = true;
            playAlarmSound();
            updateLapUI(index);
        }
    });
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
    const elapsedTime = getLapElapsedTime(index);
    const alarmDurationFormatted = formatTime(lap.alarmDuration);
    const elapsedTimeFormatted = formatTime(elapsedTime);
    const isTriggered = lap.triggered;
    const statusClass = isTriggered ? 'status-triggered' : 'status-pending';
    const statusText = isTriggered ? 'Triggered' : 'Pending';
    const itemClass = isTriggered ? 'lap-item alarm-triggered' : 'lap-item';

    return `
        <div class="${itemClass}" data-lap-index="${index}">
            <div class="lap-header">
                <span class="lap-number">Lap ${lapNumber}</span>
                <span class="lap-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="lap-times">
                <div class="time-info">
                    <span class="time-label">Elapsed</span>
                    <span class="time-value">${elapsedTimeFormatted}</span>
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

    // Update elapsed time
    const elapsedElement = lapElement.querySelector('.lap-times .time-value');
    if (elapsedElement) {
        elapsedElement.textContent = elapsedTimeFormatted;
    }

    // Update status
    const statusElement = lapElement.querySelector('.lap-status');
    if (statusElement) {
        statusElement.textContent = isTriggered ? 'Triggered' : 'Pending';
        statusElement.className = `lap-status ${isTriggered ? 'status-triggered' : 'status-pending'}`;
    }

    // Update item class
    if (isTriggered) {
        lapElement.classList.add('alarm-triggered');
    } else {
        lapElement.classList.remove('alarm-triggered');
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
