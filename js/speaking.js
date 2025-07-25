// Speaking page functionality
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingTimer = null;
let currentSpeakingMode = null;
let currentTopic = null;
let pronunciationWords = [];
let currentPronunciationIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializeSpeaking();
    loadSpeakingHistory();
    loadPronunciationWords();
});

function initializeSpeaking() {
    // Check if browser supports audio recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        app.showNotification('Trình duyệt không hỗ trợ ghi âm!', 'warning');
        return;
    }
}

// Free Recording Section
function showFreeRecording() {
    hideAllSections();
    document.getElementById('freeRecordingSection').style.display = 'block';
    currentSpeakingMode = 'free';
    loadRecordedAudio();
}

function hideFreeRecording() {
    document.getElementById('freeRecordingSection').style.display = 'none';
    currentSpeakingMode = null;
    stopRecording();
}

async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            saveRecording(audioBlob);
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        
        updateRecordingUI();
        startRecordingTimer();
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        app.showNotification('Không thể truy cập microphone!', 'danger');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        clearInterval(recordingTimer);
        updateRecordingUI();
    }
}

function updateRecordingUI() {
    const recordButton = document.getElementById('recordButton');
    const topicRecordButton = document.getElementById('topicRecordButton');
    const recordingStatus = document.getElementById('recordingStatus');
    
    if (isRecording) {
        if (recordButton) {
            recordButton.classList.add('recording');
            recordButton.innerHTML = '<i class="fas fa-stop"></i>';
        }
        if (topicRecordButton) {
            topicRecordButton.classList.add('recording');
            topicRecordButton.innerHTML = '<i class="fas fa-stop"></i>';
        }
        if (recordingStatus) {
            recordingStatus.innerHTML = '<small class="text-danger">🔴 Đang ghi âm...</small>';
        }
    } else {
        if (recordButton) {
            recordButton.classList.remove('recording');
            recordButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (topicRecordButton) {
            topicRecordButton.classList.remove('recording');
            topicRecordButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        if (recordingStatus) {
            recordingStatus.innerHTML = '<small class="text-muted">Sẵn sàng ghi âm</small>';
        }
        
        // Reset timer display
        const timeDisplays = ['recordingTime', 'topicRecordingTime'];
        timeDisplays.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '00:00';
        });
    }
}

function startRecordingTimer() {
    recordingTimer = setInterval(() => {
        if (recordingStartTime) {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            const timeString = `${minutes}:${seconds}`;
            
            const timeDisplays = ['recordingTime', 'topicRecordingTime'];
            timeDisplays.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = timeString;
            });
        }
    }, 1000);
}

function saveRecording(audioBlob) {
    const recording = {
        id: Date.now(),
        blob: audioBlob,
        url: URL.createObjectURL(audioBlob),
        date: new Date(),
        mode: currentSpeakingMode,
        topic: currentTopic ? currentTopic.title : null,
        duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0
    };
    
    // Save to session storage (not persistent)
    const recordings = getSessionRecordings();
    recordings.push(recording);
    sessionStorage.setItem('speechRecordings', JSON.stringify(recordings.map(r => ({
        ...r,
        blob: null, // Don't serialize blob
        url: null   // Don't serialize URL
    }))));
      // Add to DOM
    addRecordingToList(recording);
    saveSpeakingSession(recording);
    
    app.showNotification('Đã lưu bản ghi âm!', 'success');
    app.updateStudyStreak();
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        const activityText = recording.topic ? 
            `Ghi âm chủ đề: "${recording.topic}" (${recording.duration}s)` :
            `Ghi âm tự do (${recording.duration}s)`;
        app.addRecentActivity('speaking', activityText, 'fas fa-microphone text-info');
    }
}

function addRecordingToList(recording) {
    const container = document.getElementById('audioContainer');
    if (!container) return;
    
    document.getElementById('recordedAudioList').style.display = 'block';
    
    const audioElement = document.createElement('div');
    audioElement.className = 'audio-item mb-3 p-3 border rounded';
    audioElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <audio controls class="me-3">
                    <source src="${recording.url}" type="audio/wav">
                    Trình duyệt không hỗ trợ phát audio.
                </audio>
                <small class="text-muted d-block">
                    ${app.formatDate(recording.date)} - ${recording.duration}s
                    ${recording.topic ? ` - ${recording.topic}` : ''}
                </small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteRecording(${recording.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.prepend(audioElement);
}

function loadRecordedAudio() {
    const recordings = getSessionRecordings();
    const container = document.getElementById('audioContainer');
    
    if (container) {
        container.innerHTML = '';
        
        if (recordings.length > 0) {
            document.getElementById('recordedAudioList').style.display = 'block';
            // Note: Session recordings won't have audio URLs, so we can only show metadata
            recordings.forEach(recording => {
                const audioElement = document.createElement('div');
                audioElement.className = 'audio-item mb-3 p-3 border rounded';
                audioElement.innerHTML = `
                    <div class="text-muted">
                        <i class="fas fa-microphone"></i>
                        Bản ghi âm - ${app.formatDate(recording.date)}
                        ${recording.topic ? ` - ${recording.topic}` : ''}
                        (${recording.duration}s)
                    </div>
                `;
                container.appendChild(audioElement);
            });
        }
    }
}

function deleteRecording(recordingId) {
    const recordings = getSessionRecordings();
    const index = recordings.findIndex(r => r.id === recordingId);
    
    if (index !== -1) {
        recordings.splice(index, 1);
        sessionStorage.setItem('speechRecordings', JSON.stringify(recordings));
        loadRecordedAudio();
        app.showNotification('Đã xóa bản ghi âm!', 'info');
    }
}

// Topic Speaking Section
function showTopicSpeaking() {
    hideAllSections();
    document.getElementById('topicSpeakingSection').style.display = 'block';
    currentSpeakingMode = 'topic';
    loadSpeakingTopics();
}

function hideTopicSpeaking() {
    document.getElementById('topicSpeakingSection').style.display = 'none';
    document.getElementById('currentTopicDisplay').style.display = 'none';
    currentSpeakingMode = null;
    currentTopic = null;
    stopRecording();
}

function loadSpeakingTopics() {
    const topics = getSpeakingTopics();
    const container = document.getElementById('topicsContainer');
    
    container.innerHTML = topics.map(topic => `
        <div class="col-md-6 mb-3">
            <div class="card topic-card">
                <div class="card-body">
                    <h5 class="card-title">${topic.title}</h5>
                    <p class="card-text text-muted">${topic.description}</p>
                    <span class="badge bg-${topic.level === 'beginner' ? 'success' : topic.level === 'intermediate' ? 'warning' : 'danger'}">
                        ${topic.level}
                    </span>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="selectTopic(${topic.id})">
                            Chọn chủ đề
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function selectTopic(topicId) {
    const topics = getSpeakingTopics();
    currentTopic = topics.find(t => t.id === topicId);
    
    if (!currentTopic) return;
    
    // Hide topics list and show current topic
    document.getElementById('topicsContainer').style.display = 'none';
    document.getElementById('currentTopicDisplay').style.display = 'block';
    
    // Update current topic display
    document.getElementById('currentTopicTitle').textContent = currentTopic.title;
    document.getElementById('currentTopicDescription').textContent = currentTopic.description;
    
    const questionsContainer = document.getElementById('currentTopicQuestions');
    questionsContainer.innerHTML = `
        <h6>Câu hỏi gợi ý:</h6>
        <ul class="list-unstyled">
            ${currentTopic.questions.map(q => `<li class="mb-2">• ${q}</li>`).join('')}
        </ul>
    `;
}

function selectNewTopic() {
    document.getElementById('topicsContainer').style.display = 'block';
    document.getElementById('currentTopicDisplay').style.display = 'none';
    currentTopic = null;
    stopRecording();
}

function toggleTopicRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Pronunciation Practice Section
function showPronunciationPractice() {
    hideAllSections();
    document.getElementById('pronunciationSection').style.display = 'block';
    currentSpeakingMode = 'pronunciation';
    loadNextPronunciationWord();
}

function hidePronunciationPractice() {
    document.getElementById('pronunciationSection').style.display = 'none';
    currentSpeakingMode = null;
    stopRecording();
}

function loadPronunciationWords() {
    // Load from vocabulary if available, otherwise use sample words
    pronunciationWords = app.data.vocabulary.length > 0 
        ? app.data.vocabulary.slice() 
        : getSamplePronunciationWords();
    
    // Shuffle words
    shuffleArray(pronunciationWords);
    currentPronunciationIndex = 0;
}

function loadNextPronunciationWord() {
    if (pronunciationWords.length === 0) {
        loadPronunciationWords();
    }
    
    if (currentPronunciationIndex >= pronunciationWords.length) {
        currentPronunciationIndex = 0;
        shuffleArray(pronunciationWords);
    }
    
    const word = pronunciationWords[currentPronunciationIndex];
    document.getElementById('pronunciationWord').textContent = word.word;
    document.getElementById('pronunciationMeaning').textContent = word.meaning;
}

function nextPronunciationWord() {
    currentPronunciationIndex++;
    loadNextPronunciationWord();
}

function playWordAudio() {
    const word = pronunciationWords[currentPronunciationIndex];
    if (!word) return;
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    } else {
        app.showNotification('Trình duyệt không hỗ trợ text-to-speech!', 'warning');
    }
}

function recordPronunciation() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function markDifficultPronunciation() {
    const word = pronunciationWords[currentPronunciationIndex];
    app.showNotification(`Đã đánh dấu "${word.word}" là khó!`, 'info');
    // You could save this to a difficult words list
    nextPronunciationWord();
}

// Utility Functions
function hideAllSections() {
    const sections = [
        'freeRecordingSection',
        'topicSpeakingSection', 
        'pronunciationSection'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    });
    
    stopRecording();
}

function getSessionRecordings() {
    return JSON.parse(sessionStorage.getItem('speechRecordings') || '[]');
}

function saveSpeakingSession(recording) {
    const sessions = JSON.parse(localStorage.getItem('speakingSessions') || '[]');
    
    const session = {
        id: Date.now(),
        date: new Date(),
        mode: recording.mode,
        topic: recording.topic,
        duration: recording.duration
    };
    
    sessions.push(session);
    localStorage.setItem('speakingSessions', JSON.stringify(sessions));
}

function loadSpeakingHistory() {
    const sessions = JSON.parse(localStorage.getItem('speakingSessions') || '[]');
    const container = document.getElementById('speakingHistory');
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <p class="text-muted">Chưa có lịch sử luyện nói nào. Hãy bắt đầu luyện nói!</p>
        `;
        return;
    }
    
    // Group by date
    const groupedSessions = sessions.reduce((groups, session) => {
        const date = new Date(session.date).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(session);
        return groups;
    }, {});
    
    container.innerHTML = Object.entries(groupedSessions)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([date, sessions]) => `
            <div class="mb-3">
                <h6>${app.formatDate(date)}</h6>
                ${sessions.map(session => `
                    <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-1">
                        <span>
                            <i class="fas fa-${session.mode === 'free' ? 'microphone' : session.mode === 'topic' ? 'comments' : 'volume-up'}"></i>
                            ${session.mode === 'free' ? 'Ghi âm tự do' : 
                              session.mode === 'topic' ? `Chủ đề: ${session.topic}` : 'Luyện phát âm'}
                        </span>
                        <small class="text-muted">${session.duration}s</small>
                    </div>
                `).join('')}
            </div>
        `).join('');
}

function getSpeakingTopics() {
    return [
        {
            id: 1,
            title: 'Giới thiệu bản thân',
            description: 'Luyện tập giới thiệu về bản thân, gia đình và sở thích',
            level: 'beginner',
            questions: [
                'What is your name and where are you from?',
                'Tell me about your family.',
                'What are your hobbies?',
                'What do you do for work or study?'
            ]
        },
        {
            id: 2,
            title: 'Mô tả thành phố của bạn',
            description: 'Mô tả nơi bạn sống, các địa điểm yêu thích',
            level: 'intermediate',
            questions: [
                'Describe your hometown or city.',
                'What do you like most about where you live?',
                'What places would you recommend to visitors?',
                'How has your city changed over the years?'
            ]
        },
        {
            id: 3,
            title: 'Thảo luận về công nghệ',
            description: 'Nói về tác động của công nghệ trong cuộc sống',
            level: 'advanced',
            questions: [
                'How has technology changed our daily lives?',
                'What are the benefits and drawbacks of social media?',
                'Do you think AI will replace human jobs?',
                'How do you see technology evolving in the future?'
            ]
        },
        {
            id: 4,
            title: 'Kế hoạch tương lai',
            description: 'Chia sẻ về những kế hoạch và mơ ước',
            level: 'intermediate',
            questions: [
                'What are your goals for the next year?',
                'Where do you see yourself in 5 years?',
                'What would you like to achieve in your career?',
                'Is there anything you want to learn or improve?'
            ]
        }
    ];
}

function getSamplePronunciationWords() {
    return [
        { word: 'Important', meaning: 'Quan trọng' },
        { word: 'Beautiful', meaning: 'Đẹp' },
        { word: 'Necessary', meaning: 'Cần thiết' },
        { word: 'Interesting', meaning: 'Thú vị' },
        { word: 'Comfortable', meaning: 'Thoải mái' },
        { word: 'Successful', meaning: 'Thành công' },
        { word: 'Pronunciation', meaning: 'Phát âm' },
        { word: 'Communication', meaning: 'Giao tiếp' },
        { word: 'Organization', meaning: 'Tổ chức' },
        { word: 'Understanding', meaning: 'Sự hiểu biết' }
    ];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
