/**
 * EnglishLearner App - Core Application Module
 * Main application logic and data management
 */

class EnglishLearnerApp {
    constructor() {
        this.data = {
            vocabulary: [],
            grammar: [],
            exercises: [],
            listening: [],
            speaking: [],
            progress: {
                totalScore: 0,
                lessonsCompleted: 0,
                studyStreak: 0,
                lastStudyDate: null,
                activities: []
            },
            settings: {
                language: 'vi',
                theme: 'light',
                notifications: true,
                autoSave: true,
                ttsRate: 0.8,
                ttsVoice: null
            }
        };
        
        this.storageKey = 'englishlearner_data';
        this.nextId = 1;
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.loadUserStats();
        this.checkStudyStreak();
        
        // Auto-save every 30 seconds
        if (this.data.settings.autoSave) {
            setInterval(() => this.saveAllData(), 30000);
        }
        
        console.log('🎓 EnglishLearner App initialized successfully');
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle page visibility changes for auto-save
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAllData();
            }
        });
        
        // Handle before page unload
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
        
        // Handle storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadData();
                this.loadUserStats();
            }
        });
    }
    
    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.data = { ...this.data, ...parsedData };
                
                // Find the next available ID
                const allItems = [
                    ...this.data.vocabulary,
                    ...this.data.grammar,
                    ...this.data.exercises
                ];
                
                if (allItems.length > 0) {
                    this.nextId = Math.max(...allItems.map(item => item.id || 0)) + 1;
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Lỗi tải dữ liệu, sử dụng dữ liệu mặc định', 'warning');
        }
    }
    
    /**
     * Save all data to localStorage
     */
    saveAllData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Lỗi lưu dữ liệu!', 'danger');
            return false;
        }
    }
    
    /**
     * Save specific data type
     */
    saveData(type) {
        return this.saveAllData();
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return this.nextId++;
    }
    
    /**
     * Update current date display
     */
    updateCurrentDate() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateElement.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }
    
    /**
     * Load and display user statistics
     */
    loadUserStats() {
        // Update vocabulary count
        const vocabCountElement = document.getElementById('vocabularyCount');
        if (vocabCountElement) {
            vocabCountElement.textContent = this.data.vocabulary.length;
        }
        
        // Update lessons completed
        const lessonsCompletedElement = document.getElementById('lessonsCompleted');
        if (lessonsCompletedElement) {
            lessonsCompletedElement.textContent = this.data.progress.lessonsCompleted;
        }
        
        // Update total score
        const totalScoreElement = document.getElementById('totalScore');
        if (totalScoreElement) {
            totalScoreElement.textContent = this.data.progress.totalScore;
        }
        
        // Update study streak
        const studyStreakElement = document.getElementById('studyStreak');
        const currentStreakElement = document.getElementById('currentStreak');
        
        if (studyStreakElement) {
            studyStreakElement.textContent = this.data.progress.studyStreak;
        }
        if (currentStreakElement) {
            currentStreakElement.textContent = this.data.progress.studyStreak;
        }
    }
    
    /**
     * Check and update study streak
     */
    checkStudyStreak() {
        const today = new Date().toDateString();
        const lastStudyDate = this.data.progress.lastStudyDate;
        
        if (lastStudyDate) {
            const lastDate = new Date(lastStudyDate);
            const todayDate = new Date(today);
            const diffTime = todayDate - lastDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                // Streak broken
                this.data.progress.studyStreak = 0;
                this.saveData('progress');
            }
        }
    }
    
    /**
     * Update study streak
     */
    updateStudyStreak() {
        const today = new Date().toDateString();
        const lastStudyDate = this.data.progress.lastStudyDate;
        
        if (lastStudyDate !== today) {
            this.data.progress.studyStreak++;
            this.data.progress.lastStudyDate = today;
            this.saveData('progress');
            this.loadUserStats();
        }
    }
    
    /**
     * Recalculate study streak based on activities
     */
    recalculateStreak() {
        const activities = this.data.progress.activities || [];
        const sortedActivities = activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (let activity of sortedActivities) {
            const activityDate = new Date(activity.date);
            activityDate.setHours(0, 0, 0, 0);
            
            const diffTime = currentDate - activityDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (diffDays > streak) {
                break;
            }
        }
        
        this.data.progress.studyStreak = streak;
        this.saveData('progress');
        this.loadUserStats();
        this.showNotification(`Đã tính lại streak: ${streak} ngày`, 'info');
    }
    
    /**
     * Add vocabulary word
     */
    addVocabulary(wordData) {
        const newWord = {
            id: this.generateId(),
            word: wordData.word,
            meaning: wordData.meaning,
            example: wordData.example || '',
            category: wordData.category || 'daily',
            difficulty: wordData.difficulty || 'medium',
            dateAdded: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            nextReview: new Date().toISOString(),
            easeFactor: 2.5,
            interval: 1
        };
        
        this.data.vocabulary.push(newWord);
        this.saveData('vocabulary');
        this.loadUserStats();
        this.updateStudyStreak();
        
        // Add activity
        this.addRecentActivity('vocabulary', `Thêm từ vựng mới: "${wordData.word}"`, 'fas fa-plus text-success');
        
        return newWord;
    }
    
    /**
     * Search vocabulary
     */
    searchVocabulary(query) {
        const searchTerm = query.toLowerCase();
        return this.data.vocabulary.filter(word => 
            word.word.toLowerCase().includes(searchTerm) ||
            word.meaning.toLowerCase().includes(searchTerm) ||
            (word.example && word.example.toLowerCase().includes(searchTerm))
        );
    }
    
    /**
     * Get vocabulary for review (spaced repetition)
     */
    getVocabularyForReview() {
        const now = new Date();
        return this.data.vocabulary.filter(word => new Date(word.nextReview) <= now);
    }
    
    /**
     * Update vocabulary review using spaced repetition algorithm
     */
    updateVocabularyReview(wordId, isCorrect) {
        const wordIndex = this.data.vocabulary.findIndex(word => word.id === wordId);
        if (wordIndex === -1) return;
        
        const word = this.data.vocabulary[wordIndex];
        word.reviewCount++;
        
        if (isCorrect) {
            word.correctCount++;
            
            // Increase interval based on ease factor
            if (word.reviewCount === 1) {
                word.interval = 1;
            } else if (word.reviewCount === 2) {
                word.interval = 6;
            } else {
                word.interval = Math.round(word.interval * word.easeFactor);
            }
            
            // Increase ease factor for correct answers
            word.easeFactor = Math.max(1.3, word.easeFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)));
        } else {
            // Reset interval for incorrect answers
            word.interval = 1;
            word.easeFactor = Math.max(1.3, word.easeFactor - 0.2);
        }
        
        // Set next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + word.interval);
        word.nextReview = nextReview.toISOString();
        
        this.saveData('vocabulary');
    }
    
    /**
     * Add recent activity
     */
    addRecentActivity(type, description, icon = 'fas fa-info-circle') {
        const activity = {
            id: this.generateId(),
            type,
            description,
            icon,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.data.progress.activities = this.data.progress.activities || [];
        this.data.progress.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.data.progress.activities.length > 50) {
            this.data.progress.activities = this.data.progress.activities.slice(0, 50);
        }
        
        this.saveData('progress');
        this.updateRecentActivityDisplay();
    }
    
    /**
     * Update recent activity display
     */
    updateRecentActivityDisplay() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const activities = this.data.progress.activities || [];
        const recentActivities = activities.slice(0, 5);
        
        if (recentActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-history fa-2x mb-2"></i>
                    <p>Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span>${activity.description}</span>
                <small class="text-muted">${this.getTimeAgo(activity.date)}</small>
            </div>
        `).join('');
    }
    
    /**
     * Get time ago format
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) {
            return 'Vừa xong';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else {
            return `${diffDays} ngày trước`;
        }
    }
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.app-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `app-notification alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${iconMap[type]} me-2"></i>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }
    
    /**
     * Export data
     */
    exportData() {
        const exportData = {
            vocabulary: this.data.vocabulary,
            progress: this.data.progress,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `englishlearner_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Đã xuất dữ liệu thành công!', 'success');
    }
    
    /**
     * Import data
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (importedData.vocabulary) {
                        this.data.vocabulary = [...this.data.vocabulary, ...importedData.vocabulary];
                    }
                    
                    if (importedData.progress) {
                        // Merge progress data carefully
                        this.data.progress.totalScore += importedData.progress.totalScore || 0;
                        this.data.progress.lessonsCompleted += importedData.progress.lessonsCompleted || 0;
                        
                        if (importedData.progress.activities) {
                            this.data.progress.activities = [
                                ...this.data.progress.activities,
                                ...importedData.progress.activities
                            ];
                        }
                    }
                    
                    this.saveAllData();
                    this.loadUserStats();
                    
                    this.showNotification('Đã nhập dữ liệu thành công!', 'success');
                    resolve(importedData);
                } catch (error) {
                    this.showNotification('File không hợp lệ!', 'danger');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                this.showNotification('Lỗi đọc file!', 'danger');
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Reset all data
     */
    resetData() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
            localStorage.removeItem(this.storageKey);
            location.reload();
        }
    }
    
    /**
     * Get learning statistics
     */
    getStatistics() {
        const stats = {
            vocabulary: {
                total: this.data.vocabulary.length,
                learned: this.data.vocabulary.filter(w => w.reviewCount > 0).length,
                mastered: this.data.vocabulary.filter(w => w.correctCount >= 3).length,
                needReview: this.getVocabularyForReview().length
            },
            progress: {
                totalScore: this.data.progress.totalScore,
                lessonsCompleted: this.data.progress.lessonsCompleted,
                studyStreak: this.data.progress.studyStreak,
                activeDays: this.getActiveDays()
            }
        };
        
        return stats;
    }
    
    /**
     * Get number of active study days
     */
    getActiveDays() {
        const activities = this.data.progress.activities || [];
        const uniqueDates = new Set();
        
        activities.forEach(activity => {
            const date = new Date(activity.date).toDateString();
            uniqueDates.add(date);
        });
        
        return uniqueDates.size;
    }
}

// Quick action functions
function continueLastLesson() {
    const lastActivity = app.data.progress.activities?.[0];
    
    if (lastActivity) {
        switch (lastActivity.type) {
            case 'vocabulary':
                window.location.href = 'vocabulary.html';
                break;
            case 'grammar':
                window.location.href = 'grammar.html';
                break;
            case 'listening':
                window.location.href = 'listening.html';
                break;
            case 'speaking':
                window.location.href = 'speaking.html';
                break;
            default:
                window.location.href = 'exercises.html';
        }
    } else {
        window.location.href = 'vocabulary.html';
    }
}

// Initialize app when DOM is loaded
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new EnglishLearnerApp();
    
    // Update recent activities display if on dashboard
    if (document.getElementById('recentActivity')) {
        app.updateRecentActivityDisplay();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnglishLearnerApp;
}
