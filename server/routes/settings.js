const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = 'note-cute-secret-key-2024';

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);

    if (!settings) {
      const result = db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(req.user.id);
      const newSettings = db.prepare('SELECT * FROM settings WHERE id = ?').get(result.lastInsertRowid);
      return res.json(newSettings);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

router.put('/', authenticateToken, (req, res) => {
  try {
    const {
      web_background,
      web_background_image,
      default_note_color,
      default_note_border_color,
      default_note_border_radius,
      default_note_width,
      default_note_font_family,
      default_note_font_size,
      default_note_border,
      default_note_shadow,
      default_note_opacity,
      default_note_clip_path
    } = req.body;

    const db = getDatabase();
    
    let settings = db.prepare('SELECT id FROM settings WHERE user_id = ?').get(req.user.id);

    if (!settings) {
      db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(req.user.id);
    }

    db.prepare(`
      UPDATE settings SET
        web_background = COALESCE(?, web_background),
        web_background_image = COALESCE(?, web_background_image),
        default_note_color = COALESCE(?, default_note_color),
        default_note_border_color = COALESCE(?, default_note_border_color),
        default_note_border_radius = COALESCE(?, default_note_border_radius),
        default_note_width = COALESCE(?, default_note_width),
        default_note_font_family = COALESCE(?, default_note_font_family),
        default_note_font_size = COALESCE(?, default_note_font_size),
        default_note_border = COALESCE(?, default_note_border),
        default_note_shadow = COALESCE(?, default_note_shadow),
        default_note_opacity = COALESCE(?, default_note_opacity),
        default_note_clip_path = COALESCE(?, default_note_clip_path)
      WHERE user_id = ?
    `).run(
      web_background,
      web_background_image,
      default_note_color,
      default_note_border_color,
      default_note_border_radius,
      default_note_width,
      default_note_font_family,
      default_note_font_size,
      default_note_border,
      default_note_shadow,
      default_note_opacity,
      default_note_clip_path,
      req.user.id
    );

    const updatedSettings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

module.exports = router;
