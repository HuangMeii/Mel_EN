// Exercises page functionality
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let testStartTime = null;
let timeLimit = 0;
let testTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    loadRecentResults();
});

// Test Management
function startGrammarTest() {
    const questions = generateGrammarQuestions(15);
    startTest('Kiểm tra ngữ pháp', questions, 'grammar');
}

function startVocabularyTest() {
    const questions = generateVocabularyQuestions(15);
    startTest('Kiểm tra từ vựng', questions, 'vocabulary');
}

function startListeningTest() {
    const questions = generateListeningQuestions(10);
    startTest('Kiểm tra nghe hiểu', questions, 'listening');
}

function startCustomTest() {
    const testType = document.getElementById('testTypeSelect').value;
    const questionCount = parseInt(document.getElementById('questionCountInput').value);
    const difficulty = document.getElementById('difficultySelect').value;
    const timeLimit = parseInt(document.getElementById('timeLimitInput').value);
    
    let questions = [];
    let title = '';
    
    switch(testType) {
        case 'grammar':
            questions = generateGrammarQuestions(questionCount, difficulty);
            title = 'Kiểm tra ngữ pháp tùy chỉnh';
            break;
        case 'vocabulary':
            questions = generateVocabularyQuestions(questionCount, difficulty);
            title = 'Kiểm tra từ vựng tùy chỉnh';
            break;
        case 'listening':
            questions = generateListeningQuestions(questionCount, difficulty);
            title = 'Kiểm tra nghe hiểu tùy chỉnh';
            break;
        case 'mixed':
            questions = generateMixedQuestions(questionCount, difficulty);
            title = 'Kiểm tra tổng hợp';
            break;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('customTestModal'));
    modal.hide();
    
    startTest(title, questions, testType, timeLimit);
}

function startTest(title, questions, type, timeLimitMinutes = 0) {
    currentTest = {
        title,
        questions,
        type,
        startTime: new Date(),
        timeLimit: timeLimitMinutes * 60 // Convert to seconds
    };
    
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    testStartTime = Date.now();
    timeLimit = timeLimitMinutes * 60 * 1000; // Convert to milliseconds
    
    // Hide main content and show test interface
    hideAllSections();
    document.getElementById('testInterface').style.display = 'block';
    
    // Setup test UI
    document.getElementById('testTitle').textContent = title;
    updateTestProgress();
    loadCurrentQuestion();
    
    // Start timer if time limit is set
    if (timeLimitMinutes > 0) {
        startTestTimer();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function loadCurrentQuestion() {
    const question = currentTest.questions[currentQuestionIndex];
    if (!question) return;
    
    document.getElementById('questionText').textContent = `${currentQuestionIndex + 1}. ${question.question}`;
    
    // Show context for listening questions
    const contextElement = document.getElementById('questionContext');
    if (question.context) {
        contextElement.textContent = question.context;
        contextElement.style.display = 'block';
    } else {
        contextElement.style.display = 'none';
    }
    
    // Load answer options
    const optionsContainer = document.getElementById('answerOptions');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <div class="answer-option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
             onclick="selectAnswer(${index})">
            <strong>${String.fromCharCode(65 + index)}.</strong> ${option}
        </div>
    `).join('');
    
    // Update navigation buttons
    document.getElementById('prevButton').disabled = currentQuestionIndex === 0;
    const nextButton = document.getElementById('nextButton');
    if (currentQuestionIndex === currentTest.questions.length - 1) {
        nextButton.innerHTML = 'Hoàn thành <i class="fas fa-check"></i>';
        nextButton.onclick = finishTest;
    } else {
        nextButton.innerHTML = 'Tiếp theo <i class="fas fa-arrow-right"></i>';
        nextButton.onclick = nextQuestion;
    }
}

function selectAnswer(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Update UI
    document.querySelectorAll('.answer-option').forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });
}

function nextQuestion() {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
        loadCurrentQuestion();
        updateTestProgress();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadCurrentQuestion();
        updateTestProgress();
    }
}

function skipQuestion() {
    userAnswers[currentQuestionIndex] = null;
    nextQuestion();
}

function updateTestProgress() {
    const progress = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('testProgress').textContent = 
        `${currentQuestionIndex + 1}/${currentTest.questions.length}`;
}

function finishTest() {
    if (testTimer) {
        clearInterval(testTimer);
    }
    
    // Calculate results
    const results = calculateResults();
    
    // Save test result
    saveTestResult(results);
    
    // Show results
    showTestResults(results);
}

function calculateResults() {
    let correctCount = 0;
    const detailedResults = [];
    
    currentTest.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) correctCount++;
        
        detailedResults.push({
            questionIndex: index + 1,
            question: question.question,
            userAnswer: userAnswer !== null ? question.options[userAnswer] : 'Không trả lời',
            correctAnswer: question.options[question.correctAnswer],
            isCorrect,
            explanation: question.explanation
        });
    });
    
    const totalQuestions = currentTest.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
    return {
        testTitle: currentTest.title,
        testType: currentTest.type,
        totalQuestions,
        correctCount,
        percentage,
        timeTaken,
        detailedResults,
        date: new Date()
    };
}

function showTestResults(results) {
    // Hide test interface and show results
    document.getElementById('testInterface').style.display = 'none';
    document.getElementById('testResults').style.display = 'block';
    
    // Update result display
    document.getElementById('finalScore').textContent = `${results.percentage}%`;
    document.getElementById('correctAnswers').textContent = results.correctCount;
    document.getElementById('totalQuestions').textContent = results.totalQuestions;
    
    // Show score message
    const scoreMessage = document.getElementById('scoreMessage');
    let messageClass = 'alert-';
    let message = '';
    
    if (results.percentage >= 90) {
        messageClass += 'success';
        message = '🎉 Xuất sắc! Bạn đã làm rất tốt!';
    } else if (results.percentage >= 70) {
        messageClass += 'info';
        message = '👏 Tốt lắm! Bạn đã hiểu phần lớn nội dung!';
    } else if (results.percentage >= 50) {
        messageClass += 'warning';
        message = '💪 Khá ổn! Hãy tiếp tục cố gắng!';
    } else {
        messageClass += 'danger';
        message = '📚 Cần cải thiện! Hãy ôn tập thêm nhé!';
    }
    
    scoreMessage.className = `alert ${messageClass}`;
    scoreMessage.textContent = message;
    
    // Show detailed results
    const detailedContainer = document.getElementById('detailedResults');
    detailedContainer.innerHTML = results.detailedResults.map(result => `
        <div class="card mb-2">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6>Câu ${result.questionIndex}: ${result.question}</h6>
                        <p class="mb-1">
                            <strong>Bạn chọn:</strong> 
                            <span class="${result.isCorrect ? 'text-success' : 'text-danger'}">
                                ${result.userAnswer}
                            </span>
                        </p>
                        <p class="mb-1">
                            <strong>Đáp án đúng:</strong> 
                            <span class="text-success">${result.correctAnswer}</span>
                        </p>
                        ${result.explanation ? `
                            <p class="mb-0 text-muted">
                                <small><strong>Giải thích:</strong> ${result.explanation}</small>
                            </p>
                        ` : ''}
                    </div>
                    <div>
                        <i class="fas fa-${result.isCorrect ? 'check-circle text-success' : 'times-circle text-danger'} fa-lg"></i>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function saveTestResult(results) {
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    testResults.push(results);
    
    // Keep only last 20 results
    if (testResults.length > 20) {
        testResults.splice(0, testResults.length - 20);
    }
    
    localStorage.setItem('testResults', JSON.stringify(testResults));
    
    // Update app progress
    app.recordExerciseResult(results.testType, results.correctCount, results.totalQuestions);
}

function loadRecentResults() {
    const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const container = document.getElementById('recentResults');
    
    if (testResults.length === 0) {
        container.innerHTML = `
            <p class="text-muted">Chưa có kết quả kiểm tra nào. Hãy bắt đầu làm bài!</p>
        `;
        return;
    }
    
    // Show last 10 results
    const recentResults = testResults.slice(-10).reverse();
    
    container.innerHTML = recentResults.map(result => `
        <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
            <div>
                <h6 class="mb-1">${result.testTitle}</h6>
                <small class="text-muted">
                    ${app.formatDate(result.date)} - ${Math.floor(result.timeTaken / 60)}:${(result.timeTaken % 60).toString().padStart(2, '0')}
                </small>
            </div>
            <div class="text-end">
                <h5 class="mb-0 ${result.percentage >= 70 ? 'text-success' : result.percentage >= 50 ? 'text-warning' : 'text-danger'}">
                    ${result.percentage}%
                </h5>
                <small class="text-muted">${result.correctCount}/${result.totalQuestions}</small>
            </div>
        </div>
    `).join('');
}

// Test Actions
function retakeTest() {
    if (currentTest) {
        startTest(currentTest.title, currentTest.questions, currentTest.type, currentTest.timeLimit / 60);
    }
}

function reviewAnswers() {
    // Scroll to detailed results
    document.getElementById('detailedResults').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function backToExercises() {
    hideAllSections();
    loadRecentResults();
}

function exitTest() {
    if (confirm('Bạn có chắc chắn muốn thoát? Tiến trình sẽ bị mất.')) {
        backToExercises();
    }
}

// Timer functionality
function startTestTimer() {
    if (!currentTest.timeLimit) return;
    
    testTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
        const remaining = currentTest.timeLimit - elapsed;
        
        if (remaining <= 0) {
            app.showNotification('Hết thời gian!', 'warning');
            finishTest();
            return;
        }
        
        // Show warning when 2 minutes left
        if (remaining === 120) {
            app.showNotification('Còn 2 phút!', 'warning');
        }
        
        // Update timer display (you could add this to the UI)
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer in title if you want
        document.title = `${timeString} - ${currentTest.title}`;
    }, 1000);
}

// Question generators
function generateGrammarQuestions(count = 15, difficulty = 'medium') {
    const grammarQuestions = [
        {
            question: "I _____ to London last year.",
            options: ["go", "went", "have gone", "going"],
            correctAnswer: 1,
            explanation: "Dùng thì quá khứ đơn với 'last year'",
            difficulty: 'easy'
        },
        {
            question: "She _____ English for 5 years.",
            options: ["studies", "studied", "has studied", "is studying"],
            correctAnswer: 2,
            explanation: "Dùng present perfect với 'for + khoảng thời gian'",
            difficulty: 'medium'
        },
        {
            question: "If I _____ rich, I would travel around the world.",
            options: ["am", "was", "were", "would be"],
            correctAnswer: 2,
            explanation: "Câu điều kiện loại 2: If + past subjunctive",
            difficulty: 'medium'
        },
        {
            question: "The book _____ by millions of people.",
            options: ["has read", "has been read", "was reading", "reads"],
            correctAnswer: 1,
            explanation: "Câu bị động với present perfect",
            difficulty: 'hard'
        },
        {
            question: "I wish I _____ more time to study.",
            options: ["have", "had", "would have", "will have"],
            correctAnswer: 1,
            explanation: "Wish + past tense để diễn tả mong muốn về hiện tại",
            difficulty: 'hard'
        },
        // Add more grammar questions...
    ];
    
    // Filter by difficulty if specified
    let filteredQuestions = grammarQuestions;
    if (difficulty !== 'mixed') {
        filteredQuestions = grammarQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // Shuffle and return requested count
    return shuffleArray([...filteredQuestions]).slice(0, Math.min(count, filteredQuestions.length));
}

function generateVocabularyQuestions(count = 15, difficulty = 'medium') {
    const vocabularyQuestions = [
        {
            question: "What does 'abundant' mean?",
            options: ["Scarce", "Plentiful", "Expensive", "Difficult"],
            correctAnswer: 1,
            explanation: "'Abundant' means existing in large quantities; plentiful",
            difficulty: 'medium'
        },
        {
            question: "Choose the best synonym for 'magnificent':",
            options: ["Terrible", "Ordinary", "Splendid", "Small"],
            correctAnswer: 2,
            explanation: "'Magnificent' means splendid or impressive",
            difficulty: 'easy'
        },
        {
            question: "The company decided to _____ the project due to budget constraints.",
            options: ["abandon", "enhance", "continue", "complete"],
            correctAnswer: 0,
            explanation: "'Abandon' means to give up or discontinue",
            difficulty: 'medium'
        },
        // Add more vocabulary questions...
    ];
    
    // If we have vocabulary from the app, use some of those too
    const userVocabulary = app.data.vocabulary;
    if (userVocabulary.length > 0) {
        const userQuestions = userVocabulary.slice(0, 10).map(word => ({
            question: `What does '${word.word}' mean?`,
            options: generateVocabularyOptions(word.meaning),
            correctAnswer: 0, // Correct meaning is always first, then shuffled
            explanation: `${word.word}: ${word.meaning}`,
            difficulty: word.difficulty || 'medium'
        }));
        
        vocabularyQuestions.push(...userQuestions);
    }
    
    let filteredQuestions = vocabularyQuestions;
    if (difficulty !== 'mixed') {
        filteredQuestions = vocabularyQuestions.filter(q => q.difficulty === difficulty);
    }
    
    return shuffleArray([...filteredQuestions]).slice(0, Math.min(count, filteredQuestions.length));
}

function generateListeningQuestions(count = 10, difficulty = 'medium') {
    const listeningQuestions = [
        {
            question: "What is the main topic of the conversation?",
            context: "🎧 Listen to a conversation between two friends discussing their weekend plans.",
            options: ["Work schedules", "Weekend plans", "Restaurant reviews", "Travel experiences"],
            correctAnswer: 1,
            explanation: "The conversation focuses on what they plan to do during the weekend",
            difficulty: 'easy'
        },
        {
            question: "Where does the speaker suggest meeting?",
            context: "🎧 Listen to someone giving directions for a meeting location.",
            options: ["At the coffee shop", "At the library", "At the park", "At the mall"],
            correctAnswer: 0,
            explanation: "The speaker mentions meeting at the coffee shop on Main Street",
            difficulty: 'medium'
        },
        // Add more listening questions...
    ];
    
    let filteredQuestions = listeningQuestions;
    if (difficulty !== 'mixed') {
        filteredQuestions = listeningQuestions.filter(q => q.difficulty === difficulty);
    }
    
    return shuffleArray([...filteredQuestions]).slice(0, Math.min(count, filteredQuestions.length));
}

function generateMixedQuestions(count = 20, difficulty = 'mixed') {
    const grammarQ = generateGrammarQuestions(Math.ceil(count * 0.4), difficulty);
    const vocabularyQ = generateVocabularyQuestions(Math.ceil(count * 0.4), difficulty);
    const listeningQ = generateListeningQuestions(Math.ceil(count * 0.2), difficulty);
    
    const allQuestions = [...grammarQ, ...vocabularyQ, ...listeningQ];
    return shuffleArray(allQuestions).slice(0, count);
}

// Utility functions
function generateVocabularyOptions(correctMeaning) {
    const distractors = [
        "Khó khăn", "Dễ dàng", "Quan trọng", "Không quan trọng",
        "Lớn", "Nhỏ", "Nhanh", "Chậm", "Đẹp", "Xấu",
        "Mới", "Cũ", "Tốt", "Xấu", "Sạch", "Bẩn"
    ];
    
    const options = [correctMeaning];
    const shuffledDistractors = shuffleArray([...distractors]);
    
    // Add 3 random distractors
    for (let i = 0; i < 3 && i < shuffledDistractors.length; i++) {
        options.push(shuffledDistractors[i]);
    }
    
    return shuffleArray(options);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function hideAllSections() {
    const sections = ['testInterface', 'testResults'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    });
    
    // Reset document title
    document.title = 'EnglishLearner - Bài tập & Kiểm tra';
}
