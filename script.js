// Global variables
let currentUser = null;
let currentMenteeName = "";

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
            const parentName = document.getElementById("parent-name").value;
            const parentEmail = document.getElementById("parent-email").value;
            const parentContact = document.getElementById("parent-contact").value;
            const mentorUsername = document.getElementById("mentor").value;
            
            registerMentee(username, password, name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact, mentorUsername);
        });
    }
}


function setupMentorDashboard() {
    document.getElementById("user-name").textContent = currentUser.name;
    document.getElementById("logout-button").addEventListener("click", logout);
    
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            const tabId = this.getAttribute("data-tab");
            
            const tabContents = document.querySelectorAll(".tab-content");
            tabContents.forEach(tab => tab.classList.remove("active"));
            
            tabButtons.forEach(btn => btn.classList.remove("active"));
            
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");
            
            // Load tab data
            if (tabId === "mentees-tab") {
                loadMentees();
            }
        });
    });
    

    tabButtons[0].click();
    

    setupModals();
}

function setupMenteeDashboard() {
    document.getElementById("user-name").textContent = currentUser.name;
    document.getElementById("logout-button").addEventListener("click", logout);
    
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            const tabId = this.getAttribute("data-tab");
            
            const tabContents = document.querySelectorAll(".tab-content");
            tabContents.forEach(tab => tab.classList.remove("active"));
            
            tabButtons.forEach(btn => btn.classList.remove("active"));
            
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");
            
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

function setupModals() {
    const closeButtons = document.querySelectorAll(".close-button");
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const modal = this.closest(".modal");
            modal.style.display = "none";
        });
    });
    
    window.addEventListener("click", function(event) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });
    

    const addTaskButton = document.getElementById("add-task-button");
    if (addTaskButton) {
        addTaskButton.addEventListener("click", function() {
            document.getElementById("task-modal").style.display = "block";
            document.getElementById("task-form").reset();
            document.getElementById("task-form-title").textContent = "Add New Task";
            
            const taskForm = document.getElementById("task-form");
            taskForm.removeEventListener("submit", taskFormHandler);
            taskForm.addEventListener("submit", taskFormHandler);
        });
    }
    

    const addMeetingButton = document.getElementById("add-meeting-button");
    if (addMeetingButton) {
        addMeetingButton.addEventListener("click", function() {
            document.getElementById("meeting-modal").style.display = "block";
            document.getElementById("meeting-form").reset();
            document.getElementById("meeting-form-title").textContent = "Add New Meeting Note";
            
            const meetingForm = document.getElementById("meeting-form");
            meetingForm.removeEventListener("submit", meetingFormHandler);
            meetingForm.addEventListener("submit", meetingFormHandler);
        });
    }
}
function taskFormHandler(e) {
    e.preventDefault();
    
    const menteeUsername = document.getElementById("task-mentee").value;
    const description = document.getElementById("task-description").value;
    const dueDateInput = document.getElementById("task-due-date");
    

    if (!validateTaskDate(dueDateInput.value)) {
        showError("Task due date must be today or in the future");
        return;
    }
    

    const dueDate = formatDateForBackend(dueDateInput.value);
    
    addTask(menteeUsername, description, dueDate);
}

function meetingFormHandler(e) {
    e.preventDefault();
    
    const menteeUsername = document.getElementById("meeting-mentee").value;
    const dateInput = document.getElementById("meeting-date");
    const summary = document.getElementById("meeting-summary").value;
    

    if (!validateMeetingDate(dateInput.value)) {
        showError("Meeting date must be today or in the past");
        return;
    }
    

    const date = formatDateForBackend(dateInput.value);
    
    addMeetingNote(menteeUsername, date, summary);
}

async function login(username, password) {
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
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
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
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

        if (!validateName(name)) {
            showError("Invalid name format. Name should start with a letter and contain only letters, spaces, and periods.");
            return;
        }
        
        if (!validatePhone(phone)) {
            showError("Invalid phone number format. Please enter 10 digits.");
            return;
        }
        
        if (!validatePassword(password)) {
            showError("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.");
            return;
        }
        const checkUsernameResponse = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
        const checkUsernameData = await checkUsernameResponse.json();
        
        if (checkUsernameData.success) {
            showError("Username already exists. Please choose a different username.");
            return;
        }

        const response = await fetch("/api/register_mentor", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, name, email, phone, department })
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
async function registerMentee(username, password, name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact, mentorUsername) {
    try {

        if (!validateName(name)) {
            showError("Invalid name format. Name should start with a letter and contain only letters, spaces, and periods.");
            return;
        }
        
        if (!validatePhone(phone)) {
            showError("Invalid phone number format. Please enter 10 digits.");
            return;
        }
        
        if (!validateDigitalId(digitalId)) {
            showError("Invalid Digital ID format. Please enter 7 digits.");
            return;
        }
        
        if (!validateRegistrationNumber(registrationNumber)) {
            showError("Invalid Registration Number format. Please enter 13 digits.");
            return;
        }
        
        if (!validateName(parentName)) {
            showError("Invalid parent name format. Name should start with a letter and contain only letters, spaces, and periods.");
            return;
        }
        
        if (!validateParentContact(parentContact)) {
            showError("Invalid Parent Contact. Please provide a valid 10-digit phone number.");
            return;
        }
        
        if (!validatePassword(password)) {
            showError("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.");
            return;
        }
        
        const checkUsernameResponse = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
        const checkUsernameData = await checkUsernameResponse.json();
        
        if (checkUsernameData.success) {
            showError("Username already exists. Please choose a different username.");
            return;
        }

        const response = await fetch("/api/register_mentee", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username, password, name, email, phone, department,
                year: parseInt(year), digitalId, registrationNumber,
                parentName, parentEmail, parentContact, mentorUsername
            })
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
                        <div class="parent-info">
                            <h4>Parent Information</h4>
                            <p><strong>Parent Name:</strong> ${mentee.parentName || "N/A"}</p>
                            <p><strong>Parent Email:</strong> ${mentee.parentEmail || "N/A"}</p>
                            <p><strong>Parent Contact:</strong> ${mentee.parentContact}</p>
                        </div>
                        <div class="mentorship-info">
                            <h4>Mentorship Details</h4>
                            <p><strong>Meetings:</strong> ${mentee.meetingCount} | 
                               <strong>Tasks:</strong> ${mentee.taskCount}</p>
                        </div>
                    </div>
                    <div class="mentee-actions">
                        <div class="action-buttons">
                            <button class="view-tasks" data-username="${mentee.username}" data-name="${mentee.name}">View Tasks</button>
                            <button class="view-meetings" data-username="${mentee.username}" data-name="${mentee.name}">View Meetings</button>
                        </div>
                        <div class="add-buttons">
                            <button class="add-task" data-username="${mentee.username}" data-name="${mentee.name}">Add Task</button>
                            <button class="add-meeting" data-username="${mentee.username}" data-name="${mentee.name}">Add Meeting Note</button>
                        </div>
                    </div>
                `;
                
                menteesList.appendChild(menteeItem);
                

                menteeItem.querySelector(".view-tasks").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    const name = this.getAttribute("data-name");
                    viewMenteeTasks(username, name);
                });
                
                menteeItem.querySelector(".view-meetings").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    const name = this.getAttribute("data-name");
                    viewMenteeMeetings(username, name);
                });
                
                menteeItem.querySelector(".add-task").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    const name = this.getAttribute("data-name");
                    document.getElementById("task-modal").style.display = "block";
                    document.getElementById("task-form").reset();
                    document.getElementById("task-mentee").value = username;
                    document.getElementById("task-form-title").textContent = `Add Task for ${name}`;
                    

                    const taskForm = document.getElementById("task-form");
                    taskForm.removeEventListener("submit", taskFormHandler);
                    taskForm.addEventListener("submit", taskFormHandler);
                });
                
                menteeItem.querySelector(".add-meeting").addEventListener("click", function() {
                    const username = this.getAttribute("data-username");
                    const name = this.getAttribute("data-name");
                    document.getElementById("meeting-modal").style.display = "block";
                    document.getElementById("meeting-form").reset();
                    document.getElementById("meeting-mentee").value = username;
                    document.getElementById("meeting-form-title").textContent = `Add Meeting Note for ${name}`;
                    

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

async function viewMenteeTasks(menteeUsername, menteeName) {
    try {
        const response = await fetch(`/api/tasks?mentee=${encodeURIComponent(menteeUsername)}`);
        const data = await response.json();
        
        if (data.success) {
            const tasksList = document.getElementById("tasks-list");
            tasksList.innerHTML = "";


            document.getElementById("tasks-heading").textContent = `${menteeName}'s Tasks`;
            
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
                        <button class="edit-task" data-index="${index}" data-mentee="${menteeUsername}" data-name="${menteeName}">Edit</button>
                        <button class="delete-task delete" data-index="${index}" data-mentee="${menteeUsername}" data-name="${menteeName}">Delete</button>
                    </div>
                `;
                
                tasksList.appendChild(taskItem);

                taskItem.querySelector(".delete-task").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    const name = this.getAttribute("data-name");
                    deleteTask(mentee, index, name);
                });
                
                taskItem.querySelector(".edit-task").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    const name = this.getAttribute("data-name");
                    
                    document.getElementById("task-modal").style.display = "block";
                    document.getElementById("task-form").reset();
                    document.getElementById("task-mentee").value = mentee;
                    document.getElementById("task-description").value = task.description;
                    

                    const formattedDate = formatDateForInput(task.dueDate);
                    document.getElementById("task-due-date").value = formattedDate;
                    

                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById("task-due-date").min = today;
                    
                    document.getElementById("task-form-title").textContent = `Edit Task for ${name}`;
                    

                    const taskForm = document.getElementById("task-form");
                    taskForm.removeEventListener("submit", taskFormHandler);
                    taskForm.addEventListener("submit", function(e) {
                        e.preventDefault();
                        
                        const menteeUsername = document.getElementById("task-mentee").value;
                        const description = document.getElementById("task-description").value;
                        const dueDateInput = document.getElementById("task-due-date");
                        

                        if (!validateTaskDate(dueDateInput.value)) {
                            showError("Task due date must be today or in the future");
                            return;
                        }
                        

                        const dueDate = formatDateForBackend(dueDateInput.value);
                        
                        editTask(menteeUsername, index, description, dueDate, name);
                    });
                });
            });
            

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

async function viewMenteeMeetings(menteeUsername, menteeName) {
    try {
        const response = await fetch(`/api/meetings?mentee=${encodeURIComponent(menteeUsername)}`);
        const data = await response.json();
        
        if (data.success) {
            const meetingsList = document.getElementById("meetings-list");
            meetingsList.innerHTML = "";


            document.getElementById("meetings-heading").textContent = `${menteeName}'s Meeting Notes`;
            
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
                        <button class="edit-meeting" data-index="${index}" data-mentee="${menteeUsername}" data-name="${menteeName}">Edit</button>
                        <button class="delete-meeting delete" data-index="${index}" data-mentee="${menteeUsername}" data-name="${menteeName}">Delete</button>
                    </div>
                `;
                
                meetingsList.appendChild(meetingItem);
                

                meetingItem.querySelector(".delete-meeting").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    const name = this.getAttribute("data-name");
                    deleteMeetingNote(mentee, index, name);
                });
                
                meetingItem.querySelector(".edit-meeting").addEventListener("click", function() {
                    const index = this.getAttribute("data-index");
                    const mentee = this.getAttribute("data-mentee");
                    const name = this.getAttribute("data-name");
                    
                    document.getElementById("meeting-modal").style.display = "block";
                    document.getElementById("meeting-form").reset();
                    document.getElementById("meeting-mentee").value = mentee;
                    
                   
                    const formattedDate = formatDateForInput(meeting.date);
                    document.getElementById("meeting-date").value = formattedDate;
                    
                    
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById("meeting-date").max = today;
                    
                    document.getElementById("meeting-summary").value = meeting.summary;
                    document.getElementById("meeting-form-title").textContent = `Edit Meeting Note for ${name}`;
                    
                    const meetingForm = document.getElementById("meeting-form");
                    meetingForm.removeEventListener("submit", meetingFormHandler);
                    meetingForm.addEventListener("submit", function(e) {
                        e.preventDefault();
                        
                        const menteeUsername = document.getElementById("meeting-mentee").value;
                        const dateInput = document.getElementById("meeting-date");
                        const summary = document.getElementById("meeting-summary").value;
                        
                        
                        if (!validateMeetingDate(dateInput.value)) {
                            showError("Meeting date must be today or in the past");
                            return;
                        }
                        
                        
                        const date = formatDateForBackend(dateInput.value);
                        
                        editMeetingNote(menteeUsername, index, date, summary, name);
                    });
                });
            });
            
            
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
        

        setTimeout(() => {
            successElement.style.display = "none";
        }, 5000);
    } else {
        alert(message);
    }
}


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


async function loadProfile() {
    try {
        const response = await fetch(`/api/profile?username=${encodeURIComponent(currentUser.username)}`);
        const data = await response.json();
        
        if (data.success) {
            const profileContainer = document.getElementById("profile-container");
            const profile = data.profile;
            
            
            let mentorContactHtml = '';
            try {
                const mentorResponse = await fetch("/api/mentors");
                const mentorData = await mentorResponse.json();
                
                if (mentorData.success && mentorData.mentors && mentorData.mentors.length > 0) {
                    const mentor = mentorData.mentors.find(m => m.name === profile.mentorName);
                    
                    if (mentor) {
                        const mentorProfileResponse = await fetch(`/api/profile?username=${encodeURIComponent(mentor.username)}`);
                        const mentorProfileData = await mentorProfileResponse.json();
                        
                        if (mentorProfileData.success) {
                            const mentorProfile = mentorProfileData.profile;
                            mentorContactHtml = `
                                <div class="mentor-contact">
                                    <p><strong>Email:</strong> ${mentorProfile.email}</p>
                                    <p><strong>Phone:</strong> ${mentorProfile.phone}</p>
                                    <p><strong>Department:</strong> ${mentorProfile.department}</p>
                                </div>
                            `;
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching mentor details:", error);
                mentorContactHtml = "<p>Could not load mentor contact details</p>";
            }
            
            // Create mentor section with the fetched contact details
            const mentorSection = document.createElement("div");
            mentorSection.className = "mentor-info-card";
            mentorSection.innerHTML = `
                <h3>My Mentor</h3>
                <p><strong>Name:</strong> ${profile.mentorName}</p>
                <div id="mentor-contact-details">${mentorContactHtml}</div>
            `;
            
            
            const studentSection = document.createElement("div");
            studentSection.className = "student-profile-info";
            studentSection.innerHTML = `
                <h3>My Information</h3>
                <div class="profile-details">
                    <p><strong>Name:</strong> ${profile.name}</p>
                    <p><strong>Email:</strong> ${profile.email}</p>
                    <p><strong>Phone:</strong> ${profile.phone}</p>
                    <p><strong>Department:</strong> ${profile.department}</p>
                    <p><strong>Year:</strong> ${profile.year}</p>
                    <p><strong>Digital ID:</strong> ${profile.digitalId}</p>
                    <p><strong>Registration Number:</strong> ${profile.registrationNumber}</p>
                    <div class="parent-details">
                        <h4>Parent Information</h4>
                        <p><strong>Parent Name:</strong> ${profile.parentName || "N/A"}</p>
                        <p><strong>Parent Email:</strong> ${profile.parentEmail || "N/A"}</p>
                        <p><strong>Parent Contact:</strong> ${profile.parentContact}</p>
                    </div>
                </div>
            `;
            
            
            profileContainer.innerHTML = '';
            profileContainer.appendChild(mentorSection);
            profileContainer.appendChild(studentSection);
            
            
            
            document.getElementById("edit-profile-button").addEventListener("click", function() {
                document.getElementById("profile-modal").style.display = "block";

                document.getElementById("edit-name").value = profile.name;
                document.getElementById("edit-email").value = profile.email;
                document.getElementById("edit-phone").value = profile.phone;
                document.getElementById("edit-department").value = profile.department;
                document.getElementById("edit-year").value = profile.year;
                document.getElementById("edit-digital-id").value = profile.digitalId;
                document.getElementById("edit-registration-number").value = profile.registrationNumber;
                document.getElementById("edit-parent-name").value = profile.parentName || "";
                document.getElementById("edit-parent-email").value = profile.parentEmail || "";
                document.getElementById("edit-parent-contact").value = profile.parentContact;
                

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
                    const parentName = document.getElementById("edit-parent-name").value;
                    const parentEmail = document.getElementById("edit-parent-email").value;
                    const parentContact = document.getElementById("edit-parent-contact").value;
                    
                    updateProfile(name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact);
                });
            });
        } else {
            showError(data.message || "Failed to load profile");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}


async function updateProfile(name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact) {
    try {
        if (!validateName(name)) {
            showError("Invalid name format. Name should start with a letter and contain only letters, spaces, and periods.");
            return;
        }
        
        if (!validatePhone(phone)) {
            showError("Invalid phone number format. Please enter 10 digits.");
            return;
        }
        
        if (!validateDigitalId(digitalId)) {
            showError("Invalid Digital ID format. Please enter 7 digits.");
            return;
        }
        
        if (!validateRegistrationNumber(registrationNumber)) {
            showError("Invalid Registration Number format. Please enter 13 digits.");
            return;
        }
        
        if (parentName && !validateName(parentName)) {
            showError("Invalid parent name format. Name should start with a letter and contain only letters, spaces, and periods.");
            return;
        }
        
        if (!validateParentContact(parentContact)) {
            showError("Invalid Parent Contact. Please provide a valid 10-digit phone number.");
            return;
        }
        
        const response = await fetch("/api/update_profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: currentUser.username,
                name, email, phone, department,
                year: parseInt(year), digitalId, registrationNumber,
                parentName, parentEmail, parentContact
            })
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

async function addTask(menteeUsername, description, dueDate) {
    try {
        if (!validateBackendDateFormat(dueDate)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/add_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                description,
                dueDate
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("task-modal").style.display = "none";
            showSuccess("Task added successfully!");
            
            if (document.getElementById("tasks-tab").classList.contains("active")) {
                viewMenteeTasks(menteeUsername, currentMenteeName);
            }
        } else {
            showError(data.message || "Failed to add task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function editTask(menteeUsername, taskIndex, description, dueDate, menteeName) {
    try {
        if (!validateBackendDateFormat(dueDate)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/edit_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                index: taskIndex,
                description,
                dueDate
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("task-modal").style.display = "none";
            showSuccess("Task updated successfully!");
            viewMenteeTasks(menteeUsername, menteeName);
        } else {
            showError(data.message || "Failed to update task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function deleteTask(menteeUsername, taskIndex, menteeName) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }
    
    try {
        const response = await fetch("/api/delete_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                index: taskIndex
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Task deleted successfully!");
            viewMenteeTasks(menteeUsername, menteeName);
        } else {
            showError(data.message || "Failed to delete task");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function addMeetingNote(menteeUsername, date, summary) {
    try {
        if (!validateBackendDateFormat(date)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/add_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                date,
                summary
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("meeting-modal").style.display = "none";
            showSuccess("Meeting note added successfully!");
            
            if (document.getElementById("meetings-tab").classList.contains("active")) {
                viewMenteeMeetings(menteeUsername, currentMenteeName);
            } else {
                loadMentees();
            }
        } else {
            showError(data.message || "Failed to add meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function editMeetingNote(menteeUsername, noteIndex, date, summary, menteeName) {
    try {
        if (!validateBackendDateFormat(date)) {
            showError("Invalid date format. Use DD-MM-YYYY");
            return;
        }
        
        const response = await fetch("/api/edit_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                index: noteIndex,
                date,
                summary
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("meeting-modal").style.display = "none";
            showSuccess("Meeting note updated successfully!");
            viewMenteeMeetings(menteeUsername, menteeName);
        } else {
            showError(data.message || "Failed to update meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}

async function deleteMeetingNote(menteeUsername, noteIndex, menteeName) {
    if (!confirm("Are you sure you want to delete this meeting note?")) {
        return;
    }
    
    try {
        const response = await fetch("/api/delete_meeting", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mentee: menteeUsername,
                index: noteIndex
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess("Meeting note deleted successfully!");
            viewMenteeMeetings(menteeUsername, menteeName);
        } else {
            showError(data.message || "Failed to delete meeting note");
        }
    } catch (error) {
        showError("Server error. Please try again later.");
    }
}


function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function validateDigitalId(digitalId) {
    const digitalIdRegex = /^[0-9]{7}$/;
    return digitalIdRegex.test(digitalId);
}

function validateRegistrationNumber(registrationNumber) {
    const regNoRegex = /^[0-9]{13}$/;
    return regNoRegex.test(registrationNumber);
}

function validateParentContact(parentContact) {

    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(parentContact);
}

function validateName(name) {
    const nameRegex = /^[a-zA-Z][a-zA-Z\s\.]*$/;
    return nameRegex.test(name);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

function validateTaskDate(dateString) {

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return false;
    }
    
    const selectedDate = new Date(dateString);

    if (isNaN(selectedDate.getTime())) {
        return false;
    }
    
    selectedDate.setHours(0, 0, 0, 0); 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
   
    return selectedDate >= today;
}

function validateMeetingDate(dateString) {
   
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return false;
    }
    
    const selectedDate = new Date(dateString);
   
    if (isNaN(selectedDate.getTime())) {
        return false;
    }
    
    selectedDate.setHours(0, 0, 0, 0); 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    
    return selectedDate <= today;
}

//validates format to check if it is the same format as backend
function validateBackendDateFormat(dateString) {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    return dateRegex.test(dateString);
}

// yyyy-mm-dd to dd-mm-yyyy for backendxx
function formatDateForBackend(dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}

//dd-mm-yyyy to yyyy-mm-dd for HTML date input
function formatDateForInput(dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}