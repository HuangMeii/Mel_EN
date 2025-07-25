// Grammar page functionality
let currentGrammarCategory = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadGrammarNotes();
    setupGrammarEventListeners();
});

function setupGrammarEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchGrammarInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchGrammar, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchGrammar();
            }
        });
    }
}

function loadGrammarNotes() {
    const grammar = app.data.grammar;
    const container = document.getElementById('grammarContainer');
    
    if (!container) return;
    
    if (grammar.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-spell-check fa-3x text-muted mb-3"></i>
                        <h4>Chưa có ghi chú ngữ pháp nào</h4>
                        <p class="text-muted">Bắt đầu bằng cách thêm ghi chú ngữ pháp đầu tiên!</p>
                        <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#addGrammarModal">
                            <i class="fas fa-plus"></i> Thêm ghi chú đầu tiên
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let filteredGrammar = grammar;
    
    // Filter by category
    if (currentGrammarCategory !== 'all') {
        filteredGrammar = grammar.filter(note => note.category === currentGrammarCategory);
    }
    
    container.innerHTML = filteredGrammar.map(note => createGrammarCard(note)).join('');
}

function createGrammarCard(note) {
    const difficultyColors = {
        beginner: 'success',
        intermediate: 'warning',
        advanced: 'danger'
    };
    
    const categoryNames = {
        tenses: 'Thì',
        conditionals: 'Câu điều kiện',
        relative: 'Mệnh đề quan hệ',
        passive: 'Câu bị động',
        others: 'Khác'
    };
    
    const difficultyNames = {
        beginner: 'Cơ bản',
        intermediate: 'Trung bình',
        advanced: 'Nâng cao'
    };
    
    // Format examples
    const examples = Array.isArray(note.examples) ? note.examples : 
                    (note.examples ? note.examples.split('\n').filter(ex => ex.trim()) : []);
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card grammar-topic">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="word-category bg-${difficultyColors[note.difficulty]}">
                            ${categoryNames[note.category] || note.category}
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editGrammarNote(${note.id})">
                                    <i class="fas fa-edit"></i> Chỉnh sửa
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteGrammarNote(${note.id})">
                                    <i class="fas fa-trash"></i> Xóa
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <h5 class="card-title text-danger">${note.title}</h5>
                    <p class="card-text">${note.content}</p>
                    
                    ${examples.length > 0 ? `
                        <div class="examples-section">
                            <h6><i class="fas fa-lightbulb"></i> Ví dụ:</h6>
                            ${examples.map(example => `
                                <div class="grammar-example">${example}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt"></i>
                            ${app.formatDate(note.dateAdded)}
                        </small>
                        <span class="badge bg-${difficultyColors[note.difficulty]}">
                            ${difficultyNames[note.difficulty]}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function filterGrammarByCategory(category) {
    currentGrammarCategory = category;
    
    // Update active tab
    document.querySelectorAll('#grammarTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadGrammarNotes();
}

function searchGrammar() {
    const query = document.getElementById('searchGrammarInput').value.trim();
    const container = document.getElementById('grammarContainer');
    
    if (!query) {
        loadGrammarNotes();
        return;
    }
    
    const results = app.searchGrammar(query);
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-search fa-2x text-muted mb-3"></i>
                        <h5>Không tìm thấy kết quả</h5>
                        <p class="text-muted">Không có ghi chú ngữ pháp nào khớp với "${query}"</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.map(note => createGrammarCard(note)).join('');
}

function addNewGrammarNote() {
    const title = document.getElementById('grammarTitleInput').value.trim();
    const content = document.getElementById('grammarContentInput').value.trim();
    const examples = document.getElementById('grammarExamplesInput').value.trim();
    const category = document.getElementById('grammarCategorySelect').value;
    const difficulty = document.getElementById('grammarDifficultySelect').value;
    
    if (!title || !content) {
        app.showNotification('Vui lòng nhập tiêu đề và nội dung!', 'warning');
        return;
    }
    
    // Check if title already exists
    const existingNote = app.data.grammar.find(note => 
        note.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existingNote) {
        app.showNotification('Tiêu đề này đã tồn tại!', 'warning');
        return;
    }
    
    const newNote = app.addGrammarNote({
        title,
        content,
        examples: examples ? examples.split('\n').filter(ex => ex.trim()) : [],
        category,
        difficulty
    });
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addGrammarModal'));
    modal.hide();
    document.getElementById('addGrammarForm').reset();
    
    // Reload list
    loadGrammarNotes();
    
    app.showNotification(`Đã thêm ghi chú "${title}" thành công!`, 'success');
    app.updateStudyStreak();
}

function editGrammarNote(noteId) {
    const note = app.data.grammar.find(n => n.id === noteId);
    if (!note) return;
    
    // Fill edit form
    document.getElementById('editGrammarId').value = note.id;
    document.getElementById('editGrammarTitleInput').value = note.title;
    document.getElementById('editGrammarContentInput').value = note.content;
    document.getElementById('editGrammarExamplesInput').value = 
        Array.isArray(note.examples) ? note.examples.join('\n') : (note.examples || '');
    document.getElementById('editGrammarCategorySelect').value = note.category;
    document.getElementById('editGrammarDifficultySelect').value = note.difficulty;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editGrammarModal'));
    modal.show();
}

function updateGrammarNote() {
    const noteId = parseInt(document.getElementById('editGrammarId').value);
    const title = document.getElementById('editGrammarTitleInput').value.trim();
    const content = document.getElementById('editGrammarContentInput').value.trim();
    const examples = document.getElementById('editGrammarExamplesInput').value.trim();
    const category = document.getElementById('editGrammarCategorySelect').value;
    const difficulty = document.getElementById('editGrammarDifficultySelect').value;
    
    if (!title || !content) {
        app.showNotification('Vui lòng nhập tiêu đề và nội dung!', 'warning');
        return;
    }
    
    const noteIndex = app.data.grammar.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    
    // Update note
    app.data.grammar[noteIndex] = {
        ...app.data.grammar[noteIndex],
        title,
        content,
        examples: examples ? examples.split('\n').filter(ex => ex.trim()) : [],
        category,
        difficulty
    };
    
    app.saveData('grammar');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editGrammarModal'));
    modal.hide();
    
    // Reload list
    loadGrammarNotes();
    
    app.showNotification('Đã cập nhật ghi chú thành công!', 'success');
}

function deleteGrammarNote(noteId) {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    
    const noteIndex = app.data.grammar.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    
    const deletedNote = app.data.grammar[noteIndex];
    app.data.grammar.splice(noteIndex, 1);
    app.saveData('grammar');
    
    loadGrammarNotes();
    
    app.showNotification(`Đã xóa ghi chú "${deletedNote.title}"`, 'info');
}

// Quick Reference functionality
function showQuickReference() {
    const grammarContainer = document.getElementById('grammarContainer');
    const quickReferenceSection = document.getElementById('quickReferenceSection');
    
    grammarContainer.style.display = 'none';
    quickReferenceSection.style.display = 'block';
}

function hideQuickReference() {
    const grammarContainer = document.getElementById('grammarContainer');
    const quickReferenceSection = document.getElementById('quickReferenceSection');
    
    grammarContainer.style.display = 'block';
    quickReferenceSection.style.display = 'none';
}

// Export/Import functionality
function exportGrammarNotes() {
    const data = JSON.stringify(app.data.grammar, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_grammar_notes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    app.showNotification('Đã xuất ghi chú ngữ pháp!', 'success');
}

// Sample grammar notes
function addSampleGrammarNotes() {
    const sampleNotes = [
        {
            title: 'Present Perfect Tense',
            content: 'Diễn tả hành động bắt đầu trong quá khứ nhưng vẫn có liên quan đến hiện tại. Cấu trúc: have/has + past participle',
            examples: [
                'I have lived in this city for 5 years.',
                'She has just finished her homework.',
                'They have never been to Japan.'
            ],
            category: 'tenses',
            difficulty: 'intermediate'
        },
        {
            title: 'First Conditional',
            content: 'Diễn tả điều kiện có thể xảy ra trong tương lai. Cấu trúc: If + present simple, will + infinitive',
            examples: [
                'If it rains tomorrow, I will stay at home.',
                'If you study hard, you will pass the exam.',
                'We will go to the beach if the weather is good.'
            ],
            category: 'conditionals',
            difficulty: 'intermediate'
        },
        {
            title: 'Relative Clauses with WHO',
            content: 'Dùng để mô tả người. WHO thay thế cho chủ ngữ là người trong mệnh đề quan hệ.',
            examples: [
                'The man who is standing there is my teacher.',
                'I know a girl who speaks five languages.',
                'The students who work hard will succeed.'
            ],
            category: 'relative',
            difficulty: 'intermediate'
        }
    ];
    
    sampleNotes.forEach(note => {
        const existing = app.data.grammar.find(n => 
            n.title.toLowerCase() === note.title.toLowerCase()
        );
        
        if (!existing) {
            app.addGrammarNote(note);
        }
    });
    
    loadGrammarNotes();
    app.showNotification('Đã thêm ghi chú ngữ pháp mẫu!', 'success');
}

// Utility function
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

// Initialize with sample data if empty
if (app.data.grammar.length === 0) {
    setTimeout(() => {
        if (confirm('Bạn có muốn thêm một số ghi chú ngữ pháp mẫu để bắt đầu?')) {
            addSampleGrammarNotes();
        }
    }, 1000);
}
