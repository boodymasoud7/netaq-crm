// Local Development Server
const express = require('express');
const cors = require('cors');
const path = require('path');

// Set development environment
process.env.NODE_ENV = 'development';
process.env.PORT = 8000;
process.env.JWT_SECRET = 'local_development_secret_key';
process.env.FRONTEND_URL = 'http://localhost:5173';

console.log('🏠 بدء خادم التطوير المحلي...');
console.log('🌍 البيئة: التطوير');
console.log('🔗 الرابط: http://localhost:8000');
console.log('📱 Frontend: http://localhost:5173');

// Start the regular server
require('./server.js');

