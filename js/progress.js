// Progress page functionality
let vocabularyChart = null;
let scoresChart = null;
let activityChart = null;

document.addEventListener('DOMContentLoaded', function() {
    loadProgressData();
    initializeCharts();
    loadAchievements();
    loadStudyCalendar();
    loadStatisticsTable();
    updateGoalProgress();
});

function loadProgressData() {
    const progress = app.data.progress;
    
    // Update main statistics
    document.getElementById('studyStreakDisplay').textContent = progress.studyStreak || 0;
    document.getElementById('totalVocabularyDisplay').textContent = app.data.vocabulary.length;
    
    // Calculate average score
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const averageScore = testResults.length > 0 
        ? Math.round(testResults.reduce((sum, result) => sum + result.percentage, 0) / testResults.length)
        : 0;
    document.getElementById('averageScoreDisplay').textContent = `${averageScore}%`;
    
    // Calculate total study time (estimate)
    const totalStudyTime = calculateTotalStudyTime();
    document.getElementById('totalStudyTimeDisplay').textContent = `${Math.floor(totalStudyTime / 60)}h`;
}

function calculateTotalStudyTime() {
    // Estimate based on activities
    const vocabulary = app.data.vocabulary.length;
    const grammar = app.data.grammar.length;
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const speakingSessions = JSON.parse(localStorage.getItem('speakingSessions') || '[]');
    
    // Estimates: 2 min per vocab, 5 min per grammar note, actual test time, actual speaking time
    let totalMinutes = 0;
    totalMinutes += vocabulary * 2;
    totalMinutes += grammar * 5;
    totalMinutes += testResults.reduce((sum, result) => sum + Math.floor(result.timeTaken / 60), 0);
    totalMinutes += speakingSessions.reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);
    
    return totalMinutes;
}

function initializeCharts() {
    initVocabularyChart();
    initScoresChart();
    initActivityChart();
}

function initVocabularyChart() {
    const ctx = document.getElementById('vocabularyChart').getContext('2d');
    
    // Generate vocabulary progress data for last 7 days
    const last7Days = [];
    const vocabularyCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }));
        
        // Count vocabulary added up to this date
        const vocabulary = app.data.vocabulary.filter(word => 
            new Date(word.dateAdded) <= date
        );
        vocabularyCounts.push(vocabulary.length);
    }
    
    vocabularyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Từ vựng tích lũy',
                data: vocabularyCounts,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function initScoresChart() {
    const ctx = document.getElementById('scoresChart').getContext('2d');
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    
    // Get last 10 test results
    const recentResults = testResults.slice(-10);
    const labels = recentResults.map((result, index) => `Lần ${index + 1}`);
    const scores = recentResults.map(result => result.percentage);
    
    scoresChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Điểm số (%)',
                data: scores,
                backgroundColor: scores.map(score => {
                    if (score >= 90) return 'rgba(40, 167, 69, 0.8)';
                    if (score >= 70) return 'rgba(23, 162, 184, 0.8)';
                    if (score >= 50) return 'rgba(255, 193, 7, 0.8)';
                    return 'rgba(220, 53, 69, 0.8)';
                }),
                borderColor: scores.map(score => {
                    if (score >= 90) return 'rgba(40, 167, 69, 1)';
                    if (score >= 70) return 'rgba(23, 162, 184, 1)';
                    if (score >= 50) return 'rgba(255, 193, 7, 1)';
                    return 'rgba(220, 53, 69, 1)';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function initActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    
    // Calculate activity distribution
    const vocabulary = app.data.vocabulary.length;
    const grammar = app.data.grammar.length;
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]').length;
    const speakingSessions = JSON.parse(localStorage.getItem('speakingSessions') || '[]').length;
    const listeningContent = JSON.parse(localStorage.getItem('listeningContent') || '[]').length;
    
    activityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Từ vựng', 'Ngữ pháp', 'Kiểm tra', 'Luyện nói', 'Luyện nghe'],
            datasets: [{
                data: [vocabulary, grammar, testResults, speakingSessions, listeningContent],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function loadAchievements() {
    const achievements = calculateAchievements();
    const container = document.getElementById('achievementsContainer');
    
    container.innerHTML = achievements.map(achievement => `
        <div class="col-md-4 mb-3">
            <div class="card achievement-card ${achievement.unlocked ? 'achievement-unlocked' : 'achievement-locked'}">
                <div class="card-body text-center">
                    <i class="fas fa-${achievement.icon} fa-2x mb-2 ${achievement.unlocked ? 'text-warning' : 'text-muted'}"></i>
                    <h6>${achievement.name}</h6>
                    <p class="small text-muted">${achievement.description}</p>
                    <div class="progress">
                        <div class="progress-bar ${achievement.unlocked ? 'bg-success' : 'bg-secondary'}" 
                             style="width: ${achievement.progress}%"></div>
                    </div>
                    <small class="text-muted">${achievement.current}/${achievement.target}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function calculateAchievements() {
    const vocabulary = app.data.vocabulary.length;
    const grammar = app.data.grammar.length;
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const progress = app.data.progress;
    
    const achievements = [
        {
            name: 'Người mới bắt đầu',
            description: 'Học 10 từ vựng đầu tiên',
            icon: 'seedling',
            target: 10,
            current: vocabulary,
            unlocked: vocabulary >= 10,
            progress: Math.min((vocabulary / 10) * 100, 100)
        },
        {
            name: 'Người học tích cực',
            description: 'Học 100 từ vựng',
            icon: 'star',
            target: 100,
            current: vocabulary,
            unlocked: vocabulary >= 100,
            progress: Math.min((vocabulary / 100) * 100, 100)
        },
        {
            name: 'Chuyên gia ngữ pháp',
            description: 'Tạo 20 ghi chú ngữ pháp',
            icon: 'spell-check',
            target: 20,
            current: grammar,
            unlocked: grammar >= 20,
            progress: Math.min((grammar / 20) * 100, 100)
        },
        {
            name: 'Kiên trì',
            description: 'Học liên tục 7 ngày',
            icon: 'fire',
            target: 7,
            current: progress.studyStreak || 0,
            unlocked: (progress.studyStreak || 0) >= 7,
            progress: Math.min(((progress.studyStreak || 0) / 7) * 100, 100)
        },
        {
            name: 'Thần đồng kiểm tra',
            description: 'Đạt điểm 90% trong 5 bài kiểm tra',
            icon: 'trophy',
            target: 5,
            current: testResults.filter(result => result.percentage >= 90).length,
            unlocked: testResults.filter(result => result.percentage >= 90).length >= 5,
            progress: Math.min((testResults.filter(result => result.percentage >= 90).length / 5) * 100, 100)
        },
        {
            name: 'Bậc thầy từ vựng',
            description: 'Học 500 từ vựng',
            icon: 'crown',
            target: 500,
            current: vocabulary,
            unlocked: vocabulary >= 500,
            progress: Math.min((vocabulary / 500) * 100, 100)
        }
    ];
    
    return achievements;
}

function loadStudyCalendar() {
    const container = document.getElementById('studyCalendar');
    const now = new Date();
    const today = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    // Get study data for current month
    const studyDays = getStudyDaysInMonth(year, month);
    
    // Create calendar
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let calendarHTML = `
        <div class="text-center mb-3">
            <h6>${now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h6>
        </div>
        <div class="row text-center">
            <div class="col small text-muted">CN</div>
            <div class="col small text-muted">T2</div>
            <div class="col small text-muted">T3</div>
            <div class="col small text-muted">T4</div>
            <div class="col small text-muted">T5</div>
            <div class="col small text-muted">T6</div>
            <div class="col small text-muted">T7</div>
        </div>
    `;
    
    let dayCount = 1;
    const weeks = Math.ceil((firstDay + daysInMonth) / 7);
    
    for (let week = 0; week < weeks; week++) {
        calendarHTML += '<div class="row text-center">';
        
        for (let day = 0; day < 7; day++) {
            if (week === 0 && day < firstDay) {
                calendarHTML += '<div class="col calendar-day"></div>';
            } else if (dayCount <= daysInMonth) {
                const hasStudy = studyDays.includes(dayCount);
                const isToday = dayCount === today;
                const dayClass = isToday ? 'calendar-today' : (hasStudy ? 'calendar-study' : '');
                
                calendarHTML += `
                    <div class="col calendar-day ${dayClass}">
                        <small>${dayCount}</small>
                        ${hasStudy ? '<i class="fas fa-check-circle text-success" style="font-size: 0.7rem;"></i>' : ''}
                    </div>
                `;
                dayCount++;
            } else {
                calendarHTML += '<div class="col calendar-day"></div>';
            }
        }
        
        calendarHTML += '</div>';
    }
    
    container.innerHTML = calendarHTML;
    
    // Add calendar styles
    const style = document.createElement('style');
    style.textContent = `
        .calendar-day {
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #eee;
            margin: 1px;
            position: relative;
        }
        .calendar-today {
            background-color: #007bff;
            color: white;
            border-radius: 50%;
        }
        .calendar-study {
            background-color: #d4edda;
        }
    `;
    document.head.appendChild(style);
}

function getStudyDaysInMonth(year, month) {
    const studyDays = [];
    
    // Check vocabulary additions
    app.data.vocabulary.forEach(word => {
        const date = new Date(word.dateAdded);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const day = date.getDate();
            if (!studyDays.includes(day)) {
                studyDays.push(day);
            }
        }
    });
    
    // Check grammar additions
    app.data.grammar.forEach(note => {
        const date = new Date(note.dateAdded);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const day = date.getDate();
            if (!studyDays.includes(day)) {
                studyDays.push(day);
            }
        }
    });
    
    // Check test results
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    testResults.forEach(result => {
        const date = new Date(result.date);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const day = date.getDate();
            if (!studyDays.includes(day)) {
                studyDays.push(day);
            }
        }
    });
    
    return studyDays;
}

function loadStatisticsTable() {
    const container = document.getElementById('statisticsTable');
    
    const stats = [
        {
            activity: 'Từ vựng mới',
            today: getTodayCount('vocabulary'),
            thisWeek: getThisWeekCount('vocabulary'),
            thisMonth: getThisMonthCount('vocabulary'),
            total: app.data.vocabulary.length
        },
        {
            activity: 'Ghi chú ngữ pháp',
            today: getTodayCount('grammar'),
            thisWeek: getThisWeekCount('grammar'),
            thisMonth: getThisMonthCount('grammar'),
            total: app.data.grammar.length
        },
        {
            activity: 'Bài kiểm tra',
            today: getTodayCount('tests'),
            thisWeek: getThisWeekCount('tests'),
            thisMonth: getThisMonthCount('tests'),
            total: JSON.parse(localStorage.getItem('testResults') || '[]').length
        },
        {
            activity: 'Phiên luyện nói',
            today: getTodayCount('speaking'),
            thisWeek: getThisWeekCount('speaking'),
            thisMonth: getThisMonthCount('speaking'),
            total: JSON.parse(localStorage.getItem('speakingSessions') || '[]').length
        }
    ];
    
    container.innerHTML = stats.map(stat => `
        <tr>
            <td>${stat.activity}</td>
            <td><span class="badge bg-primary">${stat.today}</span></td>
            <td><span class="badge bg-success">${stat.thisWeek}</span></td>
            <td><span class="badge bg-info">${stat.thisMonth}</span></td>
            <td><span class="badge bg-secondary">${stat.total}</span></td>
        </tr>
    `).join('');
}

function getTodayCount(type) {
    const today = new Date().toDateString();
    
    switch(type) {
        case 'vocabulary':
            return app.data.vocabulary.filter(word => 
                new Date(word.dateAdded).toDateString() === today
            ).length;
        case 'grammar':
            return app.data.grammar.filter(note => 
                new Date(note.dateAdded).toDateString() === today
            ).length;
        case 'tests':
            return JSON.parse(localStorage.getItem('testResults') || '[]').filter(result => 
                new Date(result.date).toDateString() === today
            ).length;
        case 'speaking':
            return JSON.parse(localStorage.getItem('speakingSessions') || '[]').filter(session => 
                new Date(session.date).toDateString() === today
            ).length;
        default:
            return 0;
    }
}

function getThisWeekCount(type) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    switch(type) {
        case 'vocabulary':
            return app.data.vocabulary.filter(word => 
                new Date(word.dateAdded) >= weekStart
            ).length;
        case 'grammar':
            return app.data.grammar.filter(note => 
                new Date(note.dateAdded) >= weekStart
            ).length;
        case 'tests':
            return JSON.parse(localStorage.getItem('testResults') || '[]').filter(result => 
                new Date(result.date) >= weekStart
            ).length;
        case 'speaking':
            return JSON.parse(localStorage.getItem('speakingSessions') || '[]').filter(session => 
                new Date(session.date) >= weekStart
            ).length;
        default:
            return 0;
    }
}

function getThisMonthCount(type) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch(type) {
        case 'vocabulary':
            return app.data.vocabulary.filter(word => 
                new Date(word.dateAdded) >= monthStart
            ).length;
        case 'grammar':
            return app.data.grammar.filter(note => 
                new Date(note.dateAdded) >= monthStart
            ).length;
        case 'tests':
            return JSON.parse(localStorage.getItem('testResults') || '[]').filter(result => 
                new Date(result.date) >= monthStart
            ).length;
        case 'speaking':
            return JSON.parse(localStorage.getItem('speakingSessions') || '[]').filter(session => 
                new Date(session.date) >= monthStart
            ).length;
        default:
            return 0;
    }
}

function updateGoalProgress() {
    const goals = JSON.parse(localStorage.getItem('userGoals') || '{}');
    const defaultGoals = {
        dailyVocab: 20,
        dailyStudy: 30,
        weeklyVocab: 140,
        weeklyTest: 3
    };
    
    const userGoals = { ...defaultGoals, ...goals };
    
    // Update goal displays
    document.getElementById('dailyVocabGoal').textContent = userGoals.dailyVocab;
    document.getElementById('dailyStudyGoal').textContent = userGoals.dailyStudy;
    document.getElementById('weeklyVocabGoal').textContent = userGoals.weeklyVocab;
    document.getElementById('weeklyTestGoal').textContent = userGoals.weeklyTest;
    
    // Calculate current progress
    const dailyVocabCount = getTodayCount('vocabulary');
    const dailyStudyTime = Math.floor(calculateTotalStudyTime() / 60); // Rough estimate
    const weeklyVocabCount = getThisWeekCount('vocabulary');
    const weeklyTestCount = getThisWeekCount('tests');
    
    // Update progress displays
    document.getElementById('dailyVocabCount').textContent = dailyVocabCount;
    document.getElementById('dailyStudyTime').textContent = dailyStudyTime;
    document.getElementById('weeklyVocabCount').textContent = weeklyVocabCount;
    document.getElementById('weeklyTestCount').textContent = weeklyTestCount;
    
    // Update progress bars
    updateProgressBar('dailyVocabProgress', dailyVocabCount, userGoals.dailyVocab);
    updateProgressBar('dailyStudyProgress', dailyStudyTime, userGoals.dailyStudy);
    updateProgressBar('weeklyVocabProgress', weeklyVocabCount, userGoals.weeklyVocab);
    updateProgressBar('weeklyTestProgress', weeklyTestCount, userGoals.weeklyTest);
    
    // Load goals into modal
    document.getElementById('dailyVocabGoalInput').value = userGoals.dailyVocab;
    document.getElementById('dailyStudyGoalInput').value = userGoals.dailyStudy;
    document.getElementById('weeklyVocabGoalInput').value = userGoals.weeklyVocab;
    document.getElementById('weeklyTestGoalInput').value = userGoals.weeklyTest;
}

function updateProgressBar(id, current, target) {
    const progressBar = document.getElementById(id);
    if (progressBar) {
        const percentage = Math.min((current / target) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        
        // Change color based on progress
        progressBar.className = 'progress-bar';
        if (percentage >= 100) {
            progressBar.classList.add('bg-success');
        } else if (percentage >= 75) {
            progressBar.classList.add('bg-info');
        } else if (percentage >= 50) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
    }
}

function saveGoals() {
    const goals = {
        dailyVocab: parseInt(document.getElementById('dailyVocabGoalInput').value),
        dailyStudy: parseInt(document.getElementById('dailyStudyGoalInput').value),
        weeklyVocab: parseInt(document.getElementById('weeklyVocabGoalInput').value),
        weeklyTest: parseInt(document.getElementById('weeklyTestGoalInput').value)
    };
    
    localStorage.setItem('userGoals', JSON.stringify(goals));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('goalsModal'));
    modal.hide();
    
    // Update progress
    updateGoalProgress();
    
    app.showNotification('Đã lưu mục tiêu thành công!', 'success');
}
