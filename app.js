// Global application state and utilities
class EnglishLearnerApp {
    constructor() {
        this.data = {
            vocabulary: JSON.parse(localStorage.getItem('vocabulary') || '[]'),
            grammar: JSON.parse(localStorage.getItem('grammar') || '[]'),
            progress: JSON.parse(localStorage.getItem('progress') || '{}'),
            exercises: JSON.parse(localStorage.getItem('exercises') || '[]'),
            settings: JSON.parse(localStorage.getItem('settings') || '{}')
        };
        
        this.init();
    }

    init() {
        this.initProgress();
        this.bindEvents();
    }

    initProgress() {
        if (!this.data.progress.lessonsCompleted) {
            this.data.progress = {
                lessonsCompleted: 0,
                vocabularyCount: 0,
                totalScore: 0,
                studyStreak: 0,
                lastStudyDate: null,
                dailyGoal: 20, // từ vựng mỗi ngày
                weeklyGoal: 140
            };
            this.saveData('progress');
        }
    }    bindEvents() {
        // Add global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.updateCurrentDate();
            this.loadUserStats();
            this.checkStudyStreak();
            
            // Auto update streak when user performs study activities
            this.setupActivityListeners();
        });
    }

    setupActivityListeners() {
        // Listen for study activities
        document.addEventListener('studyActivity', () => {
            this.updateStudyStreak();
        });
    }    // Trigger study activity event
    triggerStudyActivity(activityType) {
        this.updateStudyStreak();
        this.addStudyToCalendar(); // Add to calendar
        
        // Recalculate streak based on all activities
        this.recalculateStreak();
        
        // Dispatch custom event
        const event = new CustomEvent('studyActivity', {
            detail: { type: activityType, timestamp: new Date() }
        });
        document.dispatchEvent(event);
    }

    // Calendar integration
    addStudyToCalendar(date = new Date()) {
        const dateString = date.toISOString().split('T')[0];
        const studyHistory = JSON.parse(localStorage.getItem('studyHistory') || '[]');
        
        if (!studyHistory.includes(dateString)) {
            studyHistory.push(dateString);
            localStorage.setItem('studyHistory', JSON.stringify(studyHistory));
            
            // Refresh calendar if function exists
            if (typeof createMiniCalendar === 'function') {
                createMiniCalendar();
            }
        }
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }

    loadUserStats() {
        const progress = this.data.progress;
        
        // Update stats on dashboard
        this.updateElement('lessonsCompleted', progress.lessonsCompleted || 0);
        this.updateElement('vocabularyCount', this.data.vocabulary.length || 0);
        this.updateElement('totalScore', progress.totalScore || 0);
        this.updateElement('studyStreak', progress.studyStreak || 0);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            // Add animation
            element.style.opacity = '0';
            setTimeout(() => {
                element.textContent = value;
                element.style.opacity = '1';
            }, 100);
        }
    }

    // Data management methods
    saveData(type) {
        localStorage.setItem(type, JSON.stringify(this.data[type]));
    }    addVocabulary(word) {
        const vocabulary = {
            id: Date.now(),
            word: word.word,
            meaning: word.meaning,
            example: word.example,
            category: word.category,
            difficulty: word.difficulty || 'easy',
            learned: false,
            reviewCount: 0,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
            dateAdded: new Date(),
            lastReviewed: null
        };
          this.data.vocabulary.push(vocabulary);
        this.saveData('vocabulary');
        this.updateProgress('vocabularyCount');
        this.triggerStudyActivity('vocabulary');
        this.addRecentActivity('vocabulary', `Thêm từ vựng mới: "${word.word}"`, 'fas fa-book text-success');
        return vocabulary;
    }    addGrammarNote(note) {
        const grammarNote = {
            id: Date.now(),
            title: note.title,
            content: note.content,
            examples: note.examples || [],
            category: note.category,
            difficulty: note.difficulty || 'intermediate',
            dateAdded: new Date()
        };
          this.data.grammar.push(grammarNote);
        this.saveData('grammar');
        this.triggerStudyActivity('grammar');
        this.addRecentActivity('grammar', `Thêm ghi chú ngữ pháp: "${note.title}"`, 'fas fa-pencil-alt text-primary');
        return grammarNote;
    }

    updateProgress(type, value = 1) {
        if (!this.data.progress[type]) {
            this.data.progress[type] = 0;
        }
        
        if (type === 'vocabularyCount') {
            this.data.progress[type] = this.data.vocabulary.length;
        } else {
            this.data.progress[type] += value;
        }
        
        this.saveData('progress');
        this.loadUserStats();
    }

    // Spaced repetition algorithm
    getVocabularyForReview() {
        const now = new Date();
        return this.data.vocabulary.filter(word => 
            new Date(word.nextReview) <= now
        );
    }

    updateVocabularyReview(wordId, correct) {
        const word = this.data.vocabulary.find(w => w.id === wordId);
        if (!word) return;

        word.reviewCount++;
        word.lastReviewed = new Date();

        // Spaced repetition intervals (in days)
        const intervals = [1, 3, 7, 14, 30, 90];
        let nextInterval = 1;

        if (correct) {
            const currentInterval = Math.min(word.reviewCount, intervals.length - 1);
            nextInterval = intervals[currentInterval];
        } else {
            // Reset if answered incorrectly
            nextInterval = 1;
            word.reviewCount = 0;
        }

        word.nextReview = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
        this.saveData('vocabulary');
    }    // Exercise tracking
    recordExerciseResult(exerciseType, score, maxScore) {
        const result = {
            id: Date.now(),
            type: exerciseType,
            score: score,
            maxScore: maxScore,
            percentage: Math.round((score / maxScore) * 100),
            date: new Date()
        };        this.data.exercises.push(result);
        this.updateProgress('totalScore', score);
        this.saveData('exercises');
        this.triggerStudyActivity('exercise');
        this.addRecentActivity('exercise', `Hoàn thành bài ${exerciseType} - Điểm: ${score}/${maxScore} (${result.percentage}%)`, 'fas fa-trophy text-warning');
        return result;
    }    // Study streak management
    updateStudyStreak() {
        const today = new Date().toDateString();
        const lastStudyDate = this.data.progress.lastStudyDate;

        if (lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            if (lastStudyDate === yesterdayString) {
                // Consecutive day - increment streak
                this.data.progress.studyStreak = (this.data.progress.studyStreak || 0) + 1;
            } else if (!lastStudyDate || lastStudyDate !== today) {
                // First time or broken streak - start fresh
                this.data.progress.studyStreak = 1;
            }

            this.data.progress.lastStudyDate = today;
            this.saveData('progress');
            this.loadUserStats();
            
            // Show streak notification
            if (this.data.progress.studyStreak > 1) {
                this.showNotification(`🔥 Streak: ${this.data.progress.studyStreak} ngày liên tiếp!`, 'success');
            } else {
                this.showNotification(`🌟 Bắt đầu streak mới!`, 'info');
            }
        }
    }

    // Calculate streak based on study history
    calculateStreakFromHistory() {
        // Get all study dates from different sources
        const studyDates = new Set();
        
        // Add dates from vocabulary
        this.data.vocabulary.forEach(word => {
            const date = new Date(word.dateAdded).toISOString().split('T')[0];
            studyDates.add(date);
        });
        
        // Add dates from grammar
        this.data.grammar.forEach(note => {
            const date = new Date(note.dateAdded).toISOString().split('T')[0];
            studyDates.add(date);
        });
        
        // Add dates from test results
        const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
        testResults.forEach(result => {
            const date = new Date(result.date).toISOString().split('T')[0];
            studyDates.add(date);
        });
        
        // Add dates from study history
        const studyHistory = JSON.parse(localStorage.getItem('studyHistory') || '[]');
        studyHistory.forEach(date => {
            studyDates.add(date);
        });
        
        // Convert to sorted array (newest first)
        const sortedDates = Array.from(studyDates).sort((a, b) => new Date(b) - new Date(a));
        
        if (sortedDates.length === 0) {
            return 0;
        }
        
        const today = new Date().toISOString().split('T')[0];
        let streak = 0;
        let currentDate = new Date();
        
        // Check from today backwards
        for (let i = 0; i < 365; i++) { // Check up to 1 year back
            const dateStr = currentDate.toISOString().split('T')[0];
            
            if (studyDates.has(dateStr)) {
                streak++;
            } else {
                // If we haven't started counting yet (no activity today), continue
                if (streak === 0 && dateStr === today) {
                    // No activity today, continue to yesterday
                } else {
                    // Streak is broken
                    break;
                }
            }
            
            // Move to previous day
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }

    // Recalculate and update streak
    recalculateStreak() {
        const newStreak = this.calculateStreakFromHistory();
        this.data.progress.studyStreak = newStreak;
        this.saveData('progress');
        this.loadUserStats();
        
        // Update currentStreak element if it exists
        const currentStreakElement = document.getElementById('currentStreak');
        if (currentStreakElement) {
            currentStreakElement.textContent = newStreak;
        }
        
        console.log(`Streak recalculated: ${newStreak} days`);
        return newStreak;
    }    // Initialize or check study streak on app start
    checkStudyStreak() {
        // Recalculate streak from history on app start
        this.recalculateStreak();
    }

    // Recent activity tracking
    addRecentActivity(type, description, icon = 'fas fa-check-circle text-success') {
        const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        
        const newActivity = {
            id: Date.now(),
            type: type,
            description: description,
            icon: icon,
            timestamp: new Date(),
            timeAgo: this.getTimeAgo(new Date())
        };
        
        // Add to beginning of array
        activities.unshift(newActivity);
        
        // Keep only last 10 activities
        if (activities.length > 10) {
            activities.splice(10);
        }
        
        localStorage.setItem('recentActivities', JSON.stringify(activities));
        
        // Update recent activity display if function exists
        if (typeof loadRecentActivity === 'function') {
            loadRecentActivity();
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return this.formatDate(date);
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 80px; right: 20px; z-index: 1050; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Search functionality
    searchVocabulary(query) {
        return this.data.vocabulary.filter(word =>
            word.word.toLowerCase().includes(query.toLowerCase()) ||
            word.meaning.toLowerCase().includes(query.toLowerCase()) ||
            word.category.toLowerCase().includes(query.toLowerCase())
        );
    }

    searchGrammar(query) {
        return this.data.grammar.filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.category.toLowerCase().includes(query.toLowerCase())
        );
    }
}

// Initialize the app
const app = new EnglishLearnerApp();

// Global utility functions
function continueLastLesson() {
    app.showNotification('Đang tải bài học cuối cùng...', 'info');
    // Simulate loading
    setTimeout(() => {
        window.location.href = 'vocabulary.html';
    }, 1000);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Load dark mode preference
document.addEventListener('DOMContentLoaded', () => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
});

// Export for use in other files
window.EnglishLearnerApp = app;
