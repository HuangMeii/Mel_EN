// Listening page functionality
let currentListeningType = 'all';
let currentVideo = null;

document.addEventListener('DOMContentLoaded', function() {
    loadListeningContent();
    setupListeningEventListeners();
});

function setupListeningEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchListeningInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchListening, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchListening();
            }
        });
    }
}

function loadListeningContent() {
    const listeningData = getListeningData();
    const container = document.getElementById('listeningContainer');
    
    if (!container) return;
    
    if (listeningData.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-headphones fa-3x text-muted mb-3"></i>
                        <h4>Chưa có nội dung luyện nghe</h4>
                        <p class="text-muted">Bắt đầu bằng cách thêm video hoặc podcast đầu tiên!</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addVideoModal">
                            <i class="fas fa-plus"></i> Thêm nội dung đầu tiên
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let filteredContent = listeningData;
    
    // Filter by type
    if (currentListeningType !== 'all') {
        filteredContent = listeningData.filter(item => item.type === currentListeningType);
    }
    
    container.innerHTML = filteredContent.map(item => createListeningCard(item)).join('');
}

function createListeningCard(item) {
    const levelColors = {
        beginner: 'success',
        intermediate: 'warning',
        advanced: 'danger'
    };
    
    const typeIcons = {
        youtube: 'fab fa-youtube',
        podcast: 'fas fa-podcast',
        ted: 'fas fa-comments',
        news: 'fas fa-newspaper'
    };
    
    const levelNames = {
        beginner: 'Cơ bản',
        intermediate: 'Trung bình',
        advanced: 'Nâng cao'
    };
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card listening-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-primary">
                            <i class="${typeIcons[item.type]}"></i> ${item.type.toUpperCase()}
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editListeningItem(${item.id})">
                                    <i class="fas fa-edit"></i> Chỉnh sửa
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteListeningItem(${item.id})">
                                    <i class="fas fa-trash"></i> Xóa
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text text-muted">${item.description || 'Không có mô tả'}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-${levelColors[item.level]}">
                            ${levelNames[item.level]}
                        </span>
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt"></i>
                            ${app.formatDate(item.dateAdded)}
                        </small>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="playVideo(${item.id})">
                            <i class="fas fa-play"></i> Phát
                        </button>
                        ${item.hasTranscript ? `
                            <button class="btn btn-outline-info btn-sm" onclick="showTranscript(${item.id})">
                                <i class="fas fa-file-text"></i> Xem transcript
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function filterListeningByType(type) {
    currentListeningType = type;
    
    // Update active tab
    document.querySelectorAll('#listeningTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadListeningContent();
}

function searchListening() {
    const query = document.getElementById('searchListeningInput').value.trim().toLowerCase();
    const container = document.getElementById('listeningContainer');
    
    if (!query) {
        loadListeningContent();
        return;
    }
    
    const listeningData = getListeningData();
    const results = listeningData.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.type.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-search fa-2x text-muted mb-3"></i>
                        <h5>Không tìm thấy kết quả</h5>
                        <p class="text-muted">Không có nội dung nào khớp với "${query}"</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.map(item => createListeningCard(item)).join('');
}

function addNewVideo() {
    const title = document.getElementById('videoTitleInput').value.trim();
    const url = document.getElementById('videoUrlInput').value.trim();
    const type = document.getElementById('videoTypeSelect').value;
    const level = document.getElementById('videoLevelSelect').value;
    const transcript = document.getElementById('videoTranscriptInput').value.trim();
    const description = document.getElementById('videoDescriptionInput').value.trim();
    
    if (!title || !url) {
        app.showNotification('Vui lòng nhập tiêu đề và URL!', 'warning');
        return;
    }
    
    // Validate URL
    if (!isValidUrl(url)) {
        app.showNotification('URL không hợp lệ!', 'warning');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        title,
        url,
        type,
        level,
        description,
        transcript,
        hasTranscript: !!transcript,
        dateAdded: new Date(),
        watchTime: 0,
        notes: ''
    };
      // Save to localStorage
    const listeningData = getListeningData();
    listeningData.push(newItem);
    saveListeningData(listeningData);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addVideoModal'));
    modal.hide();
    document.getElementById('addVideoForm').reset();
    
    // Reload list
    loadListeningContent();
    
    app.showNotification(`Đã thêm "${title}" thành công!`, 'success');
    app.updateStudyStreak();
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('listening', `Thêm video/podcast: "${title}"`, 'fas fa-headphones text-primary');
    }
}

function playVideo(itemId) {
    const listeningData = getListeningData();
    const item = listeningData.find(i => i.id === itemId);
    
    if (!item) return;
    
    currentVideo = item;
    
    // Show video player section
    const currentlyPlaying = document.getElementById('currentlyPlaying');
    const listeningContainer = document.getElementById('listeningContainer');
    
    currentlyPlaying.style.display = 'block';
    listeningContainer.style.display = 'none';
    
    // Embed video
    const videoContainer = document.getElementById('videoContainer');
    const embedUrl = getEmbedUrl(item.url);
    
    if (embedUrl) {
        videoContainer.innerHTML = `
            <iframe src="${embedUrl}" 
                    frameborder="0" 
                    allowfullscreen>
            </iframe>
        `;
    } else {
        videoContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Không thể phát video. <a href="${item.url}" target="_blank">Mở trong tab mới</a>
            </div>
        `;
    }
    
    // Load transcript
    const transcriptContent = document.getElementById('transcriptContent');
    if (item.transcript) {
        transcriptContent.innerHTML = `
            <div class="transcript-text">
                ${item.transcript.replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        transcriptContent.innerHTML = `
            <p class="text-muted">Không có transcript cho video này.</p>
        `;
    }
    
    // Load notes
    const videoNotes = document.getElementById('videoNotes');
    videoNotes.value = item.notes || '';
    
    // Add activity tracking for playing video
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('listening', `Xem video: "${item.title}"`, 'fas fa-play text-success');
    }
    
    // Update view count
    item.watchTime = (item.watchTime || 0) + 1;
    saveListeningData(listeningData);
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function hideCurrentVideo() {
    const currentlyPlaying = document.getElementById('currentlyPlaying');
    const listeningContainer = document.getElementById('listeningContainer');
    
    currentlyPlaying.style.display = 'none';
    listeningContainer.style.display = 'block';
    
    currentVideo = null;
}

function saveVideoNotes() {
    if (!currentVideo) return;
    
    const notes = document.getElementById('videoNotes').value.trim();
    
    const listeningData = getListeningData();
    const itemIndex = listeningData.findIndex(i => i.id === currentVideo.id);
    
    if (itemIndex !== -1) {
        listeningData[itemIndex].notes = notes;
        saveListeningData(listeningData);
        currentVideo.notes = notes;
        
        app.showNotification('Đã lưu ghi chú!', 'success');
    }
}

function showTranscript(itemId) {
    const listeningData = getListeningData();
    const item = listeningData.find(i => i.id === itemId);
    
    if (!item || !item.transcript) {
        app.showNotification('Không có transcript cho nội dung này!', 'info');
        return;
    }
    
    // Create transcript modal
    const transcriptModal = document.createElement('div');
    transcriptModal.className = 'modal fade';
    transcriptModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Transcript - ${item.title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="transcript-text" style="max-height: 400px; overflow-y: auto;">
                        ${item.transcript.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(transcriptModal);
    
    const modal = new bootstrap.Modal(transcriptModal);
    modal.show();
    
    // Remove modal after hiding
    transcriptModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(transcriptModal);
    });
}

function deleteListeningItem(itemId) {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    
    const listeningData = getListeningData();
    const itemIndex = listeningData.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return;
    
    const deletedItem = listeningData[itemIndex];
    listeningData.splice(itemIndex, 1);
    saveListeningData(listeningData);
    
    loadListeningContent();
    
    app.showNotification(`Đã xóa "${deletedItem.title}"`, 'info');
}

// Recommendations
function showRecommendations() {
    const listeningContainer = document.getElementById('listeningContainer');
    const recommendationsSection = document.getElementById('recommendationsSection');
    
    listeningContainer.style.display = 'none';
    recommendationsSection.style.display = 'block';
}

function hideRecommendations() {
    const listeningContainer = document.getElementById('listeningContainer');
    const recommendationsSection = document.getElementById('recommendationsSection');
    
    listeningContainer.style.display = 'block';
    recommendationsSection.style.display = 'none';
}

// Listening exercise functionality
let currentExercise = null;
let exerciseAnswers = {};

function showListeningExercise() {
    document.getElementById('listeningContainer').style.display = 'none';
    document.getElementById('currentlyPlaying').style.display = 'none';
    document.getElementById('recommendationsSection').style.display = 'none';
    document.getElementById('listeningExerciseSection').style.display = 'block';
    
    loadRandomListeningExercise();
}

function hideListeningExercise() {
    document.getElementById('listeningExerciseSection').style.display = 'none';
    document.getElementById('listeningContainer').style.display = 'block';
    currentExercise = null;
    exerciseAnswers = {};
}

function loadRandomListeningExercise() {
    const exercises = getListeningExercises();
    const randomIndex = Math.floor(Math.random() * exercises.length);
    currentExercise = exercises[randomIndex];
    
    // Hide audio element and show TTS controls
    updateAudioControlsForTTS();
    
    // Load exercise content
    loadExerciseContent();
    
    // Reset results
    document.getElementById('exerciseResult').innerHTML = '';
    exerciseAnswers = {};
    
    app.showNotification(`📚 Bài tập: "${currentExercise.title}" đã sẵn sàng!`, 'info');
}

function loadExerciseContent() {
    const container = document.getElementById('exerciseContent');
    let content = `
        <h6>${currentExercise.title}</h6>
        <p class="text-muted mb-3">${currentExercise.description}</p>
        <div class="exercise-text">
    `;
    
    // Create fill-in-the-blank text
    currentExercise.text.forEach((sentence, sentenceIndex) => {
        content += `<p class="mb-3">`;
        sentence.words.forEach((word, wordIndex) => {
            if (word.isBlank) {
                const inputId = `word_${sentenceIndex}_${wordIndex}`;
                content += `<input type="text" 
                                  class="form-control d-inline-block mx-1 exercise-input" 
                                  id="${inputId}" 
                                  style="width: ${Math.max(word.answer.length * 10, 80)}px; height: 30px;"
                                  placeholder="___"
                                  data-answer="${word.answer.toLowerCase()}"
                                  data-sentence="${sentenceIndex}"
                                  data-word="${wordIndex}"> `;
            } else {
                content += `${word.text} `;
            }
        });
        content += `</p>`;
    });
    
    content += `</div>`;
    container.innerHTML = content;
}

function playExerciseAudio() {
    if (typeof playTTSAudio === 'function') {
        playTTSAudio();
    } else {
        const audio = document.getElementById('exerciseAudio');
        audio.play();
    }
}

function pauseExerciseAudio() {
    if (typeof stopTTSAudio === 'function') {
        stopTTSAudio();
    } else {
        const audio = document.getElementById('exerciseAudio');
        audio.pause();
    }
}

function replayExerciseAudio() {
    if (typeof playTTSAudio === 'function') {
        playTTSAudio();
    } else {
        const audio = document.getElementById('exerciseAudio');
        audio.currentTime = 0;
        audio.play();
    }
}

function checkListeningAnswer() {
    const inputs = document.querySelectorAll('.exercise-input');
    let correct = 0;
    let total = inputs.length;
    
    inputs.forEach(input => {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = input.dataset.answer;
        
        if (userAnswer === correctAnswer) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            correct++;
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        }
    });
    
    const percentage = Math.round((correct / total) * 100);
    const resultDiv = document.getElementById('exerciseResult');
    
    let resultClass = 'success';
    let resultIcon = 'fas fa-check-circle';
    let resultMessage = 'Xuất sắc!';
    
    if (percentage < 50) {
        resultClass = 'danger';
        resultIcon = 'fas fa-times-circle';
        resultMessage = 'Cần cố gắng thêm!';
    } else if (percentage < 80) {
        resultClass = 'warning';
        resultIcon = 'fas fa-exclamation-circle';
        resultMessage = 'Khá tốt!';
    }
    
    resultDiv.innerHTML = `
        <div class="alert alert-${resultClass}">
            <i class="${resultIcon}"></i>
            <strong>${resultMessage}</strong> Bạn điền đúng ${correct}/${total} từ (${percentage}%)
        </div>
    `;
    
    // Save result and add activity
    if (typeof app !== 'undefined') {
        app.recordExerciseResult('listening', correct, total);
        app.addRecentActivity('listening', `Hoàn thành bài tập nghe: "${currentExercise.title}" - ${percentage}%`, 'fas fa-headphones text-primary');
    }
    
    // Show correct answers after 3 seconds
    setTimeout(() => {
        showCorrectAnswers();
    }, 3000);
}

function showCorrectAnswers() {
    const inputs = document.querySelectorAll('.exercise-input');
    inputs.forEach(input => {
        if (input.classList.contains('is-invalid')) {
            input.setAttribute('placeholder', input.dataset.answer);
        }
    });
}

function showListeningHint() {
    const inputs = document.querySelectorAll('.exercise-input');
    inputs.forEach(input => {
        if (!input.value.trim()) {
            const answer = input.dataset.answer;
            input.setAttribute('placeholder', answer.charAt(0) + '_'.repeat(answer.length - 1));
        }
    });
    
    app.showNotification('💡 Đã hiển thị gợi ý (chữ cái đầu)', 'info');
}

function resetListeningExercise() {
    const inputs = document.querySelectorAll('.exercise-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('is-valid', 'is-invalid');
        input.setAttribute('placeholder', '___');
    });
    
    document.getElementById('exerciseResult').innerHTML = '';
    
    app.showNotification('🔄 Đã reset bài tập', 'info');
}

function getListeningExercises() {
    return [
        {
            id: 1,
            title: "Daily Routine",
            description: "Nghe đoạn hội thoại về sinh hoạt hàng ngày và điền từ còn thiếu.",
            level: "beginner",
            audioUrl: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuV3fPLdiBE",
            text: [
                {
                    words: [
                        { text: "I", isBlank: false },
                        { text: "usually", isBlank: true, answer: "usually" },
                        { text: "wake", isBlank: false },
                        { text: "up", isBlank: false },
                        { text: "at", isBlank: false },
                        { text: "7", isBlank: true, answer: "seven" },
                        { text: "o'clock", isBlank: false },
                        { text: "in", isBlank: false },
                        { text: "the", isBlank: false },
                        { text: "morning.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "After", isBlank: false },
                        { text: "I", isBlank: false },
                        { text: "brush", isBlank: true, answer: "brush" },
                        { text: "my", isBlank: false },
                        { text: "teeth,", isBlank: false },
                        { text: "I", isBlank: false },
                        { text: "have", isBlank: false },
                        { text: "breakfast", isBlank: true, answer: "breakfast" },
                        { text: "with", isBlank: false },
                        { text: "my", isBlank: false },
                        { text: "family.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "Then", isBlank: false },
                        { text: "I", isBlank: false },
                        { text: "go", isBlank: false },
                        { text: "to", isBlank: false },
                        { text: "work", isBlank: true, answer: "work" },
                        { text: "by", isBlank: false },
                        { text: "bus.", isBlank: true, answer: "bus" }
                    ]
                }
            ]
        },
        {
            id: 2,
            title: "Shopping Conversation",
            description: "Cuộc hội thoại tại cửa hàng giữa khách hàng và nhân viên bán hàng.",
            level: "intermediate",
            audioUrl: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuV3fPLdiBE",
            text: [
                {
                    words: [
                        { text: "Excuse", isBlank: false },
                        { text: "me,", isBlank: false },
                        { text: "how", isBlank: true, answer: "how" },
                        { text: "much", isBlank: false },
                        { text: "does", isBlank: false },
                        { text: "this", isBlank: false },
                        { text: "shirt", isBlank: true, answer: "shirt" },
                        { text: "cost?", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "It's", isBlank: false },
                        { text: "twenty", isBlank: true, answer: "twenty" },
                        { text: "dollars,", isBlank: false },
                        { text: "but", isBlank: false },
                        { text: "we", isBlank: false },
                        { text: "have", isBlank: false },
                        { text: "a", isBlank: false },
                        { text: "discount", isBlank: true, answer: "discount" },
                        { text: "today.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "Great!", isBlank: false },
                        { text: "I'll", isBlank: false },
                        { text: "take", isBlank: true, answer: "take" },
                        { text: "two", isBlank: false },
                        { text: "of", isBlank: false },
                        { text: "them,", isBlank: false },
                        { text: "please.", isBlank: true, answer: "please" }
                    ]
                }
            ]
        },
        {
            id: 3,
            title: "Weather Report",
            description: "Dự báo thời tiết và thảo luận về kế hoạch cuối tuần.",
            level: "intermediate",
            audioUrl: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuV3fPLdiBE",
            text: [
                {
                    words: [
                        { text: "The", isBlank: false },
                        { text: "weather", isBlank: true, answer: "weather" },
                        { text: "forecast", isBlank: false },
                        { text: "shows", isBlank: false },
                        { text: "it", isBlank: false },
                        { text: "will", isBlank: false },
                        { text: "be", isBlank: false },
                        { text: "sunny", isBlank: true, answer: "sunny" },
                        { text: "tomorrow.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "The", isBlank: false },
                        { text: "temperature", isBlank: true, answer: "temperature" },
                        { text: "will", isBlank: false },
                        { text: "reach", isBlank: false },
                        { text: "twenty-five", isBlank: true, answer: "twenty-five" },
                        { text: "degrees", isBlank: false },
                        { text: "Celsius.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "It's", isBlank: false },
                        { text: "perfect", isBlank: true, answer: "perfect" },
                        { text: "weather", isBlank: false },
                        { text: "for", isBlank: false },
                        { text: "a", isBlank: false },
                        { text: "picnic", isBlank: true, answer: "picnic" },
                        { text: "in", isBlank: false },
                        { text: "the", isBlank: false },
                        { text: "park.", isBlank: false }
                    ]
                }
            ]
        },
        {
            id: 4,
            title: "Job Interview",
            description: "Cuộc phỏng vấn xin việc - các câu hỏi và trả lời thông dụng.",
            level: "advanced",
            audioUrl: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuV3fPLdiBE",
            text: [
                {
                    words: [
                        { text: "Thank", isBlank: false },
                        { text: "you", isBlank: false },
                        { text: "for", isBlank: false },
                        { text: "coming", isBlank: true, answer: "coming" },
                        { text: "to", isBlank: false },
                        { text: "this", isBlank: false },
                        { text: "interview", isBlank: true, answer: "interview" },
                        { text: "today.", isBlank: false }
                    ]
                },
                {
                    words: [
                        { text: "Can", isBlank: false },
                        { text: "you", isBlank: false },
                        { text: "tell", isBlank: false },
                        { text: "me", isBlank: false },
                        { text: "about", isBlank: false },
                        { text: "your", isBlank: false },
                        { text: "previous", isBlank: true, answer: "previous" },
                        { text: "work", isBlank: false },
                        { text: "experience?", isBlank: true, answer: "experience" }
                    ]
                },
                {
                    words: [
                        { text: "I", isBlank: false },
                        { text: "have", isBlank: false },
                        { text: "three", isBlank: true, answer: "three" },
                        { text: "years", isBlank: false },
                        { text: "of", isBlank: false },
                        { text: "experience", isBlank: false },
                        { text: "in", isBlank: false },
                        { text: "marketing", isBlank: true, answer: "marketing" },
                        { text: "and", isBlank: false },
                        { text: "sales.", isBlank: false }
                    ]
                }
            ]
        }
    ];
}

// Utility functions
function getEmbedUrl(url) {
    // YouTube
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function getListeningData() {
    return JSON.parse(localStorage.getItem('listeningContent') || '[]');
}

function saveListeningData(data) {
    localStorage.setItem('listeningContent', JSON.stringify(data));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sample listening content
function addSampleContent() {
    const sampleContent = [
        {
            id: Date.now(),
            title: 'English Conversation Practice',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            type: 'youtube',
            level: 'beginner',
            description: 'Luyện tập hội thoại tiếng Anh cơ bản',
            transcript: 'Hello, how are you?\nI am fine, thank you. And you?\nI am doing well, thanks for asking.',
            hasTranscript: true,
            dateAdded: new Date(),
            watchTime: 0,
            notes: ''
        },
        {
            id: Date.now() + 1,
            title: 'TED Talk: The Power of Words',
            url: 'https://www.youtube.com/watch?v=example2',
            type: 'ted',
            level: 'advanced',
            description: 'Sức mạnh của ngôn từ trong giao tiếp',
            transcript: '',
            hasTranscript: false,
            dateAdded: new Date(),
            watchTime: 0,
            notes: ''
        }
    ];
    
    const existingData = getListeningData();
    if (existingData.length === 0) {
        saveListeningData(sampleContent);
        loadListeningContent();
        app.showNotification('Đã thêm nội dung mẫu!', 'success');
    }
}

// Initialize with sample data if empty
setTimeout(() => {
    if (getListeningData().length === 0) {
        if (confirm('Bạn có muốn thêm một số nội dung luyện nghe mẫu để bắt đầu?')) {
            addSampleContent();
        }
    }
}, 1000);
