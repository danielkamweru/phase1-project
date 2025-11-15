// Debug version to find refresh source
console.log('Debug script loaded');

// Load feedback
fetch('http://localhost:3000/feedback')
  .then(res => res.json())
  .then(data => {
    console.log('Data loaded:', data.length, 'items');
    displayFeedback(data);
    updateStats();
  });

function displayFeedback(data) {
  const container = document.getElementById('feedback-container');
  container.innerHTML = '';
  
  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'feedback';
    div.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-author">
          <i class="fas fa-user-circle"></i>
          <span id="name-${item.id}">${item.studentName}</span>
        </div>
      </div>
      <div class="feedback-content" id="content-${item.id}">${item.comment}</div>
      <div class="feedback-actions">
        <div class="vote-section">
          <span onclick="voteUp('${item.id}')" style="cursor: pointer; padding: 8px 12px; background: #06d6a0; color: white; border-radius: 20px; margin: 2px; font-size: 14px;">👍</span>
          <span id="votes-${item.id}" style="padding: 5px 10px; font-weight: bold; background: #f0f0f0; border-radius: 15px; min-width: 40px; text-align: center; margin: 2px;">${item.votes}</span>
          <span onclick="voteDown('${item.id}')" style="cursor: pointer; padding: 8px 12px; background: #ff6b35; color: white; border-radius: 20px; margin: 2px; font-size: 14px;">👎</span>
        </div>
        <div class="action-buttons">
          <span onclick="editFeedback('${item.id}')" style="cursor: pointer; padding: 8px; background: #118ab2; color: white; border-radius: 50%; margin: 2px; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center;" title="Edit">✏️</span>
          <span onclick="deleteFeedback('${item.id}')" style="cursor: pointer; padding: 8px; background: #ff6b35; color: white; border-radius: 50%; margin: 2px; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center;" title="Delete">🗑️</span>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Test vote functions with console logs
function voteUp(id) {
  console.log('Vote up clicked for ID:', id);
  const element = document.getElementById(`votes-${id}`);
  const current = parseInt(element.textContent);
  element.textContent = current + 1;
  console.log('Vote updated from', current, 'to', current + 1);
}

function voteDown(id) {
  console.log('Vote down clicked for ID:', id);
  const element = document.getElementById(`votes-${id}`);
  const current = parseInt(element.textContent);
  element.textContent = current - 1;
  console.log('Vote updated from', current, 'to', current - 1);
}

// Edit feedback function - populates form
function editFeedback(id) {
  console.log('Edit clicked for ID:', id);
  const nameElement = document.getElementById(`name-${id}`);
  const contentElement = document.getElementById(`content-${id}`);
  
  // Get form elements
  const nameInput = document.getElementById('studentName');
  const commentInput = document.getElementById('comment');
  const submitBtn = document.getElementById('submit');
  const submitText = document.getElementById('submit-text');
  
  // Populate form with current values
  nameInput.value = nameElement.textContent;
  commentInput.value = contentElement.textContent;
  
  // Change submit button to update mode
  submitText.textContent = 'Update Feedback';
  submitBtn.style.background = 'linear-gradient(135deg, #ff6b35 0%, #f77f00 100%)';
  
  // Store editing ID for later use
  window.editingId = id;
  
  // Scroll to form
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  nameInput.focus();
  
  console.log('Form populated for editing ID:', id);
}

// Delete feedback function
function deleteFeedback(id) {
  console.log('Delete clicked for ID:', id);
  if (confirm('Are you sure you want to delete this feedback?')) {
    const feedbackElement = document.querySelector(`#votes-${id}`).closest('.feedback');
    feedbackElement.remove();
    updateStats();
    console.log('Feedback deleted for ID:', id);
  }
}

// Update stats function
function updateStats() {
  const feedbackCount = document.querySelectorAll('.feedback').length;
  const statsElement = document.getElementById('total-feedback');
  statsElement.textContent = `${feedbackCount} Feedback${feedbackCount !== 1 ? 's' : ''}`;
  console.log('Stats updated:', feedbackCount, 'feedbacks');
}

// Check for any form submissions
document.addEventListener('submit', function(e) {
  console.log('FORM SUBMIT DETECTED!', e.target);
  e.preventDefault();
});

// Form submission handler
document.getElementById('feedback-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('studentName');
  const commentInput = document.getElementById('comment');
  const submitText = document.getElementById('submit-text');
  const submitBtn = document.getElementById('submit');
  
  if (window.editingId) {
    // Update existing feedback
    const nameElement = document.getElementById(`name-${window.editingId}`);
    const contentElement = document.getElementById(`content-${window.editingId}`);
    
    nameElement.textContent = nameInput.value;
    contentElement.textContent = commentInput.value;
    
    console.log('Feedback updated for ID:', window.editingId);
    
    // Reset form
    window.editingId = null;
    submitText.textContent = 'Submit Feedback';
    submitBtn.style.background = 'linear-gradient(135deg, #06d6a0 0%, #118ab2 100%)';
  } else {
    console.log('New feedback would be added here');
  }
  
  // Clear form
  nameInput.value = '';
  commentInput.value = '';
});

// Check for any page reloads
window.addEventListener('beforeunload', function(e) {
  console.log('PAGE UNLOAD DETECTED!');
});

// Dark mode toggle
document.getElementById('toggle-mode').addEventListener('click', function() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  
  this.innerHTML = isDark 
    ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
    : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
  
  console.log('Theme toggled to:', isDark ? 'dark' : 'light');
});

// Load saved theme on page load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.getElementById('toggle-mode').innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
}

console.log('Debug script ready');