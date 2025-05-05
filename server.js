const express = require('express');
const { execFile } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 8081;

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(express.static('.')); 

// Helper function to execute backend
function executeBackend(command, args) {
    return new Promise((resolve, reject) => { 
        execFile('./backend_cli', [command, ...args], (error, stdout) => {
            if (error) { //error during compilation of c
                console.error('Backend error:', error);
                resolve({ success: false, message: 'Server error' });
                return;
            }
            try { 
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (e) { //error during parsing to json
                console.error('Parse error:', e);
                console.error('Backend output:', stdout);
                resolve({ success: false, message: 'Invalid response from backend' });
            }
        });
    });
}

// API Routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await executeBackend('login', [username, password]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.json({ success: true });
});

app.post('/api/register_mentor', async (req, res) => {
    try {
        const { username, password, name, email, phone, department } = req.body;
        const result = await executeBackend('register_mentor', [username, password, name, email, phone, department]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/register_mentee', async (req, res) => {
    try {
        const { username, password, name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact, mentorUsername } = req.body;
        const result = await executeBackend('register_mentee', [username, password, name, email, phone, department, year.toString(), digitalId, registrationNumber, parentName, parentEmail, parentContact, mentorUsername]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/mentors', async (req, res) => {
    try {
        const result = await executeBackend('get_mentors', []);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/profile', async (req, res) => {
    try {
        const { username } = req.query;
        const result = await executeBackend('get_profile', [username]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const { mentee } = req.query;
        const result = await executeBackend('get_tasks', [mentee]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/add_task', async (req, res) => {
    try {
        const { mentee, description, dueDate } = req.body;
        const result = await executeBackend('add_task', [mentee, description, dueDate]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/delete_task', async (req, res) => {
    try {
        const { mentee, index } = req.body;
        const result = await executeBackend('delete_task', [mentee, index.toString()]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/edit_task', async (req, res) => {
    try {
        const { mentee, index, description, dueDate } = req.body;
        const result = await executeBackend('edit_task', [mentee, index.toString(), description, dueDate]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/meetings', async (req, res) => {
    try {
        const { mentee } = req.query;
        const result = await executeBackend('get_meetings', [mentee]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/add_meeting', async (req, res) => {
    try {
        const { mentee, date, summary } = req.body;
        const result = await executeBackend('add_meeting', [mentee, date, summary]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/edit_meeting', async (req, res) => {
    try {
        const { mentee, index, date, summary } = req.body;
        const result = await executeBackend('edit_meeting', [mentee, index.toString(), date, summary]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/delete_meeting', async (req, res) => {
    try {
        const { mentee, index } = req.body;
        const result = await executeBackend('delete_meeting', [mentee, index.toString()]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.post('/api/update_profile', async (req, res) => {
    try {
        const { username, name, email, phone, department, year, digitalId, registrationNumber, parentName, parentEmail, parentContact } = req.body;
        const result = await executeBackend('update_profile', [username, name, email, phone, department, year.toString(), digitalId, registrationNumber, parentName, parentEmail, parentContact]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/mentee_details', async (req, res) => {
    try {
        const { mentor } = req.query;
        const result = await executeBackend('get_mentee_details', [mentor]);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    
    const { exec } = require('child_process');
    const url = `http://localhost:${port}`;
    
    switch (process.platform) {
        case 'darwin':
            exec(`open ${url}`);
            break;
        case 'win32':
            exec(`start ${url}`);
            break;
        default:
            exec(`xdg-open ${url}`);
    }
});