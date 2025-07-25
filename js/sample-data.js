// Sample data for demonstration
function initializeSampleData() {
    // Check if data already exists
    const existingVocab = JSON.parse(localStorage.getItem('vocabulary') || '[]');
    const existingGrammar = JSON.parse(localStorage.getItem('grammar') || '[]');
    
    if (existingVocab.length === 0) {        // Add sample vocabulary
        const sampleVocab = [
            {
                id: 1,
                word: "Amazing",
                meaning: "Tuyệt vời, đáng kinh ngạc",
                example: "The view from the mountain was amazing.",
                category: "Adjective",
                difficulty: "easy",
                learned: false,
                reviewCount: 0,
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-04'),
                lastReviewed: null
            },
            {
                id: 2,
                word: "Confident",
                meaning: "Tự tin",
                example: "She felt confident before the presentation.",
                category: "Adjective",
                difficulty: "intermediate",
                learned: true,
                reviewCount: 3,
                nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-05'),
                lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                id: 3,
                word: "Acknowledge",
                meaning: "Thừa nhận, công nhận",
                example: "He acknowledged his mistake.",
                category: "Verb",
                difficulty: "advanced",
                learned: false,
                reviewCount: 1,
                nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-06'),
                lastReviewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: 4,
                word: "Brilliant",
                meaning: "Xuất sắc, rực rỡ",
                example: "That's a brilliant idea!",
                category: "Adjective",
                difficulty: "intermediate",
                learned: false,
                reviewCount: 0,
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-07'),
                lastReviewed: null
            },
            {
                id: 5,
                word: "Opportunity",
                meaning: "Cơ hội",
                example: "This is a great opportunity to learn.",
                category: "Noun",
                difficulty: "intermediate",
                learned: true,
                reviewCount: 2,
                nextReview: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-08'),
                lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                id: 6,
                word: "Excellence",
                meaning: "Sự xuất sắc",
                example: "She achieved excellence in her studies.",
                category: "Noun",
                difficulty: "intermediate",
                learned: true,
                reviewCount: 1,
                nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-09'),
                lastReviewed: new Date()
            },
            {
                id: 7,
                word: "Efficient",
                meaning: "Hiệu quả",
                example: "This is a very efficient method.",
                category: "Adjective",
                difficulty: "intermediate",
                learned: false,
                reviewCount: 0,
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
                dateAdded: new Date('2025-06-10'),
                lastReviewed: null
            }
        ];
        
        localStorage.setItem('vocabulary', JSON.stringify(sampleVocab));
    }
    
    if (existingGrammar.length === 0) {
        // Add sample grammar notes
        const sampleGrammar = [
            {
                id: 1,
                title: "Present Perfect Tense",
                content: "Thì hiện tại hoàn thành diễn tả hành động đã xảy ra trong quá khứ nhưng có liên quan đến hiện tại.",
                examples: [
                    "I have lived here for 5 years.",
                    "She has finished her homework.",
                    "We have never been to Japan."
                ],
                category: "Tenses",
                difficulty: "intermediate",                dateAdded: new Date('2025-06-06')
            },
            {
                id: 2,
                title: "Modal Verbs",
                content: "Động từ khuyết thiếu (can, could, may, might, must, should, will, would) được dùng để diễn tả khả năng, sự cho phép, nghĩa vụ.",
                examples: [
                    "You can speak English well.",
                    "I should study harder.",
                    "We must finish this project."
                ],
                category: "Grammar",
                difficulty: "intermediate",
                dateAdded: new Date('2025-06-08')
            },
            {
                id: 3,
                title: "Conditional Sentences",
                content: "Câu điều kiện có 4 loại: Type 0 (sự thật hiển nhiên), Type 1 (có thể xảy ra), Type 2 (không có thật ở hiện tại), Type 3 (không có thật trong quá khứ).",
                examples: [
                    "If it rains, I will stay home. (Type 1)",
                    "If I were rich, I would travel the world. (Type 2)",
                    "If I had studied harder, I would have passed. (Type 3)"
                ],
                category: "Grammar",
                difficulty: "advanced",
                dateAdded: new Date('2025-06-09')
            }
        ];
        
        localStorage.setItem('grammar', JSON.stringify(sampleGrammar));
    }
    
    // Initialize progress if not exists
    const existingProgress = JSON.parse(localStorage.getItem('progress') || '{}');
    if (!existingProgress.lessonsCompleted) {
        const sampleProgress = {
            lessonsCompleted: 12,
            vocabularyCount: 5,
            totalScore: 420,
            studyStreak: 3,
            lastStudyDate: new Date().toDateString(),
            dailyGoal: 20,
            weeklyGoal: 140
        };
        
        localStorage.setItem('progress', JSON.stringify(sampleProgress));
    }
      // Initialize study history for calendar
    const existingHistory = JSON.parse(localStorage.getItem('studyHistory') || '[]');
    if (existingHistory.length === 0) {
        const sampleHistory = [];
        const now = new Date();
        
        // Add study dates for the last 7 days (June 4-10, 2025)
        const studyDates = [
            '2025-06-04', '2025-06-05', '2025-06-06', 
            '2025-06-07', '2025-06-08', '2025-06-09', '2025-06-10'
        ];
        
        studyDates.forEach(date => {
            sampleHistory.push(date);
        });
        
        localStorage.setItem('studyHistory', JSON.stringify(sampleHistory));
        
        console.log('Sample study history created:', sampleHistory);
    }
    
    // Initialize sample exercise results
    const existingExercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    if (existingExercises.length === 0) {
        const sampleExercises = [
            {
                id: 1,
                type: "vocabulary",
                score: 8,
                maxScore: 10,
                percentage: 80,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                id: 2,
                type: "grammar",
                score: 15,
                maxScore: 20,
                percentage: 75,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: 3,
                type: "listening",
                score: 12,
                maxScore: 15,
                percentage: 80,
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
        ];
        
        localStorage.setItem('exercises', JSON.stringify(sampleExercises));
    }
    
    // Initialize sample recent activities
    const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    if (existingActivities.length === 0) {
        const sampleActivities = [
            {
                id: Date.now() - 5,
                type: 'vocabulary',
                description: 'Thêm từ vựng mới: "Amazing"',
                icon: 'fas fa-book text-success',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                timeAgo: '2 giờ trước'
            },
            {
                id: Date.now() - 4,
                type: 'exercise',
                description: 'Hoàn thành bài kiểm tra từ vựng - Điểm: 8/10 (80%)',
                icon: 'fas fa-trophy text-warning',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                timeAgo: '1 ngày trước'
            },
            {
                id: Date.now() - 3,
                type: 'grammar',
                description: 'Thêm ghi chú ngữ pháp: "Present Perfect Tense"',
                icon: 'fas fa-pencil-alt text-primary',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                timeAgo: '2 ngày trước'
            },
            {
                id: Date.now() - 2,
                type: 'vocabulary',
                description: 'Thêm từ vựng mới: "Confident"',
                icon: 'fas fa-book text-success',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                timeAgo: '3 ngày trước'
            },
            {
                id: Date.now() - 1,
                type: 'exercise',
                description: 'Hoàn thành bài kiểm tra ngữ pháp - Điểm: 15/20 (75%)',
                icon: 'fas fa-trophy text-warning',
                timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
                timeAgo: '4 ngày trước'
            }
        ];
        
        localStorage.setItem('recentActivities', JSON.stringify(sampleActivities));
    }
}

// Initialize sample data when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize sample data if URL has demo parameter or it's first visit
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === 'true';
    const isFirstVisit = !localStorage.getItem('vocabulary') && !localStorage.getItem('hasVisited');
    
    if (isDemo || isFirstVisit) {
        initializeSampleData();
        localStorage.setItem('hasVisited', 'true');
        
        // Show welcome message for first time users
        if (isFirstVisit) {
            setTimeout(() => {
                if (typeof app !== 'undefined' && app.showNotification) {
                    app.showNotification('🎉 Chào mừng bạn đến với ứng dụng học tiếng Anh! Dữ liệu mẫu đã được tạo.', 'success');
                }
            }, 2000);
        }
    }
});

// Function to reset all data (for testing)
function resetAllData() {
    const keys = ['vocabulary', 'grammar', 'progress', 'exercises', 'studyHistory', 'hasVisited'];
    keys.forEach(key => localStorage.removeItem(key));
    location.reload();
}

// Function to export data
function exportData() {
    const data = {
        vocabulary: JSON.parse(localStorage.getItem('vocabulary') || '[]'),
        grammar: JSON.parse(localStorage.getItem('grammar') || '[]'),
        progress: JSON.parse(localStorage.getItem('progress') || '{}'),
        exercises: JSON.parse(localStorage.getItem('exercises') || '[]'),
        studyHistory: JSON.parse(localStorage.getItem('studyHistory') || '[]')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-learning-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Function to import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (data.vocabulary && Array.isArray(data.vocabulary)) {
                localStorage.setItem('vocabulary', JSON.stringify(data.vocabulary));
            }
            if (data.grammar && Array.isArray(data.grammar)) {
                localStorage.setItem('grammar', JSON.stringify(data.grammar));
            }
            if (data.progress && typeof data.progress === 'object') {
                localStorage.setItem('progress', JSON.stringify(data.progress));
            }
            if (data.exercises && Array.isArray(data.exercises)) {
                localStorage.setItem('exercises', JSON.stringify(data.exercises));
            }
            if (data.studyHistory && Array.isArray(data.studyHistory)) {
                localStorage.setItem('studyHistory', JSON.stringify(data.studyHistory));
            }
            
            if (typeof app !== 'undefined' && app.showNotification) {
                app.showNotification('✅ Dữ liệu đã được import thành công!', 'success');
            }
            
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            if (typeof app !== 'undefined' && app.showNotification) {
                app.showNotification('❌ Lỗi khi import dữ liệu. File không hợp lệ.', 'error');
            }
        }
    };
    reader.readAsText(file);
}
