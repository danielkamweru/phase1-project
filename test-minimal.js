// Styled minimal script
let allFeedback = [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize
function init() {
  loadFeedback();
  setupTheme();
  setupForm();
}

// Setup theme
function setupTheme() {
  const toggleBtn = document.getElementById('toggle-mode');
  if (isDarkMode) {
    document.body.classList.add('dark');
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
  }
  
  toggleBtn.onclick = () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode);
    toggleBtn.innerHTML = isDarkMode 
      ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
      : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
  };
}

// Setup form
function setupForm() {
  const form = document.getElementById('feedback-form');
  const nameInput = document.getElementById('studentName');
  const commentInput = document.getElementById('comment');
  const charCounter = document.getElementById('char-counter');
  
  commentInput.oninput = () => {
    const length = commentInput.value.length;
    charCounter.textContent = length;
    charCounter.style.color = length > 450 ? '#f44336' : length > 400 ? '#ff9800' : '#666';
  };
  
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();
    if (name && comment) {
      addFeedback(name, comment);
      form.reset();
      charCounter.textContent = '0';
    }
  };
}

// Load feedback
function loadFeedback() {
  fetch('http://localhost:3000/feedback')
    .then(res => res.json())
    .then(data => {
      allFeedback = data;
      displayFeedback();
      updateStats();
    });
}

// Display feedback with proper styling
function displayFeedback() {
  const container = document.getElementById('feedback-container');
  container.innerHTML = '';
  
  allFeedback.forEach(item => {
    const div = document.createElement('div');
    div.className = 'feedback';
    div.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-author">
          <i class="fas fa-user-circle"></i>
          ${item.studentName}
        </div>
        <div class="feedback-date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="feedback-content">${item.comment}</div>
      <div class="feedback-actions">
        <div class="vote-section">
          <button type="button" class="vote-btn upvote" onclick="voteUp('${item.id}')" title="Upvote">
            <i class="fas fa-thumbs-up"></i>
          </button>
          <div class="vote-count">${item.votes}</div>
          <button type="button" class="vote-btn downvote" onclick="voteDown('${item.id}')" title="Downvote">
            <i class="fas fa-thumbs-down"></i>
          </button>
        </div>
        <div class="action-buttons">
          <button type="button" class="action-btn edit-btn" onclick="editFeedback('${item.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="action-btn delete-btn" onclick="deleteFeedback('${item.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Vote functions
function voteUp(id) {
  const feedback = allFeedback.find(f => f.id === id);
  const voteElement = event.target.closest('.feedback').querySelector('.vote-count');
  feedback.votes++;
  voteElement.textContent = feedback.votes;
  
  // Update server
  fetch(`http://localhost:3000/feedback/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
}

function voteDown(id) {
  const feedback = allFeedback.find(f => f.id === id);
  const voteElement = event.target.closest('.feedback').querySelector('.vote-count');
  feedback.votes--;
  voteElement.textContent = feedback.votes;
  
  // Update server
  fetch(`http://localhost:3000/feedback/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
}

// Add new feedback
function addFeedback(name, comment) {
  const newFeedback = {
    studentName: name,
    comment: comment,
    votes: 0
  };
  
  fetch('http://localhost:3000/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newFeedback)
  })
  .then(res => res.json())
  .then(data => {
    allFeedback.unshift(data);
    displayFeedback();
    updateStats();
  });
}

// Edit feedback
function editFeedback(id) {
  const feedback = allFeedback.find(f => f.id === id);
  const nameInput = document.getElementById('studentName');
  const commentInput = document.getElementById('comment');
  
  nameInput.value = feedback.studentName;
  commentInput.value = feedback.comment;
  
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete feedback
function deleteFeedback(id) {
  if (confirm('Delete this feedback?')) {
    fetch(`http://localhost:3000/feedback/${id}`, { method: 'DELETE' })
      .then(() => {
        allFeedback = allFeedback.filter(f => f.id !== id);
        displayFeedback();
        updateStats();
      });
  }
}

// Update stats
function updateStats() {
  const total = allFeedback.length;
  document.getElementById('total-feedback').textContent = `${total} Feedback${total !== 1 ? 's' : ''}`;
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}