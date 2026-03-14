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
    const notes = db.prepare(`
      SELECT id, title, content, style, created_at, updated_at 
      FROM notes 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `).all(req.user.id);

    res.json(notes.map(note => ({
      ...note,
      style: typeof note.style === 'string' ? JSON.parse(note.style || '{}') : (note.style || {})
    })));
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const note = db.prepare(`
      SELECT * FROM notes WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.json({
      ...note,
      style: typeof note.style === 'string' ? JSON.parse(note.style || '{}') : (note.style || {})
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Error al obtener nota' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, content, style } = req.body;
    const db = getDatabase();

    const result = db.prepare(`
      INSERT INTO notes (user_id, title, content, style) 
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, title || 'Nueva Nota', content || '', JSON.stringify(style || {}));

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      ...note,
      style: typeof note.style === 'string' ? JSON.parse(note.style || '{}') : (note.style || {})
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Error al crear nota' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, style } = req.body;
    const db = getDatabase();

    const existingNote = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, style = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(title, content, JSON.stringify(style || {}), req.params.id, req.user.id);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);

    res.json({
      ...note,
      style: typeof note.style === 'string' ? JSON.parse(note.style || '{}') : (note.style || {})
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Error al actualizar nota' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

module.exports = router;
