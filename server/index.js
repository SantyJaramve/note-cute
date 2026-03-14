const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const settingsRoutes = require('./routes/settings');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.static(path.join(__dirname, '../public')));

initDatabase().then(() => {
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/settings', settingsRoutes);

  app.get('*', (req, res) => {
    if (req.path === '/' || req.path === '/index.html') {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
      res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
