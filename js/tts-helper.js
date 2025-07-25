// Text-to-Speech utility for listening exercises
class TextToSpeechHelper {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.initVoice();
    }
    
    initVoice() {
        const voices = this.synth.getVoices();
        // Try to find English voice
        this.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        // If voices not loaded yet, wait for them
        if (voices.length === 0) {
            this.synth.addEventListener('voiceschanged', () => {
                const voices = this.synth.getVoices();
                this.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            });
        }
    }
    
    speak(text, rate = 0.8, pitch = 1) {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voice;
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = 1;
            
            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);
            
            this.synth.speak(utterance);
        });
    }
    
    stop() {
        this.synth.cancel();
    }
}

// Initialize TTS helper
const ttsHelper = new TextToSpeechHelper();

// Generate audio for exercises
function generateExerciseAudio(exercise) {
    const fullText = exercise.text.map(sentence => 
        sentence.words.map(word => word.isBlank ? word.answer : word.text).join(' ')
    ).join(' ');
    
    return ttsHelper.speak(fullText, 0.7); // Slower rate for listening exercise
}

// Override loadRandomListeningExercise to use TTS
function loadRandomListeningExercise() {
    const exercises = getListeningExercises();
    const randomIndex = Math.floor(Math.random() * exercises.length);
    currentExercise = exercises[randomIndex];
    
    // Generate and play audio using TTS
    generateExerciseAudio(currentExercise).catch(error => {
        console.warn('TTS not available, using placeholder audio');
    });
    
    // Load exercise content
    loadExerciseContent();
    
    // Reset results
    document.getElementById('exerciseResult').innerHTML = '';
    exerciseAnswers = {};
    
    // Update audio controls to use TTS
    updateAudioControlsForTTS();
}

function updateAudioControlsForTTS() {
    // Hide the audio element and show TTS controls
    const audioElement = document.getElementById('exerciseAudio');
    audioElement.style.display = 'none';
    
    const audioContainer = audioElement.parentElement;
    
    // Check if TTS controls already exist
    if (!document.getElementById('ttsControls')) {
        const ttsControls = document.createElement('div');
        ttsControls.id = 'ttsControls';
        ttsControls.className = 'tts-controls mb-3';
        ttsControls.innerHTML = `
            <div class="card bg-light">
                <div class="card-body text-center">
                    <h6><i class="fas fa-volume-up"></i> Text-to-Speech Audio</h6>
                    <p class="small text-muted mb-3">Audio được tạo tự động từ văn bản</p>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary btn-sm" onclick="playTTSAudio()">
                            <i class="fas fa-play"></i> Phát
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="stopTTSAudio()">
                            <i class="fas fa-stop"></i> Dừng
                        </button>
                        <button class="btn btn-info btn-sm" onclick="playTTSSlowly()">
                            <i class="fas fa-turtle"></i> Phát chậm
                        </button>
                    </div>
                </div>
            </div>
        `;
        audioContainer.insertBefore(ttsControls, audioElement);
    }
}

function playTTSAudio() {
    if (currentExercise) {
        generateExerciseAudio(currentExercise);
    }
}

function stopTTSAudio() {
    ttsHelper.stop();
}

function playTTSSlowly() {
    if (currentExercise) {
        const fullText = currentExercise.text.map(sentence => 
            sentence.words.map(word => word.isBlank ? word.answer : word.text).join(' ')
        ).join(' ');
        
        ttsHelper.speak(fullText, 0.5); // Even slower
    }
}

// Add to listening.js by including this file
document.addEventListener('DOMContentLoaded', function() {
    // Auto-load TTS helper when page loads
    console.log('🔊 Text-to-Speech helper loaded');
});
