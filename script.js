
const feedbackContainer = document.getElementById("feedback-container");
const form = document.getElementById("feedback-form");
const toggleBtn = document.getElementById("toggle-mode");
const studentNameInput = document.getElementById("studentName");
const commentInput = document.getElementById("comment");
const API_URL = "http://localhost:3000/feedback";
let isEditing = false;
let editingId = null;
// Load all feedback
function loadFeedback() {
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      feedbackContainer.innerHTML = "";
      data.forEach(renderFeedback);
    });
}
// Render individual feedback
function renderFeedback(item) {
  const div = document.createElement("div");
  div.className = "feedback";
  div.innerHTML = `
    <p><strong>${item.studentName}</strong>: ${item.comment}</p>
    <p class="votes">Votes: <span>${item.votes}</span></p>
    <button class="upvote" data-id="${item.id}">👍 Upvote</button>
    <button class="downvote" data-id="${item.id}">👎 Downvote</button>
    <button class="edit" data-id="${item.id}"> ✏️Edit</button>
    <button class="delete" data-id="${item.id}">🗑️ Delete</button>
  `;
  feedbackContainer.appendChild(div);
}
// Handle voting, edit, delete
feedbackContainer.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  // Voting
  if (e.target.classList.contains("upvote") || e.target.classList.contains("downvote")) {
    const isUpvote = e.target.classList.contains("upvote");

    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((item) => {
        const newVotes = isUpvote ? item.votes + 1 : item.votes - 1;
        return fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, votes: newVotes })
        });
      })
      .then(() => loadFeedback());
  }
  // Delete
  if (e.target.classList.contains("delete")) {
    fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    })
      .then(() => loadFeedback());
  }
  // Edit
  if (e.target.classList.contains("edit")) {
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((item) => {
        studentNameInput.value = item.studentName;
        commentInput.value = item.comment;
        isEditing = true;
        editingId = item.id;
      });
  }
});
// Submit form (create or edit)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const studentName = studentNameInput.value.trim();
  const comment = commentInput.value.trim();
  if (!studentName || !comment) return;
  if (isEditing) {
    // Edit feedback (PUT) after clicking it directs you to the feedback of the person you selected.
    fetch(`${API_URL}/${editingId}`)
      .then((res) => res.json())
      .then((oldData) => {
        return fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...oldData,
            studentName,
            comment
          })
        });
      })
      .then(() => {
        isEditing = false;
        editingId = null;
        form.reset();
        loadFeedback();
      });
  } else {
    // New feedback (POST)
    const newFeedback = {
      studentName,
      comment,
      votes: 0
    };
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFeedback)
    })
  }
});
// Toggle dark/light mode
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
// Initial load
loadFeedback();

          

