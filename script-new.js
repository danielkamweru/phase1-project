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
const API_URL = "http://localhost:3000/feedback";
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
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
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
    if (e.target.closest('.upvote')) {
      e.preventDefault();
      e.stopPropagation();
      const id = e.target.closest('.upvote').dataset.id;
      updateVoteCount(id, true);
    }
    if (e.target.closest('.downvote')) {
      e.preventDefault();
      e.stopPropagation();
      const id = e.target.closest('.downvote').dataset.id;
      updateVoteCount(id, false);
    }
    if (e.target.closest('.edit-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const id = e.target.closest('.edit-btn').dataset.id;
      handleEdit(id);
    }
    if (e.target.closest('.delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const id = e.target.closest('.delete-btn').dataset.id;
      handleDelete(id);
    }
  });
  
  sortFilter.addEventListener("change", handleSort);
  searchInput.addEventListener("input", handleSearch);
  
  // Real-time validation
  studentNameInput.addEventListener('input', validateForm);
  commentInput.addEventListener('input', validateForm);
}

// Simple vote count update - NO REFRESH
function updateVoteCount(id, isUpvote) {
  const voteElement = document.querySelector(`[data-id="${id}"]`).closest('.feedback').querySelector('.vote-count');
  const currentVotes = parseInt(voteElement.textContent);
  const newVotes = isUpvote ? currentVotes + 1 : currentVotes - 1;
  voteElement.textContent = newVotes;
  
  // Update server silently
  fetch(`${API_URL}/${id}`)
    .then(res => res.json())
    .then(item => {
      fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, votes: newVotes })
      });
    })
    .catch(err => console.log('Update failed:', err));
}

// Load and display feedback
async function loadFeedback() {
  try {
    const response = await fetch(API_URL);
    allFeedback = await response.json();
    displayFeedback(allFeedback);
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
        <i class="fas fa-user-circle"></i>
        ${escapeHtml(item.studentName)}
      </div>
      <div class="feedback-date">${date}</div>
    </div>
    <div class="feedback-content">${escapeHtml(item.comment)}</div>
    <div class="feedback-actions">
      <div class="vote-section">
        <button type="button" class="vote-btn upvote" data-id="${item.id}" title="Upvote">
          <i class="fas fa-thumbs-up"></i>
        </button>
        <div class="vote-count">${item.votes}</div>
        <button type="button" class="vote-btn downvote" data-id="${item.id}" title="Downvote">
          <i class="fas fa-thumbs-down"></i>
        </button>
      </div>
      <div class="action-buttons">
        <button type="button" class="action-btn edit-btn" data-id="${item.id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="action-btn delete-btn" data-id="${item.id}" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
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
async function handleSubmit(e) {
  e.preventDefault();
  
  const studentName = studentNameInput.value.trim();
  const comment = commentInput.value.trim();
  
  if (!studentName || !comment) return;
  
  submitText.textContent = 'Submitting...';
  submitBtn.disabled = true;
  
  try {
    if (isEditing) {
      await updateFeedback(studentName, comment);
    } else {
      await createFeedback(studentName, comment);
    }
    resetForm();
  } catch (error) {
    console.error('Submit failed:', error);
  } finally {
    submitText.textContent = isEditing ? 'Update Feedback' : 'Submit Feedback';
    submitBtn.disabled = false;
  }
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
  form.reset();
  isEditing = false;
  editingId = null;
  submitText.textContent = 'Submit Feedback';
  submitBtn.style.background = 'linear-gradient(135deg, #06d6a0 0%, #118ab2 100%)';
  charCounter.textContent = '0';
  validateForm();
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
    ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
    : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
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
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(item => 
      item.studentName.toLowerCase().includes(searchTerm) ||
      item.comment.toLowerCase().includes(searchTerm)
    );
  }
  
  const sortBy = sortFilter.value;
  switch (sortBy) {
    case 'newest':
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      break;
    case 'oldest':
      filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
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
  const total = allFeedback.length;
  totalFeedbackSpan.textContent = `${total} Feedback${total !== 1 ? 's' : ''}`;
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