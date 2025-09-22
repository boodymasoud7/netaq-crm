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
  console.log('Login attempt:', email);
  
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

app.listen(8000, () => {
  console.log('🚀 Demo Backend running on port 8000');
});
