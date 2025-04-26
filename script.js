// script.js - Main JavaScript functionality for mentorship system

// Global variables
let currentUser = null;

// DOM ready event
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const userString = localStorage.getItem("currentUser");
    if (userString) {
        currentUser = JSON.parse(userString);
        
        // Get current page
        const currentPage = window.location.pathname.split("/").pop();
        
        // Only redirect if we're not already on the correct dashboard
        if (currentPage !== "mentor_dashboard.html" && currentPage !== "mentee_dashboard.html") {
            redirectToDashboard();
        }
    }
    
    // Set up event listeners based on the current page
    const currentPage = window.location.pathname.split("/").pop();
    
    if (currentPage === "" || currentPage === "index.html") {
        // If already logged in, redirect to dashboard instead of showing login page
        if (currentUser) {
            redirectToDashboard();
        } else {
            setupLoginPage();
        }
    } else if (currentPage === "register_mentor.html") {
        setupMentorRegistrationPage();
    } else if (currentPage === "register_mentee.html") {
        setupMenteeRegistrationPage();
    } else if (currentPage === "mentor_dashboard.html") {
        if (!currentUser || currentUser.role !== "mentor") {
            window.location.href = "index.html";
        } else {
            setupMentorDashboard();
        }
    } else if (currentPage === "mentee_dashboard.html") {
        if (!currentUser || currentUser.role !== "mentee") {
            window.location.href = "index.html";
        } else {
            setupMenteeDashboard();
        }
    }
});

// Login page setup
function setupLoginPage() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            
            login(username, password);
        });
    }
}


// Mentor registration page setup
function setupMentorRegistrationPage() {
    const registerForm = document.getElementById("register-mentor-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;
            const department = document.getElementById("department").value;
            
            registerMentor(username, password, name, email, phone, department);
        });
    }
}

// Mentee registration page setup
function setupMenteeRegistrationPage() {
    const registerForm = document.getElementById("register-mentee-form");
    if (registerForm) {
        // Load mentors for dropdown
        loadMentors().then(mentors => {
            const mentorSelect = document.getElementById("mentor");
            mentors.forEach(mentor => {
                const option = document.createElement("option");
                option.value = mentor.username;
                option.textContent = mentor.name;
                mentorSelect.appendChild(option);
            });
        });
        
        registerForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;
            const department = document.getElementById("department").value;
            const year = document.getElementById("year").value;
            const digitalId = document.getElementById("digital-id").value;
            const registrationNumber = document.getElementById("registration-number").value;
            const parentContact = document.getElementById("parent-contact").value;
            const mentorUsername = document.getElementById("mentor").value;
            
            registerMentee(username, password, name, email, phone, department, 
                          year, digitalId, registrationNumber, parentContact, mentorUsername);
        });
    }
}

// Mentor dashboard setup
function setupMentorDashboard() {
    // Set user name
    document.getElementById("user-name").textContent = currentUser.name;
    
    // Setup logout button
    document.getElementById("logout-button").addEventListener("click", logout);
    
    // Setup tabs
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            const tabId = this.getAttribute("data-tab");
            
            // Hide all tabs
            const tabContents = document.querySelectorAll(".tab-content");
            tabContents.forEach(tab => tab.classList.remove("active"));
            
            // Deactivate all buttons
            tabButtons.forEach(btn => btn.classList.remove("active"));
            
            // Activate the selected tab and button
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");
            
            // Load tab data
            if (tabId === "mentees-tab") {
                loadMentees();
            }
        });
    });
    
    // Activate the first tab by default
    tabButtons[0].click();
    
    // Setup modals
    setupModals();
}

// Mentee dashboard setup
// Fix for the setupMenteeDashboard function to properly handle tabs
function setupMenteeDashboard() {
    // Set user name
    document.getElementById("user-name").textContent = currentUser.name;
    
    // Setup logout button
    document.getElementById("logout-button").addEventListener("click", logout);
    
    // Setup tabs
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            const tabId = this.getAttribute("data-tab");
            
            // Hide all tabs
            const tabContents = document.querySelectorAll(".tab-content");
            tabContents.forEach(tab => tab.classList.remove("active"));
            
            // Deactivate all buttons
            tabButtons.forEach(btn => btn.classList.remove("active"));
            
            // Activate the selected tab and button
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");
            
            // Load tab data
            if (tabId === "tasks-tab") {
                loadTasks();
            } else if (tabId === "meetings-tab") {
                loadMeetingNotes();
            } else if (tabId === "profile-tab") {
                loadProfile();
            }
        });
    });
    
    // Activate the first tab by default
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
    
    // Add separate modal setup for mentee dashboard
    setupMenteeModals();
}

function setupMenteeModals() {
    // Close button for all modals
    const closeButtons = document.querySelectorAll(".close-button");
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const modal = this.closest(".modal");
            modal.style.display = "none";
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });
    
    // Edit profile button setup
    const editProfileButton = document.getElementById("edit-profile-button");
    if (editProfileButton) {
        editProfileButton.addEventListener("click", function() {
            document.getElementById("profile-modal").style.display = "block";
        });
    }
}

// Modal setup
function setupModals() {
    // Close button for all modals
    const closeButtons = document.querySelectorAll(".close-button");
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const modal = this.closest(".modal");
            modal.style.display = "none";
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });
    
    // Task modal setup
    const addTaskButton = document.getElementById("add-task-button");
    if (addTaskButton) {
        addTaskButton.addEventListener("click", function() {
            document.getElementById("task-modal").style.display = "block";
            document.getElementById("task-form").reset();
            document.getElementById("task-form-title").textContent = "Add New Task";
            
            // Set the form submission handler
            const taskForm = document.getElementById("task-form");
            taskForm.removeEventListener("submit", taskFormHandler);
            taskForm.addEventListener("submit", taskFormHandler);
        });
    }
    
    // Meeting note modal setup
    const addMeetingButton = document.getElementById("add-meeting-button");
    if (addMeetingButton) {
        addMeetingButton.addEventListener("click", function() {
            document.getElementById("meeting-modal").style.display = "block";
            document.getElementById("meeting-form").reset();
            document.getElementById("meeting-form-title").textContent = "Add New Meeting Note";
            
            // Set the form submission handler
            const meetingForm = document.getElementById("meeting-form");
            meetingForm.removeEventListener("submit", meetingFormHandler);
            meetingForm.addEventListener("submit", meetingFormHandler);
        });
    }
}

// Form submission handlers
function taskFormHandler(e) {
    e.preventDefault();
    
    const menteeUsername = document.getElementById("task-mentee").value;
    const description = document.getElementById("task-description").value;
    const dueDate = document.getElementById("task-due-date").value;
    
    addTask(menteeUsername, description, dueDate);
}

function meetingFormHandler(e) {
    e.preventDefault();
    
    const menteeUsername = document.getElementById("meeting-mentee").value;
    const date = document.getElementById("meeting-date").value;
    const summary = document.getElementById("meeting-summary").value;
    
    addMeetingNote(menteeUsername, date, summary);
}

// API Functions
async function login(username, password) {
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = {
                username: data.username,
                name: data.name,
                role: data.role
            };
            
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            redirectToDashboard();
        } else {
            showError("Invalid username or password");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function logout() {
    try {
        await fetch("/api/logout", {
            method: "POST"
        });
        
        localStorage.removeItem("currentUser");
        currentUser = null;
        window.location.href = "index.html";
    } catch (error) {
        showError("Logout failed. Please try again.");
    }
}

async function registerMentor(username, password, name, email, phone, department) {
    try {
        // Validate inputs
        if (!validateEmail(email) || !validatePhone(phone)) {
            showError("Invalid email or phone number format");
            return;
        }
        
        const response = await fetch("/api/register_mentor", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&` +
                  `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&` +
                  `phone=${encodeURIComponent(phone)}&department=${encodeURIComponent(department)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Registration successful! Please log in.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            showError(data.message || "Registration failed");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function registerMentee(username, password, name, email, phone, department, 
                             year, digitalId, registrationNumber, parentContact, mentorUsername) {
    try {
        // Validate inputs
        if (!validateEmail(email) || !validatePhone(phone) || 
            !validateDigitalId(digitalId) || !validateRegistrationNumber(registrationNumber)) {
            showError("Invalid input format");
            return;
        }
        
        const response = await fetch("/api/register_mentee", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&` +
                  `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&` +
                  `phone=${encodeURIComponent(phone)}&department=${encodeURIComponent(department)}&` +
                  `year=${encodeURIComponent(year)}&digitalId=${encodeURIComponent(digitalId)}&` +
                  `registrationNumber=${encodeURIComponent(registrationNumber)}&` +
                  `parentContact=${encodeURIComponent(parentContact)}&` +
                  `mentorUsername=${encodeURIComponent(mentorUsername)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Registration successful! Please log in.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            showError(data.message || "Registration failed");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function loadMentors() {
    try {
        const response = await fetch("/api/mentors");
        const data = await response.json();
        
        if (data.success) {
            return data.mentors;
        } else {
            showError(data.message || "Failed to load mentors");
            return [];
        }
    } catch (error) {
        showError("Server error. Please try again later.");
        return [];
    }
}

async function loadMentees() {
    try {
        const response = await fetch(`/api/mentee_details?mentor=${encodeURIComponent(currentUser.username)}`);
        const data = await response.json();
        
        if (data.success) {
            const menteesList = document.getElementById("mentees-list");
            menteesList.innerHTML = "";
            
            if (data.mentees.length === 0) {
                menteesList.innerHTML = "<p>No mentees assigned yet.</p>";
                return;
            }
            
            data.mentees.forEach(mentee => {
                const menteeItem = document.createElement("div");
                menteeItem.className = "list-item";
                menteeItem.innerHTML = `
                    <div class="mentee-header">
                        <h3>${mentee.name}</h3>
                        <p><strong>Year:</strong> ${mentee.year} | 
                           <strong>Department:</strong> ${mentee.department}</p>
                    </div>
                    <div class="mentee-details">
                        <div class="contact-info">
                            <h4>Contact Information</h4>
                            <p><strong>Email:</strong> ${mentee.email}</p>
                            <p><strong>Phone:</strong> ${mentee.phone}</p>
                        </div>
                        <div class="academic-info">
                            <h4>Academic Details</h4>
                            <p><strong>Digital ID:</strong> ${mentee.digitalId}</p>
                            <p><strong>Registration Number:</strong> ${mentee.registrationNumber}</p>
                        </div>
                        <div class="mentorship-info">
                            <h4>Mentorship Details</h4>
                            <p><strong>Parent Contact:</strong> ${mentee.parentContact}</p>
                            <p><strong>Mentor:</strong> ${mentee.mentorName}</p>
                            <p><strong>Meetings:</strong> ${mentee.meetingCount} | 
                               <strong>Tasks:</strong> ${mentee.taskCount}</p>
                        </div>
                    </div>
                    <div class="button-group">
                        <button class="view-tasks" data-username="${mentee.username}">View Tasks</button>
                        <button class="view-meetings" data-username="${mentee.username}">View Meetings</button>
                        <button class="add-task" data-username="${mentee.username}">Add Task</button>
                        <button class="add-meeting" data-username="${mentee.username}">Add Meeting Note</button>
                    </div>
                `;
                
                menteesList.appendChild(menteeItem);
                
                // Add event listeners (keep existing event listeners from previous implementation)
                menteeItem.querySelector(".view-tasks").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    viewMenteeTasks(username);
                });
                
                menteeItem.querySelector(".view-meetings").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    viewMenteeMeetings(username);
                });
                
                menteeItem.querySelector(".add-task").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    document.getElementById("task-modal").style.display = "block";
                    document.getElementById("task-form").reset();
                    document.getElementById("task-mentee").value = username;
                    document.getElementById("task-form-title").textContent = `Add Task for ${mentee.name}`;
                    
                    // Set the form submission handler
                    const taskForm = document.getElementById("task-form");
                    taskForm.removeEventListener("submit", taskFormHandler);
                    taskForm.addEventListener("submit", taskFormHandler);
                });
                
                menteeItem.querySelector(".add-meeting").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    document.getElementById("meeting-modal").style.display = "block";
                    document.getElementById("meeting-form").reset();
                    document.getElementById("meeting-mentee").value = username;
                    document.getElementById("meeting-form-title").textContent = `Add Meeting Note for ${mentee.name}`;
                    
                    // Set the form submission handler
                    const meetingForm = document.getElementById("meeting-form");
                    meetingForm.removeEventListener("submit", meetingFormHandler);
                    meetingForm.addEventListener("submit", meetingFormHandler);
                });
            });
        } else {
            showError(data.message || "Failed to load mentees");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function viewMenteeTasks(menteeUsername) {
    try {
        const response = await fetch(`/api/tasks?mentee=${encodeURIComponent(menteeUsername)}`);
        const data = await response.json();
        
        if (data.success) {
            const tasksList = document.getElementById("tasks-list");
            tasksList.innerHTML = "";
            
            if (data.tasks.length === 0) {
                tasksList.innerHTML = "<p>No tasks assigned yet.</p>";
                return;
            }
            
            data.tasks.forEach((task, index) => {
                const taskItem = document.createElement("div");
                taskItem.className = "list-item";
                taskItem.innerHTML = `
                    <h3>${task.description}</h3>
                    <p><strong>Due Date:</strong> ${task.dueDate}</p>
                    <div class="button-group">
                        <button class="edit-task" data-index="${index}" data-mentee="${menteeUsername}">Edit</button>
                        <button class="delete-task delete" data-index="${index}" data-mentee="${menteeUsername}">Delete</button>
                    </div>
                `;
                
                tasksList.appendChild(taskItem);
                
                // Add event listeners
                taskItem.querySelector(".delete-task").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    deleteTask(mentee, index);
                });
                
                taskItem.querySelector(".edit-task").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    
                    document.getElementById("task-modal").style.display = "block";
                    document.getElementById("task-form").reset();
                    document.getElementById("task-mentee").value = mentee;
                    document.getElementById("task-description").value = task.description;
                    document.getElementById("task-due-date").value = task.dueDate;
                    document.getElementById("task-form-title").textContent = "Edit Task";
                    
                    // Set the form submission handler
                    const taskForm = document.getElementById("task-form");
                    taskForm.removeEventListener("submit", taskFormHandler);
                    taskForm.addEventListener("submit", function(e) {
                        e.preventDefault();
                        
                        const menteeUsername = document.getElementById("task-mentee").value;
                        const description = document.getElementById("task-description").value;
                        const dueDate = document.getElementById("task-due-date").value;
                        
                        editTask(menteeUsername, index, description, dueDate);
                    });
                });
            });
            
            // Show tasks tab
            document.getElementById("mentees-tab").classList.remove("active");
            document.getElementById("tasks-tab").classList.add("active");
            
            document.querySelector(".tab-button[data-tab='mentees-tab']").classList.remove("active");
            document.querySelector(".tab-button[data-tab='tasks-tab']").classList.add("active");
        } else {
            showError(data.message || "Failed to load tasks");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function viewMenteeMeetings(menteeUsername) {
    try {
        const response = await fetch(`/api/meetings?mentee=${encodeURIComponent(menteeUsername)}`);
        const data = await response.json();
        
        if (data.success) {
            const meetingsList = document.getElementById("meetings-list");
            meetingsList.innerHTML = "";
            
            if (data.meetings.length === 0) {
                meetingsList.innerHTML = "<p>No meeting notes yet.</p>";
                return;
            }
            
            data.meetings.forEach((meeting, index) => {
                const meetingItem = document.createElement("div");
                meetingItem.className = "list-item";
                meetingItem.innerHTML = `
                    <h3>Meeting on ${meeting.date}</h3>
                    <p>${meeting.summary}</p>
                    <div class="button-group">
                        <button class="edit-meeting" data-index="${index}" data-mentee="${menteeUsername}">Edit</button>
                        <button class="delete-meeting delete" data-index="${index}" data-mentee="${menteeUsername}">Delete</button>
                    </div>
                `;
                
                meetingsList.appendChild(meetingItem);
                
                // Add event listeners
                meetingItem.querySelector(".delete-meeting").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    deleteMeetingNote(mentee, index);
                });
                
                meetingItem.querySelector(".edit-meeting").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    
                    document.getElementById("meeting-modal").style.display = "block";
                    document.getElementById("meeting-form").reset();
                    document.getElementById("meeting-mentee").value = mentee;
                    document.getElementById("meeting-date").value = meeting.date;
                    document.getElementById("meeting-summary").value = meeting.summary;
                    document.getElementById("meeting-form-title").textContent = "Edit Meeting Note";
                    
                    // Set the form submission handler
                    const meetingForm = document.getElementById("meeting-form");
                    meetingForm.removeEventListener("submit", meetingFormHandler);
                    meetingForm.addEventListener("submit", function(e) {
                        e.preventDefault();
                        
                        const menteeUsername = document.getElementById("meeting-mentee").value;
                        const date = document.getElementById("meeting-date").value;
                        const summary = document.getElementById("meeting-summary").value;
                        
                        editMeetingNote(menteeUsername, index, date, summary);
                    });
                });
            });
            
            // Show meetings tab
            document.getElementById("mentees-tab").classList.remove("active");
            document.getElementById("meetings-tab").classList.add("active");
            
            document.querySelector(".tab-button[data-tab='mentees-tab']").classList.remove("active");
            document.querySelector(".tab-button[data-tab='meetings-tab']").classList.add("active");
        } else {
            showError(data.message || "Failed to load meeting notes");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^\d{10}$/;
    return re.test(phone);
}

function validateDigitalId(digitalId) {
    const re = /^\d{7}$/;
    return re.test(digitalId);
}

function validateRegistrationNumber(registrationNumber) {
    const re = /^\d{13}$/;
    return re.test(registrationNumber);
}

// Utility functions
function redirectToDashboard() {
    if (currentUser) {
        if (currentUser.role === "mentor") {
            window.location.href = "mentor_dashboard.html";
        } else if (currentUser.role === "mentee") {
            window.location.href = "mentee_dashboard.html";
        }
    }
}

function showError(message) {
    const errorElement = document.querySelector(".error-message");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        
        // Hide the message after 5 seconds
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successElement = document.querySelector(".success-message");
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = "block";
        
        // Hide the message after 5 seconds
        setTimeout(() => {
            successElement.style.display = "none";
        }, 5000);
    } else {
        alert(message);
    }
}

// Load tasks for mentee
async function loadTasks() {
    try {
        const response = await fetch(`/api/tasks?mentee=${encodeURIComponent(currentUser.username)}`);
        const data = await response.json();
        
        if (data.success) {
            const tasksList = document.getElementById("tasks-list");
            tasksList.innerHTML = "";
            
            if (data.tasks.length === 0) {
                tasksList.innerHTML = "<p>No tasks assigned yet.</p>";
                return;
            }
            
            data.tasks.forEach(task => {
                const taskItem = document.createElement("div");
                taskItem.className = "list-item";
                taskItem.innerHTML = `
                    <h3>${task.description}</h3>
                    <p><strong>Due Date:</strong> ${task.dueDate}</p>
                `;
                
                tasksList.appendChild(taskItem);
            });
        } else {
            showError(data.message || "Failed to load tasks");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Load meeting notes for mentee
async function loadMeetingNotes() {
    try {
        const response = await fetch(`/api/meetings?mentee=${encodeURIComponent(currentUser.username)}`);
        const data = await response.json();
        
        if (data.success) {
            const meetingsList = document.getElementById("meetings-list");
            meetingsList.innerHTML = "";
            
            if (data.meetings.length === 0) {
                meetingsList.innerHTML = "<p>No meeting notes yet.</p>";
                return;
            }
            
            data.meetings.forEach(meeting => {
                const meetingItem = document.createElement("div");
                meetingItem.className = "list-item";
                meetingItem.innerHTML = `
                    <h3>Meeting on ${meeting.date}</h3>
                    <p>${meeting.summary}</p>
                `;
                
                meetingsList.appendChild(meetingItem);
            });
        } else {
            showError(data.message || "Failed to load meeting notes");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Load profile for mentee
async function loadProfile() {
    try {
        const response = await fetch(`/api/profile?username=${encodeURIComponent(currentUser.username)}`);
        const data = await response.json();
        
        if (data.success) {
            const profileContainer = document.getElementById("profile-container");
            const profile = data.profile;
            
            profileContainer.innerHTML = `
                <div class="profile-info">
                    <p><strong>Name:</strong> ${profile.name}</p>
                    <p><strong>Email:</strong> ${profile.email}</p>
                    <p><strong>Phone:</strong> ${profile.phone}</p>
                    <p><strong>Department:</strong> ${profile.department}</p>
                    <p><strong>Year:</strong> ${profile.year}</p>
                    <p><strong>Digital ID:</strong> ${profile.digitalId}</p>
                    <p><strong>Registration Number:</strong> ${profile.registrationNumber}</p>
                    <p><strong>Parent Contact:</strong> ${profile.parentContact}</p>
                    <p><strong>Mentor:</strong> ${profile.mentorName}</p>
                </div>
            `;
            
            // Set up edit profile button
            document.getElementById("edit-profile-button").addEventListener("click", function() {
                document.getElementById("profile-modal").style.display = "block";
                
                // Fill in current values
                document.getElementById("edit-name").value = profile.name;
                document.getElementById("edit-email").value = profile.email;
                document.getElementById("edit-phone").value = profile.phone;
                document.getElementById("edit-department").value = profile.department;
                document.getElementById("edit-year").value = profile.year;
                document.getElementById("edit-digital-id").value = profile.digitalId;
                document.getElementById("edit-registration-number").value = profile.registrationNumber;
                document.getElementById("edit-parent-contact").value = profile.parentContact;
                
                // Set up form submission
                const profileForm = document.getElementById("profile-form");
                profileForm.addEventListener("submit", function(e) {
                    e.preventDefault();
                    
                    const name = document.getElementById("edit-name").value;
                    const email = document.getElementById("edit-email").value;
                    const phone = document.getElementById("edit-phone").value;
                    const department = document.getElementById("edit-department").value;
                    const year = document.getElementById("edit-year").value;
                    const digitalId = document.getElementById("edit-digital-id").value;
                    const registrationNumber = document.getElementById("edit-registration-number").value;
                    const parentContact = document.getElementById("edit-parent-contact").value;
                    
                    updateProfile(name, email, phone, department, year, digitalId, registrationNumber, parentContact);
                });
            });
        } else {
            showError(data.message || "Failed to load profile");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Update profile
async function updateProfile(name, email, phone, department, year, digitalId, registrationNumber, parentContact) {
    try {
        // Validate inputs
        if (!validateEmail(email) || !validatePhone(phone) || 
            !validateDigitalId(digitalId) || !validateRegistrationNumber(registrationNumber)) {
            showError("Invalid input format");
            return;
        }
        
        const response = await fetch("/api/update_profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `username=${encodeURIComponent(currentUser.username)}&` +
                  `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&` +
                  `phone=${encodeURIComponent(phone)}&department=${encodeURIComponent(department)}&` +
                  `year=${encodeURIComponent(year)}&digitalId=${encodeURIComponent(digitalId)}&` +
                  `registrationNumber=${encodeURIComponent(registrationNumber)}&` +
                  `parentContact=${encodeURIComponent(parentContact)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("profile-modal").style.display = "none";
            showSuccess("Profile updated successfully!");
            loadProfile();  // Reload the profile
        } else {
            showError(data.message || "Failed to update profile");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Task operations
async function addTask(menteeUsername, description, dueDate) {
    try {
        // Validate date
        if (!validateDate(dueDate)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/add_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `description=${encodeURIComponent(description)}&` +
                  `dueDate=${encodeURIComponent(dueDate)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("task-modal").style.display = "none";
            showSuccess("Task added successfully!");
            
            // Reload tasks if we're on the tasks tab
            if (document.getElementById("tasks-tab").classList.contains("active")) {
                viewMenteeTasks(menteeUsername);
            }
        } else {
            showError(data.message || "Failed to add task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function editTask(menteeUsername, taskIndex, description, dueDate) {
    try {
        // Validate date
        if (!validateDate(dueDate)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/edit_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `index=${encodeURIComponent(taskIndex)}&` +
                  `description=${encodeURIComponent(description)}&` +
                  `dueDate=${encodeURIComponent(dueDate)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("task-modal").style.display = "none";
            showSuccess("Task updated successfully!");
            viewMenteeTasks(menteeUsername);
        } else {
            showError(data.message || "Failed to update task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function deleteTask(menteeUsername, taskIndex) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }
    
    try {
        const response = await fetch("/api/delete_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `index=${encodeURIComponent(taskIndex)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Task deleted successfully!");
            viewMenteeTasks(menteeUsername);
        } else {
            showError(data.message || "Failed to delete task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Meeting note operations
async function addMeetingNote(menteeUsername, date, summary) {
    try {
        // Validate date
        if (!validateDate(date)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/add_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `date=${encodeURIComponent(date)}&` +
                  `summary=${encodeURIComponent(summary)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("meeting-modal").style.display = "none";
            showSuccess("Meeting note added successfully!");
            
            // Reload meetings if we're on the meetings tab
            if (document.getElementById("meetings-tab").classList.contains("active")) {
                viewMenteeMeetings(menteeUsername);
            } else {
                // If we're on the mentees tab, reload it to update the meeting count
                loadMentees();
            }
        } else {
            showError(data.message || "Failed to add meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function editMeetingNote(menteeUsername, noteIndex, date, summary) {
    try {
        // Validate date
        if (!validateDate(date)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/edit_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `index=${encodeURIComponent(noteIndex)}&` +
                  `date=${encodeURIComponent(date)}&` +
                  `summary=${encodeURIComponent(summary)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("meeting-modal").style.display = "none";
            showSuccess("Meeting note updated successfully!");
            viewMenteeMeetings(menteeUsername);
        } else {
            showError(data.message || "Failed to update meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function deleteMeetingNote(menteeUsername, noteIndex) {
    if (!confirm("Are you sure you want to delete this meeting note?")) {
        return;
    }
    
    try {
        const response = await fetch("/api/delete_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `mentee=${encodeURIComponent(menteeUsername)}&` +
                  `index=${encodeURIComponent(noteIndex)}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Meeting note deleted successfully!");
            viewMenteeMeetings(menteeUsername);
        } else {
            showError(data.message || "Failed to delete meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

// Date validation
function validateDate(date) {
    const re = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    return re.test(date);
}