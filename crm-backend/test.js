console.log("✅ Node.js is working!")
console.log("📁 Current directory:", process.cwd())

// Test if we can load dependencies
try {
  const fs = require('fs')
  console.log("✅ fs module loaded")
  
  if (fs.existsSync('package.json')) {
    console.log("✅ package.json found")
  } else {
    console.log("❌ package.json NOT found")
  }
  
  console.log("🚀 Trying to start express...")
  const express = require('express')
  console.log("✅ express loaded")
  
  const app = express()
  
  app.get('/', (req, res) => {
    res.json({ message: 'Backend is working!' })
  })
  
  app.listen(8000, () => {
    console.log('🎉 Server running on http://localhost:8000')
    console.log('✅ Success! Backend is working!')
  })
  
} catch (error) {
  console.log("❌ Error:", error.message)
  console.log("Run 'npm install' to install dependencies")
}