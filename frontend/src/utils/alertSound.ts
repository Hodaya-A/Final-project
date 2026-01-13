/**
 * 🔔 Alert Sound Generator
 * Creates a loud, repetitive phone-ringing style alert sound
 * using Web Audio API (no external files needed!)
 */

export function createAlertAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioContextClass()
  return audioContext
}

export function playAlertSound(durationMs: number = 30000): {
  stop: () => void
  isPlaying: () => boolean
} {
  try {
    const audioContext = createAlertAudioContext()
    let isPlaying = true

    // Create oscillators for phone ringing tone (like Israeli phones)
    const baseFreq1 = 933 // Hz - standard phone tone
    const baseFreq2 = 1394 // Hz - complementary tone

    // Create the main oscillators
    const osc1 = audioContext.createOscillator()
    const osc2 = audioContext.createOscillator()
    const gainMain = audioContext.createGain()
    const gainEnv = audioContext.createGain()

    osc1.frequency.value = baseFreq1
    osc2.frequency.value = baseFreq2
    osc1.type = 'sine'
    osc2.type = 'sine'

    // Connect the audio graph
    osc1.connect(gainMain)
    osc2.connect(gainMain)
    gainMain.connect(gainEnv)
    gainEnv.connect(audioContext.destination)

    // Set initial volume (loud!)
    gainEnv.gain.setValueAtTime(0.3, audioContext.currentTime)

    // Start the oscillators
    osc1.start(audioContext.currentTime)
    osc2.start(audioContext.currentTime)

    // Create a repeating on/off pattern (like a real phone ringing)
    const pattern = [
      { onTime: 0.5, offTime: 0.3 }, // ON 500ms, OFF 300ms
      { onTime: 0.5, offTime: 0.3 },
      { onTime: 0.5, offTime: 1.2 }, // Longer pause between rings
    ]

    let currentTime = audioContext.currentTime
    const startTime = currentTime
    const endTime = startTime + durationMs / 1000

    let patternIndex = 0

    const scheduleNextRing = () => {
      if (!isPlaying || currentTime >= endTime) {
        return
      }

      const { onTime, offTime } = pattern[patternIndex % pattern.length]

      // Sound ON
      gainEnv.gain.setTargetAtTime(0.3, currentTime, 0.01)
      currentTime += onTime

      // Sound OFF
      gainEnv.gain.setTargetAtTime(0.01, currentTime, 0.01)
      currentTime += offTime

      patternIndex++

      // Schedule next ring
      if (isPlaying && currentTime < endTime) {
        setTimeout(scheduleNextRing, (onTime + offTime) * 1000)
      } else {
        stop()
      }
    }

    scheduleNextRing()

    function stop() {
      isPlaying = false
      try {
        osc1.stop(audioContext.currentTime)
        osc2.stop(audioContext.currentTime)
        gainEnv.gain.setValueAtTime(0, audioContext.currentTime)
      } catch (e) {
        console.warn('Error stopping audio:', e)
      }
    }

    return {
      stop,
      isPlaying: () => isPlaying,
    }
  } catch (err) {
    console.error('Error creating alert sound:', err)
    return {
      stop: () => {},
      isPlaying: () => false,
    }
  }
}
