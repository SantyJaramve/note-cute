const getApiUrl = () => window.API_URL || (window.location.origin + '/api');

const App = {
  notes: [],
  currentSettings: null,

  async init() {
    const isAuth = await Auth.checkAuth();
    if (!isAuth && !Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    this.setupEventListeners();
    await this.loadSettings();
    await this.loadNotes();
    
    Editor.init();
    Spreadsheet.init();
    Drawing.init();
  },

  setupEventListeners() {
    const newNoteBtn = document.getElementById('newNoteBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const insertTableBtn = document.getElementById('insertTableBtn');

    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => {
        this.createNote();
      });
    }

    if (insertTableBtn) {
      insertTableBtn.addEventListener('click', () => {
        if (typeof Spreadsheet !== 'undefined') {
          Spreadsheet.createSpreadsheet();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.toggleSettings());
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => this.toggleSettings(false));
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    if (deleteNoteBtn) {
      deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());
    }

    this.setupSettingsListeners();
  },

  setupSettingsListeners() {
    const webBgColor = document.getElementById('webBackgroundColor');
    const webBgImage = document.getElementById('webBackgroundImage');
    const noteColor = document.getElementById('noteColor');
    const noteBorderColor = document.getElementById('noteBorderColor');
    const noteBorderWidth = document.getElementById('noteBorderWidth');
    const noteWidth = document.getElementById('noteWidth');
    const noteWidthValue = document.getElementById('noteWidthValue');
    const noteFontFamily = document.getElementById('noteFontFamily');
    const noteFontSize = document.getElementById('noteFontSize');
    const noteShadow = document.getElementById('noteShadow');
    const noteOpacity = document.getElementById('noteOpacity');
    const noteOpacityValue = document.getElementById('noteOpacityValue');

    // Eliminar listeners de shapes ya que no existen
    
    if (webBgColor) {
      webBgColor.addEventListener('input', (e) => {
        document.body.style.background = e.target.value;
      });
    }

    const applyNoteStyle = () => {
      const noteEditor = document.getElementById('noteEditor');
      if (!noteEditor) return;
      
      if (noteColor) noteEditor.style.setProperty('--note-bg', noteColor.value);
      if (noteBorderColor) noteEditor.style.setProperty('--note-border-color', noteBorderColor.value);
      if (noteBorderWidth) noteEditor.style.setProperty('--note-border-width', noteBorderWidth.value);
      if (noteFontFamily) noteEditor.style.setProperty('--note-font', noteFontFamily.value);
      if (noteFontSize) noteEditor.style.setProperty('--note-font-size', noteFontSize.value);
      if (noteShadow) {
        noteEditor.style.setProperty('--note-shadow', noteShadow.checked ? '0 10px 40px rgba(0, 0, 0, 0.1)' : 'none');
      }
      if (noteOpacity) noteEditor.style.setProperty('--note-opacity', noteOpacity.value + '%');
    };

    if (noteColor) noteColor.addEventListener('input', applyNoteStyle);
    if (noteBorderColor) noteBorderColor.addEventListener('input', applyNoteStyle);
    if (noteBorderWidth) noteBorderWidth.addEventListener('change', applyNoteStyle);
    if (noteFontFamily) noteFontFamily.addEventListener('change', applyNoteStyle);
    if (noteFontSize) noteFontSize.addEventListener('change', applyNoteStyle);
    if (noteShadow) noteShadow.addEventListener('change', applyNoteStyle);
    if (noteOpacity) noteOpacity.addEventListener('input', applyNoteStyle);

    if (noteWidth && noteWidthValue) {
      noteWidth.addEventListener('input', (e) => {
        noteWidthValue.textContent = e.target.value + 'px';
      });
    }

    if (noteOpacity && noteOpacityValue) {
      noteOpacity.addEventListener('input', (e) => {
        noteOpacityValue.textContent = e.target.value + '%';
      });
    }
  },

  async loadSettings() {
    try {
      const response = await fetch(`${getApiUrl()}/settings`, {
        headers: Auth.getHeaders()
      });

      if (response.ok) {
        const text = await response.text();
        if (text) {
          try {
            this.currentSettings = JSON.parse(text);
            this.applySettings(this.currentSettings);
          } catch(e) {
            console.warn('Empty or invalid JSON settings', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  applySettings(settings) {
    if (!settings) return;

    if (settings.web_background) {
      document.body.style.background = settings.web_background;
    }

    if (settings.web_background_image) {
      document.body.style.backgroundImage = `url(${settings.web_background_image})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }

    const setVal = (id, val, isCheckbox = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isCheckbox) {
        el.checked = val;
      } else if (el.tagName === 'SPAN') {
        el.textContent = val;
      } else {
        el.value = val;
      }
    };

    setVal('webBackgroundColor', settings.web_background || '#fdf6f0');
    setVal('webBackgroundImage', settings.web_background_image || '');
    setVal('noteColor', settings.default_note_color || '#ffffff');
    setVal('noteBorderColor', settings.default_note_border_color || '#f0e6e0');
    setVal('noteBorderWidth', settings.default_note_border || '1px');
    setVal('noteWidth', parseInt(settings.default_note_width) || 900);
    setVal('noteWidthValue', settings.default_note_width || '900px');
    setVal('noteFontFamily', settings.default_note_font_family || 'Nunito');
    setVal('noteFontSize', settings.default_note_font_size || '16px');
    setVal('noteShadow', settings.default_note_shadow !== 0, true);
    setVal('noteOpacity', settings.default_note_opacity || 100);
    setVal('noteOpacityValue', (settings.default_note_opacity || 100) + '%');
  },

  async saveSettings() {
    const getApiUrl = () => window.API_URL || (window.location.origin + '/api');
    
    const getVal = (id, def) => {
      const el = document.getElementById(id);
      return el ? el.value : def;
    };
    
    const getCheck = (id, def) => {
      const el = document.getElementById(id);
      return el ? el.checked : def;
    };
    
    const settings = {
      web_background: getVal('webBackgroundColor', '#fdf6f0'),
      web_background_image: getVal('webBackgroundImage', ''),
      default_note_color: getVal('noteColor', '#ffffff'),
      default_note_border_color: getVal('noteBorderColor', '#f0e6e0'),
      default_note_border: getVal('noteBorderWidth', '1px'),
      default_note_border_radius: '16px',
      default_note_width: getVal('noteWidth', '900') + 'px',
      default_note_font_family: getVal('noteFontFamily', 'Nunito'),
      default_note_font_size: getVal('noteFontSize', '16px'),
      default_note_shadow: getCheck('noteShadow', true) ? 1 : 0,
      default_note_opacity: parseInt(getVal('noteOpacity', '100')),
      default_note_clip_path: ''
    };

    try {
      const apiUrl = getApiUrl();
      console.log('Saving settings to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('noteCuteToken') || '')
        },
        body: JSON.stringify(settings)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        this.currentSettings = await response.json();
        this.applySettings(this.currentSettings);
        
        document.body.style.background = settings.web_background;
        if (settings.web_background_image) {
          document.body.style.backgroundImage = `url(${settings.web_background_image})`;
          document.body.style.backgroundSize = 'cover';
        }
        
        if (Editor.currentNote) {
          Editor.currentNote.style = {
            backgroundColor: settings.default_note_color,
            borderColor: settings.default_note_border_color,
            borderWidth: settings.default_note_border,
            borderRadius: settings.default_note_border_radius,
            width: settings.default_note_width,
            fontFamily: settings.default_note_font_family,
            fontSize: settings.default_note_font_size,
            shadow: settings.default_note_shadow,
            opacity: settings.default_note_opacity
          };
          Editor.applyNoteStyle(Editor.currentNote.style);
        }

        this.toggleSettings(false);
        
        alert('Configuración guardada correctamente');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Error al guardar configuración: ' + response.status);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar configuración: ' + error.message);
    }
  },

  toggleSettings(open = null) {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;

    if (open === null) {
      panel.classList.toggle('open');
    } else if (open) {
      panel.classList.add('open');
    } else {
      panel.classList.remove('open');
    }
  },

  async loadNotes() {
    try {
      const response = await fetch(`${getApiUrl()}/notes`, {
        headers: Auth.getHeaders()
      });

      if (response.ok) {
        this.notes = await response.json();
        this.renderNotesList();
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  },

  renderNotesList() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;

    notesList.innerHTML = '';

    if (this.notes.length === 0) {
      notesList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-light);">No hay notas aún</div>';
      return;
    }

    this.notes.forEach(note => {
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      noteItem.dataset.noteId = note.id;

      const preview = note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 60) : 'Sin contenido';

      noteItem.innerHTML = `
        <div class="note-item-title">${note.title || 'Nueva Nota'}</div>
        <div class="note-item-preview">${preview}...</div>
        <div class="note-item-date">${this.formatDate(note.updated_at)}</div>
      `;

      noteItem.addEventListener('click', () => this.selectNote(note));

      notesList.appendChild(noteItem);
    });
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  },

  async selectNote(note) {
    document.querySelectorAll('.note-item').forEach(item => {
      item.classList.remove('active');
    });

    const noteItem = document.querySelector(`.note-item[data-note-id="${note.id}"]`);
    if (noteItem) {
      noteItem.classList.add('active');
    }

    Editor.openNote(note);
  },

  updateNoteInList(note) {
    const noteItem = document.querySelector(`.note-item[data-note-id="${note.id}"]`);
    if (noteItem) {
      const title = noteItem.querySelector('.note-item-title');
      const preview = noteItem.querySelector('.note-item-preview');
      
      if (title) title.textContent = note.title || 'Nueva Nota';
      if (preview) {
        const content = note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 60) : 'Sin contenido';
        preview.textContent = content + '...';
      }
    }

    const noteIndex = this.notes.findIndex(n => n.id === note.id);
    if (noteIndex !== -1) {
      this.notes[noteIndex] = { ...this.notes[noteIndex], ...note };
    }
  },

  async createNote() {
    try {
      const defaultStyle = {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderWidth: '1px',
        borderRadius: '12px',
        width: '600px',
        fontFamily: 'Poppins',
        fontSize: '14px',
        shadow: true,
        opacity: 100
      };

      const response = await fetch(`${getApiUrl()}/notes`, {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({
          title: 'Nueva Nota',
          content: '',
          style: defaultStyle
        })
      });

      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderNotesList();
        this.selectNote(note);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  },

  async deleteCurrentNote() {
    if (!Editor.currentNote) return;

    const confirmed = confirm('¿Estás seguro de que quieres eliminar esta nota?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${getApiUrl()}/notes/${Editor.currentNote.id}`, {
        method: 'DELETE',
        headers: Auth.getHeaders()
      });

      if (response.ok) {
        this.notes = this.notes.filter(n => n.id !== Editor.currentNote.id);
        
        const noteItem = document.querySelector(`.note-item[data-note-id="${Editor.currentNote.id}"]`);
        if (noteItem) {
          noteItem.remove();
        }

        Editor.closeNote();

        if (this.notes.length === 0) {
          this.renderNotesList();
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notesList')) {
    App.init();
  }
});

if (typeof window !== 'undefined') {
  window.App = App;
}
