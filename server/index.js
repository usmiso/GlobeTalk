
// Express.js backend setup for GlobeTalk
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Example API route
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
});

// Serve static files (optional, e.g., for images or uploads)
// app.use('/static', express.static(path.join(__dirname, 'public')));

// Catch-all for undefined routes
app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
	console.log(`GlobeTalk backend listening on port ${PORT}`);
});
