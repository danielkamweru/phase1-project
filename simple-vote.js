// Super simple script - NO REFRESH
let allFeedback = [];

// Load feedback on page load
fetch('http://localhost:3000/feedback')
  .then(res => res.json())
  .then(data => {
    allFeedback = data;
    displayFeedback();
    updateStats();
  });

// Display feedback with styling
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
          <div class="vote-count" id="votes-${item.id}">${item.votes}</div>
          <button type="button" class="vote-btn downvote" onclick="voteDown('${item.id}')" title="Downvote">
            <i class="fas fa-thumbs-down"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Simple vote up - ONLY changes number
function voteUp(id) {
  const voteElement = document.getElementById(`votes-${id}`);
  const currentVotes = parseInt(voteElement.textContent);
  voteElement.textContent = currentVotes + 1;
  
  // Update local data
  const feedback = allFeedback.find(f => f.id === id);
  if (feedback) feedback.votes = currentVotes + 1;
}

// Simple vote down - ONLY changes number  
function voteDown(id) {
  const voteElement = document.getElementById(`votes-${id}`);
  const currentVotes = parseInt(voteElement.textContent);
  voteElement.textContent = currentVotes - 1;
  
  // Update local data
  const feedback = allFeedback.find(f => f.id === id);
  if (feedback) feedback.votes = currentVotes - 1;
}

// Update stats
function updateStats() {
  const total = allFeedback.length;
  document.getElementById('total-feedback').textContent = `${total} Feedback${total !== 1 ? 's' : ''}`;
}

// Theme toggle
document.getElementById('toggle-mode').onclick = () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('toggle-mode').innerHTML = isDark 
    ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
    : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
};

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.getElementById('toggle-mode').innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
}