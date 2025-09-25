const feedbackContainer = document.getElementById("feedback-container");
const form = document.getElementById("feedback-form");
const toggleBtn = document.getElementById("toggle-mode");

const API_URL = "http://localhost:3000/feedback";

// 1. Fetch and render feedback
function loadFeedback() {
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      feedbackContainer.innerHTML = "";
      data.forEach(renderFeedback);
    });
}
function renderFeedback(item) {
  const div = document.createElement("div");
  div.className = "feedback";
  div.innerHTML = `
    <p><strong>${item.studentName}</strong>: ${item.comment}</p>
    <p class="votes">Votes: <span>${item.votes}</span></p>
    <button class="upvote" data-id="${item.id}">👍 Upvote</button>
    <button class="downvote" data-id="${item.id}">👎 Downvote</button>
  `;
  feedbackContainer.appendChild(div);
}
// 2. Upvote and Downvote (PUT)
feedbackContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("upvote") || e.target.classList.contains("downvote")) {
    const id = e.target.dataset.id;
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
});
// 3. Form submit (POST)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const newFeedback = {
    studentName: document.getElementById("studentName").value,
    comment: document.getElementById("comment").value,
    votes: 0
  };
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newFeedback)
  })
    .then(() => {
      form.reset();
      loadFeedback();
    });
});
// 4. Toggle dark/light mode
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
// Initialize 
loadFeedback();
