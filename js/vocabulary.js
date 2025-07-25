// Vocabulary page functionality
let currentCategory = 'all';
let flashcardIndex = 0;
let flashcardList = [];
let isFlashcardFlipped = false;

document.addEventListener('DOMContentLoaded', function() {
    loadVocabularyList();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchVocabulary, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchVocabulary();
            }
        });
    }
}

function loadVocabularyList() {
    const vocabulary = app.data.vocabulary;
    const container = document.getElementById('vocabularyContainer');
    
    if (!container) return;
    
    if (vocabulary.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-book fa-3x text-muted mb-3"></i>
                        <h4>Chưa có từ vựng nào</h4>
                        <p class="text-muted">Bắt đầu bằng cách thêm từ vựng đầu tiên của bạn!</p>
                        <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addWordModal">
                            <i class="fas fa-plus"></i> Thêm từ đầu tiên
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let filteredVocabulary = vocabulary;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredVocabulary = vocabulary.filter(word => word.category === currentCategory);
    }
    
    container.innerHTML = filteredVocabulary.map(word => createVocabularyCard(word)).join('');
}

function createVocabularyCard(word) {
    const difficultyColors = {
        easy: 'success',
        medium: 'warning',
        hard: 'danger'
    };
    
    const categoryNames = {
        daily: 'Daily Life',
        business: 'Business',
        travel: 'Travel',
        academic: 'Academic',
        entertainment: 'Entertainment'
    };
    
    const nextReview = new Date(word.nextReview);
    const now = new Date();
    const needsReview = nextReview <= now;
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card vocabulary-card ${needsReview ? 'border-warning' : ''}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="word-category bg-${difficultyColors[word.difficulty]}">
                            ${categoryNames[word.category] || word.category}
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editWord(${word.id})">
                                    <i class="fas fa-edit"></i> Chỉnh sửa
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteWord(${word.id})">
                                    <i class="fas fa-trash"></i> Xóa
                                </a></li>
                            </ul>
                        </div>
                    </div>
                      <h5 class="card-title text-primary d-flex align-items-center justify-content-between">
                        <span>${word.word}</span>
                        <button class="btn btn-outline-primary btn-sm tts-button" onclick="speakWord('${word.word}', this)" title="Phát âm">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </h5>
                    <p class="card-text">
                        <strong>Nghĩa:</strong> ${word.meaning}<br>
                        ${word.example ? `<strong>Ví dụ:</strong> <em>${word.example}</em>` : ''}
                    </p>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i>
                            ${needsReview ? 'Cần ôn tập!' : `Ôn tập: ${app.formatDate(word.nextReview)}`}
                        </small>
                        <div>
                            <span class="badge bg-${difficultyColors[word.difficulty]}">
                                ${word.difficulty}
                            </span>
                            <span class="badge bg-secondary">
                                ${word.reviewCount} lần
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function filterByCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('#categoryTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadVocabularyList();
}

function searchVocabulary() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('vocabularyContainer');
    
    if (!query) {
        loadVocabularyList();
        return;
    }
    
    const results = app.searchVocabulary(query);
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-search fa-2x text-muted mb-3"></i>
                        <h5>Không tìm thấy kết quả</h5>
                        <p class="text-muted">Không có từ vựng nào khớp với "${query}"</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.map(word => createVocabularyCard(word)).join('');
}

function addNewWord() {
    const word = document.getElementById('wordInput').value.trim();
    const meaning = document.getElementById('meaningInput').value.trim();
    const example = document.getElementById('exampleInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const difficulty = document.getElementById('difficultySelect').value;
    
    if (!word || !meaning) {
        app.showNotification('Vui lòng nhập từ vựng và nghĩa!', 'warning');
        return;
    }
    
    // Check if word already exists
    const existingWord = app.data.vocabulary.find(v => 
        v.word.toLowerCase() === word.toLowerCase()
    );
    
    if (existingWord) {
        app.showNotification('Từ vựng này đã tồn tại!', 'warning');
        return;
    }
    
    const newWord = app.addVocabulary({
        word,
        meaning,
        example,
        category,
        difficulty
    });
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addWordModal'));
    modal.hide();
    document.getElementById('addWordForm').reset();
    
    // Reload list
    loadVocabularyList();
    
    app.showNotification(`Đã thêm từ "${word}" thành công!`, 'success');
    app.updateStudyStreak();
}

function editWord(wordId) {
    const word = app.data.vocabulary.find(w => w.id === wordId);
    if (!word) return;
    
    // Fill edit form
    document.getElementById('editWordId').value = word.id;
    document.getElementById('editWordInput').value = word.word;
    document.getElementById('editMeaningInput').value = word.meaning;
    document.getElementById('editExampleInput').value = word.example || '';
    document.getElementById('editCategorySelect').value = word.category;
    document.getElementById('editDifficultySelect').value = word.difficulty;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editWordModal'));
    modal.show();
}

function updateWord() {
    const wordId = parseInt(document.getElementById('editWordId').value);
    const word = document.getElementById('editWordInput').value.trim();
    const meaning = document.getElementById('editMeaningInput').value.trim();
    const example = document.getElementById('editExampleInput').value.trim();
    const category = document.getElementById('editCategorySelect').value;
    const difficulty = document.getElementById('editDifficultySelect').value;
    
    if (!word || !meaning) {
        app.showNotification('Vui lòng nhập từ vựng và nghĩa!', 'warning');
        return;
    }
    
    const wordIndex = app.data.vocabulary.findIndex(w => w.id === wordId);
    if (wordIndex === -1) return;
    
    // Update word
    app.data.vocabulary[wordIndex] = {
        ...app.data.vocabulary[wordIndex],
        word,
        meaning,
        example,
        category,
        difficulty
    };
    
    app.saveData('vocabulary');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editWordModal'));
    modal.hide();
    
    // Reload list
    loadVocabularyList();
    
    app.showNotification('Đã cập nhật từ vựng thành công!', 'success');
}

function deleteWord(wordId) {
    if (!confirm('Bạn có chắc chắn muốn xóa từ vựng này?')) return;
    
    const wordIndex = app.data.vocabulary.findIndex(w => w.id === wordId);
    if (wordIndex === -1) return;
    
    const deletedWord = app.data.vocabulary[wordIndex];
    app.data.vocabulary.splice(wordIndex, 1);
    app.saveData('vocabulary');
    
    loadVocabularyList();
    app.loadUserStats();
    
    app.showNotification(`Đã xóa từ "${deletedWord.word}"`, 'info');
}

// Flashcard functionality
function showFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    flashcardList = [...app.data.vocabulary];
    
    if (flashcardList.length === 0) {
        app.showNotification('Bạn cần thêm từ vựng trước khi sử dụng flashcard!', 'warning');
        return;
    }
    
    // Shuffle the list
    shuffleArray(flashcardList);
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    flashcardIndex = 0;
    loadFlashcard();
}

function hideFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'block';
    flashcardSection.style.display = 'none';
    
    flashcardIndex = 0;
    isFlashcardFlipped = false;
}

function loadFlashcard() {
    if (flashcardIndex >= flashcardList.length) {
        app.showNotification('🎉 Bạn đã ôn tập hết tất cả từ vựng!', 'success');
        hideFlashcards();
        return;
    }
    
    const word = flashcardList[flashcardIndex];
    
    document.getElementById('flashcardWord').textContent = word.word;
    document.getElementById('flashcardMeaning').textContent = word.meaning;
    document.getElementById('flashcardExample').textContent = word.example || '';
    
    document.getElementById('currentCardIndex').textContent = flashcardIndex + 1;
    document.getElementById('totalCards').textContent = flashcardList.length;
    
    // Reset flip state
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    isFlashcardFlipped = false;
}

function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlashcardFlipped = !isFlashcardFlipped;
}

function nextCard() {
    flashcardIndex++;
    loadFlashcard();
}

function markEasy() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, true);
    app.showNotification('Đánh dấu: Dễ ✓', 'success');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Dễ`, 'fas fa-check-circle text-success');
    }
    
    nextCard();
}

function markDifficult() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, false);
    app.showNotification('Đánh dấu: Khó ✗', 'warning');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Khó`, 'fas fa-times-circle text-warning');
    }
    
    nextCard();
}

function startSpacedRepetition() {
    const wordsToReview = app.getVocabularyForReview();
    
    if (wordsToReview.length === 0) {
        app.showNotification('Tuyệt vời! Không có từ nào cần ôn tập hôm nay!', 'success');
        return;
    }
    
    flashcardList = [...wordsToReview];
    flashcardIndex = 0;
    
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    loadFlashcard();
    
    app.showNotification(`Bắt đầu ôn tập ${wordsToReview.length} từ cần review!`, 'info');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Bắt đầu ôn tập ${wordsToReview.length} từ vựng`, 'fas fa-brain text-info');
    }
}

// Text-to-Speech functions for vocabulary
function speakWord(word) {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.speak(word, 0.8, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm từ này', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function speakWordWithExample(word, example) {
    if (typeof ttsHelper !== 'undefined') {
        const textToSpeak = example ? `${word}. ${example}` : word;
        ttsHelper.speak(textToSpeak, 0.7, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function stopTTS() {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.stop();
    }
}

function speakCurrentFlashcard() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWord(currentWord.word);
    }
}

function speakCurrentFlashcardWithExample() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWordWithExample(currentWord.word, currentWord.example);
    }
}

// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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

// Import/Export functionality
function exportVocabulary() {
    const data = JSON.stringify(app.data.vocabulary, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_vocabulary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    app.showNotification('Đã xuất danh sách từ vựng!', 'success');
}

function importVocabulary(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                let addedCount = 0;
                
                importedData.forEach(word => {
                    if (word.word && word.meaning) {
                        const existing = app.data.vocabulary.find(v => 
                            v.word.toLowerCase() === word.word.toLowerCase()
                        );
                        
                        if (!existing) {
                            app.addVocabulary({
                                word: word.word,
                                meaning: word.meaning,
                                example: word.example || '',
                                category: word.category || 'daily',
                                difficulty: word.difficulty || 'medium'
                            });
                            addedCount++;
                        }
                    }
                });
                
                loadVocabularyList();
                app.showNotification(`Đã nhập ${addedCount} từ vựng mới!`, 'success');
            }
        } catch (error) {
            app.showNotification('File không hợp lệ!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Add sample vocabulary for demo
function addSampleVocabulary() {
    const sampleWords = [
        {
            word: 'Abundant',
            meaning: 'Phong phú, dồi dào',
            example: 'The region has abundant natural resources.',
            category: 'academic',
            difficulty: 'medium'
        },
        {
            word: 'Collaborate',
            meaning: 'Hợp tác, cộng tác',
            example: 'We need to collaborate to finish this project.',
            category: 'business',
            difficulty: 'easy'
        },
        {
            word: 'Destination',
            meaning: 'Điểm đến, đích đến',
            example: 'Paris is a popular tourist destination.',
            category: 'travel',
            difficulty: 'easy'
        }
    ];
    
    sampleWords.forEach(word => {
        const existing = app.data.vocabulary.find(v => 
            v.word.toLowerCase() === word.word.toLowerCase()
        );
        
        if (!existing) {
            app.addVocabulary(word);
        }
    });
    
    loadVocabularyList();
    app.showNotification('Đã thêm từ vựng mẫu!', 'success');
}

// Initialize with sample data if empty
if (app.data.vocabulary.length === 0) {
    setTimeout(() => {
        if (confirm('Bạn có muốn thêm một số từ vựng mẫu để bắt đầu?')) {
            addSampleVocabulary();
        }
    }, 1000);
}

// Flashcard functionality
function showFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    flashcardList = [...app.data.vocabulary];
    
    if (flashcardList.length === 0) {
        app.showNotification('Bạn cần thêm từ vựng trước khi sử dụng flashcard!', 'warning');
        return;
    }
    
    // Shuffle the list
    shuffleArray(flashcardList);
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    flashcardIndex = 0;
    loadFlashcard();
}

function hideFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'block';
    flashcardSection.style.display = 'none';
    
    flashcardIndex = 0;
    isFlashcardFlipped = false;
}

function loadFlashcard() {
    if (flashcardIndex >= flashcardList.length) {
        app.showNotification('🎉 Bạn đã ôn tập hết tất cả từ vựng!', 'success');
        hideFlashcards();
        return;
    }
    
    const word = flashcardList[flashcardIndex];
    
    document.getElementById('flashcardWord').textContent = word.word;
    document.getElementById('flashcardMeaning').textContent = word.meaning;
    document.getElementById('flashcardExample').textContent = word.example || '';
    
    document.getElementById('currentCardIndex').textContent = flashcardIndex + 1;
    document.getElementById('totalCards').textContent = flashcardList.length;
    
    // Reset flip state
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    isFlashcardFlipped = false;
}

function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlashcardFlipped = !isFlashcardFlipped;
}

function nextCard() {
    flashcardIndex++;
    loadFlashcard();
}

function markEasy() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, true);
    app.showNotification('Đánh dấu: Dễ ✓', 'success');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Dễ`, 'fas fa-check-circle text-success');
    }
    
    nextCard();
}

function markDifficult() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, false);
    app.showNotification('Đánh dấu: Khó ✗', 'warning');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Khó`, 'fas fa-times-circle text-warning');
    }
    
    nextCard();
}

function startSpacedRepetition() {
    const wordsToReview = app.getVocabularyForReview();
    
    if (wordsToReview.length === 0) {
        app.showNotification('Tuyệt vời! Không có từ nào cần ôn tập hôm nay!', 'success');
        return;
    }
    
    flashcardList = [...wordsToReview];
    flashcardIndex = 0;
    
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    loadFlashcard();
    
    app.showNotification(`Bắt đầu ôn tập ${wordsToReview.length} từ cần review!`, 'info');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Bắt đầu ôn tập ${wordsToReview.length} từ vựng`, 'fas fa-brain text-info');
    }
}

// Text-to-Speech functions for vocabulary
function speakWord(word) {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.speak(word, 0.8, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm từ này', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function speakWordWithExample(word, example) {
    if (typeof ttsHelper !== 'undefined') {
        const textToSpeak = example ? `${word}. ${example}` : word;
        ttsHelper.speak(textToSpeak, 0.7, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function stopTTS() {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.stop();
    }
}

function speakCurrentFlashcard() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWord(currentWord.word);
    }
}

function speakCurrentFlashcardWithExample() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWordWithExample(currentWord.word, currentWord.example);
    }
}

// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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

// Import/Export functionality
function exportVocabulary() {
    const data = JSON.stringify(app.data.vocabulary, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_vocabulary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    app.showNotification('Đã xuất danh sách từ vựng!', 'success');
}

function importVocabulary(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                let addedCount = 0;
                
                importedData.forEach(word => {
                    if (word.word && word.meaning) {
                        const existing = app.data.vocabulary.find(v => 
                            v.word.toLowerCase() === word.word.toLowerCase()
                        );
                        
                        if (!existing) {
                            app.addVocabulary({
                                word: word.word,
                                meaning: word.meaning,
                                example: word.example || '',
                                category: word.category || 'daily',
                                difficulty: word.difficulty || 'medium'
                            });
                            addedCount++;
                        }
                    }
                });
                
                loadVocabularyList();
                app.showNotification(`Đã nhập ${addedCount} từ vựng mới!`, 'success');
            }
        } catch (error) {
            app.showNotification('File không hợp lệ!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Add sample vocabulary for demo
function addSampleVocabulary() {
    const sampleWords = [
        {
            word: 'Abundant',
            meaning: 'Phong phú, dồi dào',
            example: 'The region has abundant natural resources.',
            category: 'academic',
            difficulty: 'medium'
        },
        {
            word: 'Collaborate',
            meaning: 'Hợp tác, cộng tác',
            example: 'We need to collaborate to finish this project.',
            category: 'business',
            difficulty: 'easy'
        },
        {
            word: 'Destination',
            meaning: 'Điểm đến, đích đến',
            example: 'Paris is a popular tourist destination.',
            category: 'travel',
            difficulty: 'easy'
        }
    ];
    
    sampleWords.forEach(word => {
        const existing = app.data.vocabulary.find(v => 
            v.word.toLowerCase() === word.word.toLowerCase()
        );
        
        if (!existing) {
            app.addVocabulary(word);
        }
    });
    
    loadVocabularyList();
    app.showNotification('Đã thêm từ vựng mẫu!', 'success');
}

// Initialize with sample data if empty
if (app.data.vocabulary.length === 0) {
    setTimeout(() => {
        if (confirm('Bạn có muốn thêm một số từ vựng mẫu để bắt đầu?')) {
            addSampleVocabulary();
        }
    }, 1000);
}

// Flashcard functionality
function showFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    flashcardList = [...app.data.vocabulary];
    
    if (flashcardList.length === 0) {
        app.showNotification('Bạn cần thêm từ vựng trước khi sử dụng flashcard!', 'warning');
        return;
    }
    
    // Shuffle the list
    shuffleArray(flashcardList);
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    flashcardIndex = 0;
    loadFlashcard();
}

function hideFlashcards() {
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'block';
    flashcardSection.style.display = 'none';
    
    flashcardIndex = 0;
    isFlashcardFlipped = false;
}

function loadFlashcard() {
    if (flashcardIndex >= flashcardList.length) {
        app.showNotification('🎉 Bạn đã ôn tập hết tất cả từ vựng!', 'success');
        hideFlashcards();
        return;
    }
    
    const word = flashcardList[flashcardIndex];
    
    document.getElementById('flashcardWord').textContent = word.word;
    document.getElementById('flashcardMeaning').textContent = word.meaning;
    document.getElementById('flashcardExample').textContent = word.example || '';
    
    document.getElementById('currentCardIndex').textContent = flashcardIndex + 1;
    document.getElementById('totalCards').textContent = flashcardList.length;
    
    // Reset flip state
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    isFlashcardFlipped = false;
}

function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlashcardFlipped = !isFlashcardFlipped;
}

function nextCard() {
    flashcardIndex++;
    loadFlashcard();
}

function markEasy() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, true);
    app.showNotification('Đánh dấu: Dễ ✓', 'success');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Dễ`, 'fas fa-check-circle text-success');
    }
    
    nextCard();
}

function markDifficult() {
    const word = flashcardList[flashcardIndex];
    app.updateVocabularyReview(word.id, false);
    app.showNotification('Đánh dấu: Khó ✗', 'warning');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Ôn tập từ vựng: "${word.word}" - Khó`, 'fas fa-times-circle text-warning');
    }
    
    nextCard();
}

function startSpacedRepetition() {
    const wordsToReview = app.getVocabularyForReview();
    
    if (wordsToReview.length === 0) {
        app.showNotification('Tuyệt vời! Không có từ nào cần ôn tập hôm nay!', 'success');
        return;
    }
    
    flashcardList = [...wordsToReview];
    flashcardIndex = 0;
    
    const vocabularyList = document.getElementById('vocabularyContainer');
    const flashcardSection = document.getElementById('flashcardSection');
    
    vocabularyList.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    loadFlashcard();
    
    app.showNotification(`Bắt đầu ôn tập ${wordsToReview.length} từ cần review!`, 'info');
    
    // Add activity tracking
    if (typeof app.addRecentActivity === 'function') {
        app.addRecentActivity('vocabulary', `Bắt đầu ôn tập ${wordsToReview.length} từ vựng`, 'fas fa-brain text-info');
    }
}

// Text-to-Speech functions for vocabulary
function speakWord(word) {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.speak(word, 0.8, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm từ này', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function speakWordWithExample(word, example) {
    if (typeof ttsHelper !== 'undefined') {
        const textToSpeak = example ? `${word}. ${example}` : word;
        ttsHelper.speak(textToSpeak, 0.7, 1).catch(error => {
            console.error('TTS Error:', error);
            app.showNotification('Không thể phát âm', 'warning');
        });
    } else {
        app.showNotification('Chức năng phát âm chưa sẵn sàng', 'warning');
    }
}

function stopTTS() {
    if (typeof ttsHelper !== 'undefined') {
        ttsHelper.stop();
    }
}

function speakCurrentFlashcard() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWord(currentWord.word);
    }
}

function speakCurrentFlashcardWithExample() {
    const currentWord = flashcardList[flashcardIndex];
    if (currentWord) {
        speakWordWithExample(currentWord.word, currentWord.example);
    }
}

// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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

// Import/Export functionality
function exportVocabulary() {
    const data = JSON.stringify(app.data.vocabulary, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_vocabulary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    app.showNotification('Đã xuất danh sách từ vựng!', 'success');
}

function importVocabulary(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                let addedCount = 0;
                
                importedData.forEach(word => {
                    if (word.word && word.meaning) {
                        const existing = app.data.vocabulary.find(v => 
                            v.word.toLowerCase() === word.word.toLowerCase()
                        );
                        
                        if (!existing) {
                            app.addVocabulary({
                                word: word.word,
                                meaning: word.meaning,
                                example: word.example || '',
                                category: word.category || 'daily',
                                difficulty: word.difficulty || 'medium'
                            });
                            addedCount++;
                        }
                    }
                });
                
                loadVocabularyList();
                app.showNotification(`Đã nhập ${addedCount} từ vựng mới!`, 'success');
            }
        } catch (error) {
            app.showNotification('File không hợp lệ!', 'danger');
        }
    };
    reader.readAsText(file);
}

// Add sample vocabulary for demo
function addSampleVocabulary() {
    const sampleWords = [
        {
            word: 'Abundant',
            meaning: 'Phong phú, dồi dào',
            example: 'The region has abundant natural resources.',
            category: 'academic',
            difficulty: 'medium'
        },
        {
            word: 'Collaborate',
            meaning: 'Hợp tác, cộng tác',
            example: 'We need to collaborate to finish this project.',
            category: 'business',
            difficulty: 'easy'
        },
        {
            word: 'Destination',
            meaning: 'Điểm đến, đích đến',
            example: 'Paris is a popular tourist destination.',
            category: 'travel',
            difficulty: 'easy'
        }
    ];
    
    sampleWords.forEach(word => {
        const existing = app.data.vocabulary.find(v => 
            v.word.toLowerCase() === word.word.toLowerCase()
        );
        
        if (!existing) {
            app.addVocabulary(word);
        }
    });
    
    loadVocabularyList();
    app.showNotification('Đã thêm từ vựng mẫu!', 'success');
}

// Initialize with sample data if empty
if (app.data.vocabulary.length === 0) {
    setTimeout(() => {
        if (confirm('Bạn có muốn thêm một số từ vựng mẫu để bắt đầu?')) {
            addSampleVocabulary();
        }
    }, 1000);
}

// Pronunciation test function
function testPronunciation(inputId, buttonElement = null) {
    const input = document.getElementById(inputId);
    const word = input.value.trim();
    
    if (!word) {
        app.showNotification('Vui lòng nhập từ để test phát âm', 'warning');
        return;
    }
    
    speakWord(word, buttonElement);
}
