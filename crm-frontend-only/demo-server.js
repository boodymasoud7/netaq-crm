const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://54.221.136.112',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Demo Backend Working!' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@netaq.com' && password === '123456') {
    res.json({
      success: true,
      token: 'demo-token-12345',
      user: {
        id: 1,
        name: 'مدير النظام',
        email: 'admin@netaq.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// Reminders endpoint
app.get('/api/reminders', (req, res) => {
  res.json([]);
});

// Clients endpoint
app.get('/api/clients', (req, res) => {
  res.json({ 
    data: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }
  });
});

// Default catch-all
app.get('/api/*', (req, res) => {
  res.json({ message: 'Demo endpoint', data: [] });
});

app.listen(8000, () => {
  console.log('🚀 Enhanced Demo Backend running on port 8000');
});
