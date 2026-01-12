# Lap-Based Alarm Stopwatch

A production-ready web application for tracking time with advanced lap-based alarm functionality. Built with vanilla HTML, CSS, and JavaScript - no external dependencies required.

## Features

### Core Functionality
- ⏱️ **Stopwatch Control**: Start, pause, resume, and reset functionality
- 📍 **Lap Recording**: Automatically creates Lap 1 when stopwatch starts; manually add additional laps
- ⏰ **Lap-Based Alarms**: Independent alarm timer for each lap with configurable durations
- 🔊 **Audio Alerts**: Plays `alarm_sound.mp3` when a lap's elapsed time reaches the alarm duration
- ⌨️ **Keyboard Shortcuts**: Quick control via keyboard

### Advanced Features
- **Real-Time Lap Display**: Shows current lap's elapsed time below main stopwatch
- **Alarm Status Indicators**: Visual display of alarm state (Pending/Triggered) for each lap
- **Default Alarm Configuration**: Pre-set alarm durations:
  - Lap 1: 5 minutes
  - Lap 2: 3 minutes
  - Lap 3: 3 minutes
  - Lap 4: 5 minutes
  - Lap 5: 5 minutes
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices
- **GitHub Pages Compatible**: No backend required - deploy directly to GitHub Pages

## How to Use

### Quick Start
1. Click **Start** (or press Space) to begin the stopwatch - Lap 1 is created automatically
2. Click **Lap** (or press L) to create additional laps
3. Watch the current lap's time displayed below the main stopwatch
4. When a lap's elapsed time reaches its alarm duration, the alarm plays
5. Click **Lap** again to stop the alarm and record a new lap
6. Click **Reset** (or press R) to clear all laps and start over

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Start/Pause | Space |
| Create Lap | L |
| Reset | R |

### Default Alarm Behavior
- Each lap has a pre-configured alarm duration
- The alarm triggers **once** when lap elapsed time ≥ alarm duration
- The alarm **stops** when you record a new lap or reset the stopwatch
- Alarms work simultaneously and independently across all laps

## File Structure

```
newspaper_timer/
├── index.html          # Semantic HTML structure
├── style.css           # Responsive styling with gradients & animations
├── script.js           # Complete JavaScript logic (490+ lines)
├── alarm_sound.mp3     # Audio file for alarm playback
└── README.md          # This file
```

## Technical Architecture

### Stopwatch Engine
- Uses `setInterval()` for continuous time tracking (100ms update rate)
- Tracks absolute timestamps to maintain accuracy during pause/resume
- Efficiently updates UI without full re-renders

### Lap Management
```javascript
Lap Object Structure:
{
  createdAt: timestamp,        // When lap was created
  alarmDuration: milliseconds, // Configured alarm time
  triggered: boolean,          // Whether alarm has played
  enabled: boolean            // Whether alarm is active
}
```

### Alarm System
- **Checking Loop**: Runs every 100ms within the main stopwatch interval
- **Trigger Logic**: 
  1. Verify lap alarm is enabled
  2. Calculate lap elapsed time since creation
  3. Compare elapsed time against alarm duration
  4. If elapsed ≥ duration AND not yet triggered: play sound & mark triggered
- **Alarm Duration**: Time measured from lap creation, not stopwatch start

### Performance Optimizations
- Minimal DOM manipulation - only updates changed elements
- Efficient lap elapsed time calculation
- No external libraries - pure vanilla JavaScript (~490 lines)
- Responsive CSS with mobile-first approach

## API Reference

### State Management
```javascript
state.isRunning       // Boolean: whether stopwatch is active
state.elapsedTime     // Total elapsed milliseconds
state.laps            // Array of lap objects
state.pausedTime      // Accumulated pause time
state.intervalId      // Reference to update loop
```

### Key Functions

#### Stopwatch Control
- `startStopwatch()` - Start or resume stopwatch; auto-creates Lap 1
- `pauseStopwatch()` - Pause stopwatch (can resume)
- `resetStopwatch()` - Reset everything and clear all laps

#### Lap Management
- `createLap()` - Create new lap with default alarm duration
- `getLapElapsedTime(lapIndex)` - Get elapsed time of specific lap
- `updateCurrentLapDisplay()` - Update UI for current lap

#### Alarm System
- `checkLapAlarms()` - Check all laps and trigger alarms if needed
- `playAlarmSound()` - Play alarm audio from file
- `stopAlarmSound()` - Stop currently playing alarm

#### Utilities
- `formatTime(milliseconds)` - Convert ms to HH:MM:SS format
- `parseTimeString(timeString)` - Parse MM:SS input (future use)

## UI Components

### Main Display
- **Stopwatch Timer**: Large 64px font, HH:MM:SS format
- **Current Lap Display**: 48px font, shows real-time lap elapsed time
- **Control Buttons**: Start/Pause, Lap, Reset with visual feedback

### Laps List
Each lap shows:
- Lap number (1-based)
- Alarm status badge (Pending/Triggered)
- Elapsed time
- Configured alarm duration
- Visual highlight when alarm triggers

### Responsive Breakpoints
- Mobile (< 600px): Single-column layout, full-width buttons
- Tablet/Desktop: Optimized spacing and typography

## Deployment

### To GitHub Pages
1. Push the repo to GitHub
2. Enable GitHub Pages in repository settings
3. Select `main` branch as source
4. Application is live at: `https://username.github.io/newspaper_timer`

### Local Testing
1. Open `index.html` directly in a web browser
2. Or run a local server: `python -m http.server 8000`
3. Visit: `http://localhost:8000`

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses modern JavaScript)

## Sound File Requirements
- File: `alarm_sound.mp3`
- Location: Same directory as `index.html`
- Format: MP3 (any duration, recommended 1-3 seconds)
- Fallback: If file missing, alarm silently fails (no error)

## Customization

### Change Default Alarm Durations
Edit `state.defaultAlarmDurations` in `script.js`:
```javascript
defaultAlarmDurations: [
    5 * 60 * 1000,  // Lap 1: 5 minutes
    3 * 60 * 1000,  // Lap 2: 3 minutes
    // ... etc
]
```

### Modify Alarm Sound
Replace `alarm_sound.mp3` with your own audio file (same filename required)

### Customize Colors
Edit CSS variables or gradient colors in `style.css`:
- Primary color: `#667eea` and `#764ba2`
- Alert color: `#ff6b6b`

## Known Limitations & Future Enhancements
- Maximum 5 pre-configured alarm durations
- Alarm durations currently read-only (no edit UI)
- No data persistence (laps clear on page refresh)
- Single stopwatch instance per session

### Potential Improvements
- [ ] Add lap editing/deletion UI
- [ ] Persist laps to LocalStorage
- [ ] Multiple stopwatch instances
- [ ] Custom alarm sounds per lap
- [ ] Export lap data as CSV/JSON
- [ ] Dark mode toggle

## License
MIT - Feel free to use, modify, and distribute

## Contributing
This is a standalone educational project. For improvements, feel free to fork and customize!

## Support
For issues or questions, check the code comments in `script.js` - they explain the core logic in detail, especially the alarm system architecture.

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Built With**: HTML5, CSS3, Vanilla JavaScript (ES6+)
