// DOM Elements
const feedbackContainer = document.getElementById("feedback-container");
const form = document.getElementById("feedback-form");
const toggleBtn = document.getElementById("toggle-mode");
const studentNameInput = document.getElementById("studentName");
const commentInput = document.getElementById("comment");
const submitBtn = document.getElementById("submit");
const submitText = document.getElementById("submit-text");
const charCounter = document.getElementById("char-counter");
const totalFeedbackSpan = document.getElementById("total-feedback");
const sortFilter = document.getElementById("sort-filter");
const searchInput = document.getElementById("search-input");
const noFeedbackDiv = document.getElementById("no-feedback");
const notification = document.getElementById("notification");

// State
const API_URL = "https://feedback-backend-blue.vercel.app/feedback";
let isEditing = false;
let editingId = null;
let allFeedback = [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize app
function init() {
  loadFeedback();
  setupEventListeners();
  setupTheme();
  setupCharCounter();
}

// Setup theme
function setupTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark');
    toggleBtn.innerHTML = '☀️<span>Light Mode</span>';
  }
}

// Setup character counter
function setupCharCounter() {
  commentInput.addEventListener('input', () => {
    const length = commentInput.value.length;
    charCounter.textContent = length;
    charCounter.style.color = length > 450 ? '#f44336' : length > 400 ? '#ff9800' : '#666';
  });
}

// Setup event listeners
function setupEventListeners() {
  form.addEventListener("submit", handleSubmit);
  toggleBtn.addEventListener("click", toggleTheme);
  
  // Use event delegation for vote buttons
  document.addEventListener("click", function(e) {
    // Prevent any button clicks from causing form submission
    if (e.target.closest('button') && !e.target.closest('button[type="submit"]')) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (e.target.closest('.upvote')) {
      const id = e.target.closest('.upvote').dataset.id;
      updateVoteCount(id, true);
      return false;
    }
    if (e.target.closest('.downvote')) {
      const id = e.target.closest('.downvote').dataset.id;
      updateVoteCount(id, false);
      return false;
    }
    if (e.target.closest('.edit-btn')) {
      const id = e.target.closest('.edit-btn').dataset.id;
      handleEdit(id);
      return false;
    }
    if (e.target.closest('.delete-btn')) {
      const id = e.target.closest('.delete-btn').dataset.id;
      handleDelete(id);
      return false;
    }
  });
  
  sortFilter.addEventListener("change", handleSort);
  searchInput.addEventListener("input", handleSearch);
  
  // Real-time validation
  studentNameInput.addEventListener('input', validateForm);
  commentInput.addEventListener('input', validateForm);
}

// Global vote functions - SIMPLE AND NO REFRESH
window.voteUp = function(id) {
  console.log('Vote up clicked for:', id);
  const voteElement = document.getElementById(`votes-${id}`);
  if (voteElement) {
    const currentVotes = parseInt(voteElement.textContent);
    voteElement.textContent = currentVotes + 1;
  }
};

window.voteDown = function(id) {
  console.log('Vote down clicked for:', id);
  const voteElement = document.getElementById(`votes-${id}`);
  if (voteElement) {
    const currentVotes = parseInt(voteElement.textContent);
    voteElement.textContent = currentVotes - 1;
  }
};

window.editFeedback = function(id) {
  console.log('Edit clicked for:', id);
  
  // Get data from DOM instead of allFeedback array
  const feedbackElement = document.querySelector(`[data-id="${id}"]`);
  if (!feedbackElement) return;
  
  const authorElement = feedbackElement.querySelector('.feedback-author');
  const contentElement = feedbackElement.querySelector('.feedback-content');
  
  if (!authorElement || !contentElement) return;
  
  // Extract name (remove emoji)
  const currentName = authorElement.textContent.replace('👤 ', '').trim();
  const currentComment = contentElement.textContent.trim();
  
  // Populate form
  document.getElementById('studentName').value = currentName;
  document.getElementById('comment').value = currentComment;
  
  // Set edit mode
  isEditing = true;
  editingId = id;
  
  // Update submit button
  document.getElementById('submit-text').textContent = 'Update Feedback';
  document.getElementById('submit').style.background = 'linear-gradient(135deg, #ff6b35 0%, #f77f00 100%)';
  
  // Update character counter
  document.getElementById('char-counter').textContent = currentComment.length;
  
  // Scroll to form
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('studentName').focus();
}

window.deleteFeedback = function(id) {
  console.log('Delete clicked for:', id);
  if (confirm('Delete this feedback?')) {
    const feedbackElement = document.querySelector(`[data-id="${id}"]`);
    if (feedbackElement) {
      feedbackElement.remove();
      updateStats();
    }
  }
};

// Load and display feedback
async function loadFeedback() {
  try {
    const response = await fetch(API_URL);
    allFeedback = await response.json();
    displayFeedback(getFilteredFeedback());
    updateStats();
  } catch (error) {
    console.error('Error loading feedback:', error);
  }
}

// Display feedback
function displayFeedback(feedbackList) {
  feedbackContainer.innerHTML = "";
  
  if (feedbackList.length === 0) {
    noFeedbackDiv.style.display = 'block';
    return;
  }
  
  noFeedbackDiv.style.display = 'none';
  feedbackList.forEach(renderFeedback);
}

// Render individual feedback item
function renderFeedback(item) {
  const div = document.createElement("div");
  div.className = "feedback";
  div.setAttribute('data-id', item.id);
  
  const date = new Date().toLocaleDateString();
  
  div.innerHTML = `
    <div class="feedback-header">
      <div class="feedback-author">
        👤
        ${escapeHtml(item.studentName)}
      </div>
      <div class="feedback-date">${date}</div>
    </div>
    <div class="feedback-content">${escapeHtml(item.comment)}</div>
    <div class="feedback-actions">
      <div class="vote-section">
        <span onclick="voteUp('${item.id}'); return false;" class="vote-btn upvote" title="Upvote" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 20px; font-size: 18px; transition: all 0.3s ease;">
          👍
        </span>
        <div class="vote-count" id="votes-${item.id}">${item.votes}</div>
        <span onclick="voteDown('${item.id}'); return false;" class="vote-btn downvote" title="Downvote" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 20px; font-size: 18px; transition: all 0.3s ease;">
          👎
        </span>
      </div>
      <div class="action-buttons">
        <span onclick="editFeedback('${item.id}'); return false;" class="action-btn edit-btn" title="Edit" style="cursor: pointer; padding: 8px; border-radius: 50%; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease; font-size: 16px;">
          ✏️
        </span>
        <span onclick="deleteFeedback('${item.id}'); return false;" class="action-btn delete-btn" title="Delete" style="cursor: pointer; padding: 8px; border-radius: 50%; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease; font-size: 16px;">
          🗑️
        </span>
      </div>
    </div>
  `;
  
  feedbackContainer.appendChild(div);
}

// Handle edit
function handleEdit(id) {
  const item = allFeedback.find(f => f.id === id);
  if (!item) return;
  
  studentNameInput.value = item.studentName;
  commentInput.value = item.comment;
  isEditing = true;
  editingId = id;
  
  submitText.textContent = 'Update Feedback';
  submitBtn.style.background = 'linear-gradient(135deg, #ff6b35 0%, #f77f00 100%)';
  
  form.scrollIntoView({ behavior: 'smooth' });
  studentNameInput.focus();
}

// Handle delete
async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this feedback?')) return;
  
  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    allFeedback = allFeedback.filter(f => f.id !== id);
    displayFeedback(getFilteredFeedback());
    updateStats();
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();
  
  const studentName = document.getElementById('studentName').value.trim();
  const comment = document.getElementById('comment').value.trim();
  
  if (!studentName || !comment) return;
  
  if (isEditing) {
    // Update existing feedback - DOM only
    const feedbackElement = document.querySelector(`[data-id="${editingId}"]`);
    if (feedbackElement) {
      // Update the displayed content
      const authorElement = feedbackElement.querySelector('.feedback-author');
      const contentElement = feedbackElement.querySelector('.feedback-content');
      
      if (authorElement) authorElement.innerHTML = `👤 ${studentName}`;
      if (contentElement) contentElement.textContent = comment;
      
      console.log('Updated feedback:', editingId, studentName, comment);
    }
  } else {
    // Add new feedback (simplified)
    const newId = Date.now().toString();
    const newFeedback = {
      id: newId,
      studentName,
      comment,
      votes: 0
    };
    
    allFeedback.unshift(newFeedback);
    
    // Add to DOM
    const container = document.getElementById('feedback-container');
    const div = document.createElement('div');
    div.className = 'feedback';
    div.setAttribute('data-id', newId);
    div.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-author">👤 ${studentName}</div>
        <div class="feedback-date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="feedback-content">${comment}</div>
      <div class="feedback-actions">
        <div class="vote-section">
          <span onclick="voteUp('${newId}'); return false;" class="vote-btn upvote" title="Upvote" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 20px; font-size: 18px; transition: all 0.3s ease;">👍</span>
          <div class="vote-count" id="votes-${newId}">0</div>
          <span onclick="voteDown('${newId}'); return false;" class="vote-btn downvote" title="Downvote" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 20px; font-size: 18px; transition: all 0.3s ease;">👎</span>
        </div>
        <div class="action-buttons">
          <span onclick="editFeedback('${newId}'); return false;" class="action-btn edit-btn" title="Edit" style="cursor: pointer; padding: 8px; border-radius: 50%; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease; font-size: 16px;">✏️</span>
          <span onclick="deleteFeedback('${newId}'); return false;" class="action-btn delete-btn" title="Delete" style="cursor: pointer; padding: 8px; border-radius: 50%; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease; font-size: 16px;">🗑️</span>
        </div>
      </div>
    `;
    container.insertBefore(div, container.firstChild);
  }
  
  resetForm();
  updateStats();
}

// Create new feedback
async function createFeedback(studentName, comment) {
  const newFeedback = {
    studentName,
    comment,
    votes: 0,
    timestamp: Date.now()
  };
  
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newFeedback)
  });
  
  const createdFeedback = await response.json();
  allFeedback.unshift(createdFeedback);
  displayFeedback(getFilteredFeedback());
  updateStats();
}

// Update existing feedback
async function updateFeedback(studentName, comment) {
  const oldData = allFeedback.find(f => f.id === editingId);
  
  await fetch(`${API_URL}/${editingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...oldData,
      studentName,
      comment
    })
  });
  
  const feedbackIndex = allFeedback.findIndex(f => f.id === editingId);
  if (feedbackIndex !== -1) {
    allFeedback[feedbackIndex] = { ...allFeedback[feedbackIndex], studentName, comment };
    displayFeedback(getFilteredFeedback());
  }
}

// Reset form
function resetForm() {
  document.getElementById('feedback-form').reset();
  isEditing = false;
  editingId = null;
  document.getElementById('submit-text').textContent = 'Submit Feedback';
  document.getElementById('submit').style.background = 'linear-gradient(135deg, #06d6a0 0%, #118ab2 100%)';
  document.getElementById('char-counter').textContent = '0';
}

// Form validation
function validateForm() {
  const isValid = studentNameInput.value.trim() && commentInput.value.trim();
  submitBtn.disabled = !isValid;
  submitBtn.style.opacity = isValid ? '1' : '0.6';
}

// Toggle theme
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDarkMode);
  
  toggleBtn.innerHTML = isDarkMode 
    ? '☀️<span>Light Mode</span>'
    : '🌙<span>Dark Mode</span>';
}

// Handle sorting
function handleSort() {
  displayFeedback(getFilteredFeedback());
}

// Handle search
function handleSearch() {
  displayFeedback(getFilteredFeedback());
}

// Get filtered and sorted feedback
function getFilteredFeedback() {
  let filtered = [...allFeedback];
  
  // Apply search filter
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(item => 
      item.studentName.toLowerCase().includes(searchTerm) ||
      item.comment.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply sorting
  const sortBy = sortFilter.value;
  switch (sortBy) {
    case 'newest':
      filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      break;
    case 'oldest':
      filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      break;
    case 'most-voted':
      filtered.sort((a, b) => b.votes - a.votes);
      break;
    case 'least-voted':
      filtered.sort((a, b) => a.votes - b.votes);
      break;
  }
  
  return filtered;
}

// Update statistics
function updateStats() {
  const total = document.querySelectorAll('.feedback').length;
  document.getElementById('total-feedback').textContent = `${total} Feedback${total !== 1 ? 's' : ''}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}