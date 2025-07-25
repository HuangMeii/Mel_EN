// Dashboard specific functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    createMiniCalendar();
    
    // Listen for study activity events to update recent activity
    document.addEventListener('studyActivity', function() {
        // Delay to allow activity to be saved first
        setTimeout(loadRecentActivity, 100);
    });
    
    // Refresh recent activity every 30 seconds
    setInterval(loadRecentActivity, 30000);
});

function initializeDashboard() {
    updateWelcomeMessage();
    loadRecentActivity();
    animateStatCards();
    updateDailyReminder();
    checkDailyGoals();
    
    // Recalculate streak on dashboard load
    if (typeof app !== 'undefined' && app.recalculateStreak) {
        app.recalculateStreak();
    }
}

function updateWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
        greeting = 'Chào buổi sáng!';
    } else if (hour < 18) {
        greeting = 'Chào buổi chiều!';
    } else {
        greeting = 'Chào buổi tối!';
    }
    
    const welcomeCard = document.querySelector('.bg-gradient-primary .card-title');
    if (welcomeCard) {
        welcomeCard.innerHTML = `<i class="fas fa-star"></i> ${greeting}`;
    }
}

function loadRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    if (activities.length === 0) {
        // Show sample activities if no real activities exist
        const sampleActivities = [
            {
                icon: 'fas fa-info-circle text-info',
                description: 'Chưa có hoạt động nào. Hãy bắt đầu học!',
                timeAgo: 'Bây giờ'
            },
            {
                icon: 'fas fa-lightbulb text-warning',
                description: 'Thêm từ vựng đầu tiên để bắt đầu',
                timeAgo: ''
            },
            {
                icon: 'fas fa-rocket text-primary',
                description: 'Làm bài tập để ghi nhận tiến trình',
                timeAgo: ''
            }
        ];
        
        container.innerHTML = sampleActivities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span>${activity.description}</span>
                <small class="text-muted">${activity.timeAgo}</small>
            </div>
        `).join('');
        return;
    }
    
    // Update time ago for existing activities
    const updatedActivities = activities.map(activity => {
        const activityDate = new Date(activity.timestamp);
        return {
            ...activity,
            timeAgo: getTimeAgo(activityDate)
        };
    });
    
    container.innerHTML = updatedActivities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <i class="${activity.icon}"></i>
            <span>${activity.description}</span>
            <small class="text-muted">${activity.timeAgo}</small>
        </div>
    `).join('');
}

function getTimeAgo(date) {
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
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 100);
    });
}

function updateDailyReminder() {
    const reminders = [
        {
            icon: '🎯',
            text: 'Hôm nay hãy học ít nhất 10 từ vựng mới'
        },
        {
            icon: '📚',
            text: 'Ôn tập ngữ pháp về thì hiện tại hoàn thành'
        },
        {
            icon: '🎧',
            text: 'Nghe một đoạn hội thoại tiếng Anh'
        },
        {
            icon: '🗣️',
            text: 'Luyện phát âm 20 từ trong danh sách của bạn'
        },
        {
            icon: '✍️',
            text: 'Làm một bài kiểm tra ngữ pháp ngắn'
        }
    ];

    // Get random reminders for today
    const today = new Date().getDate();
    const selectedReminders = [];
    
    for (let i = 0; i < 3; i++) {
        const index = (today + i) % reminders.length;
        selectedReminders.push(reminders[index]);
    }

    const container = document.getElementById('dailyReminder');
    if (container) {
        container.innerHTML = selectedReminders.map(reminder => `
            <p class="mb-2">${reminder.icon} ${reminder.text}</p>
        `).join('');
    }
}

function checkDailyGoals() {
    const progress = app.data.progress;
    const today = new Date().toDateString();
    
    if (progress.lastStudyDate !== today) {
        // Reset daily progress
        progress.dailyVocabularyCount = 0;
        progress.dailyExerciseCount = 0;
    }

    // Show motivation message
    const vocabularyGoal = progress.dailyGoal || 20;
    const currentCount = progress.dailyVocabularyCount || 0;
    
    if (currentCount >= vocabularyGoal) {
        app.showNotification('🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu từ vựng hôm nay!', 'success');
    } else if (currentCount > vocabularyGoal * 0.7) {
        app.showNotification(`💪 Tuyệt vời! Còn ${vocabularyGoal - currentCount} từ nữa để hoàn thành mục tiêu!`, 'info');
    }
}

// Interactive features
function showMotivationalQuote() {
    const quotes = [
        "Học một ngôn ngữ là mở ra một cánh cửa mới đến thế giới.",
        "Mỗi từ vựng mới là một bước tiến trong hành trình của bạn.",
        "Kiên trì là chìa khóa để thành thạo tiếng Anh.",
        "Đừng sợ mắc lỗi - đó là cách bạn học hỏi!",
        "Thành công là tổng của những nỗ lực nhỏ được lặp lại hàng ngày."
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    app.showNotification(`💡 ${randomQuote}`, 'info');
}

// Show motivational quote randomly
if (Math.random() < 0.3) { // 30% chance
    setTimeout(showMotivationalQuote, 3000);
}

// Progress celebration
function celebrateProgress() {
    const progress = app.data.progress;
    
    // Check for milestones
    if (progress.vocabularyCount > 0 && progress.vocabularyCount % 50 === 0) {
        showCelebration(`🎊 Chúc mừng! Bạn đã học được ${progress.vocabularyCount} từ vựng!`);
    }
    
    if (progress.studyStreak > 0 && progress.studyStreak % 7 === 0) {
        showCelebration(`🔥 Tuyệt vời! Bạn đã học liên tục ${progress.studyStreak} ngày!`);
    }
}

function showCelebration(message) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration-modal';
    celebration.innerHTML = `
        <div class="celebration-content">
            <h3>${message}</h3>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                Tiếp tục học tập! 🚀
            </button>
        </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .celebration-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.5s ease;
        }
        
        .celebration-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            animation: bounceIn 0.6s ease;
        }
        
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (celebration.parentNode) {
            celebration.remove();
            style.remove();
        }
    }, 5000);
}

// Check for celebrations
setTimeout(celebrateProgress, 2000);

// Mini Calendar functionality
function createMiniCalendar() {
    const calendarContainer = document.getElementById('miniStudyCalendar');
    if (!calendarContainer) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    let calendarHTML = `
        <div class="mini-calendar">
            <div class="calendar-header">
                <h6 class="mb-0">${monthNames[currentMonth]} ${currentYear}</h6>
            </div>
            <div class="calendar-weekdays">
                <div class="weekday">CN</div>
                <div class="weekday">T2</div>
                <div class="weekday">T3</div>
                <div class="weekday">T4</div>
                <div class="weekday">T5</div>
                <div class="weekday">T6</div>
                <div class="weekday">T7</div>
            </div>
            <div class="calendar-days">
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    const studyDates = getStudyDates();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today;
        const hasStudied = studyDates.includes(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (hasStudied) dayClass += ' studied';

        calendarHTML += `<div class="${dayClass}" data-day="${day}">${day}</div>`;
    }

    calendarHTML += `
            </div>
        </div>
        <div class="calendar-legend mt-2">
            <small>
                <span class="legend-item">
                    <span class="legend-dot studied"></span> Đã học
                </span>
                <span class="legend-item">
                    <span class="legend-dot today"></span> Hôm nay
                </span>
            </small>
        </div>
    `;

    calendarContainer.innerHTML = calendarHTML;

    // Add calendar styles
    if (!document.getElementById('calendarStyles')) {
        const calendarStyles = document.createElement('style');
        calendarStyles.id = 'calendarStyles';
        calendarStyles.textContent = `
            .mini-calendar {
                background: white;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .calendar-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px;
                text-align: center;
            }
            
            .calendar-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                background: #f8f9fa;
            }
            
            .weekday {
                padding: 5px;
                text-align: center;
                font-size: 0.8rem;
                font-weight: bold;
                color: #666;
            }
            
            .calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 1px;
                background: #e9ecef;
            }
            
            .calendar-day {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .calendar-day:hover {
                background: #e3f2fd;
            }
            
            .calendar-day.empty {
                background: #f8f9fa;
                cursor: default;
            }
            
            .calendar-day.today {
                background: #2196f3;
                color: white;
                font-weight: bold;
            }
            
            .calendar-day.studied {
                background: #4caf50;
                color: white;
                position: relative;
            }
            
            .calendar-day.studied.today {
                background: linear-gradient(45deg, #2196f3 50%, #4caf50 50%);
            }
            
            .calendar-legend {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .legend-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .legend-dot.studied {
                background: #4caf50;
            }
            
            .legend-dot.today {
                background: #2196f3;
            }
        `;
        document.head.appendChild(calendarStyles);
    }
}

function getStudyDates() {
    // Get study dates from localStorage or generate sample dates
    const studyHistory = JSON.parse(localStorage.getItem('studyHistory') || '[]');
    
    if (studyHistory.length === 0) {
        // Generate some sample study dates for demo
        const sampleDates = [];
        const now = new Date();
        for (let i = 1; i <= 10; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            sampleDates.push(date.toISOString().split('T')[0]);
        }
        return sampleDates;
    }
    
    return studyHistory;
}

function addStudyDate(date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    const studyHistory = JSON.parse(localStorage.getItem('studyHistory') || '[]');
    
    if (!studyHistory.includes(dateString)) {
        studyHistory.push(dateString);
        localStorage.setItem('studyHistory', JSON.stringify(studyHistory));
        createMiniCalendar(); // Refresh calendar
    }
}
