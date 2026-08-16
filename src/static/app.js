document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const userIcon = document.getElementById("user-icon");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessageDiv = document.getElementById("login-message");
  const closeBtn = document.querySelector(".close-btn");
  const teacherPanel = document.getElementById("teacher-panel");
  const logoutBtn = document.getElementById("logout-btn");
  const loggedUsername = document.getElementById("logged-username");
  const teacherRequiredMsg = document.getElementById("teacher-required-msg");

  let currentUser = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons if teacher is logged in
        let participantsHTML;
        if (details.participants.length > 0) {
          const participantsList = details.participants
            .map((email) => {
              let html = `<li><span class="participant-email">${email}</span>`;
              if (currentUser) {
                html += `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`;
              }
              html += `</li>`;
              return html;
            })
            .join("");
          
          participantsHTML = `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>`;
        } else {
          participantsHTML = `<p><em>No participants yet</em></p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality (teacher only)
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}&teacher=${encodeURIComponent(currentUser)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission (teacher only)
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}&teacher=${encodeURIComponent(currentUser)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle login modal
  userIcon.addEventListener("click", () => {
    if (currentUser) {
      // Show logout panel
      teacherPanel.classList.remove("hidden");
    } else {
      // Show login modal
      loginModal.classList.remove("hidden");
    }
  });

  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.add("hidden");
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        currentUser = username;
        loggedUsername.textContent = username;
        loginMessageDiv.textContent = "Logged in successfully!";
        loginMessageDiv.className = "success";
        loginMessageDiv.classList.remove("hidden");

        // Hide login modal and show teacher panel
        setTimeout(() => {
          loginModal.classList.add("hidden");
          teacherPanel.classList.remove("hidden");
        }, 1000);

        // Show signup form and hide teacher-required message
        signupForm.classList.remove("hidden");
        teacherRequiredMsg.classList.add("hidden");

        // Update UI
        userIcon.textContent = "✅";
        userIcon.title = "Logout";
        loginForm.reset();
        
        // Refresh activities to show delete buttons
        fetchActivities();
      } else {
        loginMessageDiv.textContent = result.detail || "Login failed";
        loginMessageDiv.className = "error";
        loginMessageDiv.classList.remove("hidden");
      }
    } catch (error) {
      loginMessageDiv.textContent = "Failed to login. Please try again.";
      loginMessageDiv.className = "error";
      loginMessageDiv.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(
        `/auth/logout?username=${encodeURIComponent(currentUser)}`,
        {
          method: "POST",
        }
      );

      currentUser = null;
      teacherPanel.classList.add("hidden");
      
      // Hide signup form and show teacher-required message
      signupForm.classList.add("hidden");
      teacherRequiredMsg.classList.remove("hidden");

      // Update UI
      userIcon.textContent = "👤";
      userIcon.title = "Login";
      
      // Refresh activities to remove delete buttons
      fetchActivities();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  // Initialize app
  // Show teacher-required message by default
  teacherRequiredMsg.classList.remove("hidden");
  signupForm.classList.add("hidden");
  fetchActivities();
});
