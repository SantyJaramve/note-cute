const Editor = {
  currentNote: null,
  saveTimeout: null,

  init() {
    this.noteTitle = document.getElementById('noteTitle');
    this.noteContent = document.getElementById('noteContent');
    this.noteEditor = document.getElementById('noteEditor');
    this.emptyState = document.getElementById('emptyState');
    this.imageModal = document.getElementById('imageModal');
    this.autoSaveStatus = document.getElementById('autoSaveStatus');
    
    this.setupToolbar();
    this.setupImageModal();
    this.setupAutoSave();
  },

  setupAutoSave() {
    let debounceTimer;
    const debounceSave = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (this.currentNote) {
          this.autoSave();
        }
      }, 1500);
    };

    if (this.noteTitle) {
      this.noteTitle.addEventListener('input', debounceSave);
    }
    if (this.noteContent) {
      this.noteContent.addEventListener('input', debounceSave);
    }
  },

  async autoSave() {
    if (!this.currentNote) return;

    const noteEditor = document.getElementById('noteEditor');
    const currentStyle = this.currentNote.style || {};
    
    const style = {
      backgroundColor: noteEditor.style.getPropertyValue('--note-bg') || currentStyle.backgroundColor || '#ffffff',
      borderColor: noteEditor.style.getPropertyValue('--note-border-color') || currentStyle.borderColor || '#e0e0e0',
      borderWidth: noteEditor.style.getPropertyValue('--note-border-width') || currentStyle.borderWidth || '1px',
      borderRadius: noteEditor.style.getPropertyValue('--note-radius') || currentStyle.borderRadius || '12px',
      clipPath: noteEditor.style.getPropertyValue('--note-clip-path') || currentStyle.clipPath || '',
      width: noteEditor.style.getPropertyValue('--note-width') || currentStyle.width || '600px',
      fontFamily: noteEditor.style.getPropertyValue('--note-font') || currentStyle.fontFamily || 'Poppins',
      fontSize: noteEditor.style.getPropertyValue('--note-font-size') || currentStyle.fontSize || '14px',
      shadow: currentStyle.shadow !== undefined ? currentStyle.shadow : true,
      opacity: currentStyle.opacity || 100
    };

    const imageStyles = [];
    document.querySelectorAll('.floating-image').forEach((wrapper, index) => {
      const img = wrapper.querySelector('img');
      const left = wrapper.dataset.left || wrapper.style.left;
      const top = wrapper.dataset.top || wrapper.style.top;
      const width = wrapper.dataset.width || img.offsetWidth;
      
      imageStyles.push({
        id: index,
        width: parseInt(width),
        left: left,
        top: top
      });
      wrapper.dataset.id = index;
      wrapper.dataset.width = width;
      wrapper.dataset.left = left;
      wrapper.dataset.top = top;
    });
    if (imageStyles.length > 0) {
      style.imageStyles = imageStyles;
    }

    this.serializeDrawingData();

    const noteData = {
      title: this.noteTitle.value,
      content: this.noteContent.innerHTML,
      style: style
    };

    try {
      const response = await fetch(`${API_URL}/notes/${this.currentNote.id}`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        this.currentNote = { ...this.currentNote, ...updatedNote };
        
        if (this.autoSaveStatus) {
          this.autoSaveStatus.textContent = '✓ Guardado automático';
          this.autoSaveStatus.style.opacity = '1';
          setTimeout(() => {
            this.autoSaveStatus.style.opacity = '0';
          }, 2000);
        }
        
        if (typeof App !== 'undefined') {
          App.updateNoteInList(this.currentNote);
        }
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  },

  setupToolbar() {
    const toolbar = document.getElementById('noteToolbar');
    if (!toolbar) return;

    toolbar.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.dataset.command;
        const value = btn.dataset.value || null;
        document.execCommand(command, false, value);
        this.noteContent.focus();
      });
    });

    const saveBtn = document.getElementById('saveNoteBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!this.currentNote) return;
        
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '💾 Guardando...';
        saveBtn.disabled = true;
        
        await this.saveNote();
        
        saveBtn.innerHTML = '✅ Guardado';
        setTimeout(() => {
          saveBtn.innerHTML = originalHtml;
          saveBtn.disabled = false;
        }, 2000);
      });
    }

    const highlightBtn = document.getElementById('highlightBtn');
    const textColorPicker = document.getElementById('textColorPicker');
    const highlightColorPicker = document.getElementById('highlightColorPicker');

    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => {
        highlightBtn.classList.toggle('highlight-active');
        if (highlightBtn.classList.contains('highlight-active')) {
          const color = highlightColorPicker ? highlightColorPicker.value : '#ffeaa7';
          document.execCommand('backColor', false, color);
        } else {
          document.execCommand('backColor', false, 'transparent');
        }
        this.noteContent.focus();
      });
    }

    if (highlightColorPicker) {
      highlightColorPicker.addEventListener('input', (e) => {
        if (highlightBtn.classList.contains('highlight-active')) {
          document.execCommand('backColor', false, e.target.value);
        }
        this.noteContent.focus();
      });
    }

    if (textColorPicker) {
      textColorPicker.addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
        this.noteContent.focus();
      });
    }
  },

  setupImageModal() {
    const insertImageBtn = document.getElementById('insertImageBtn');
    const closeImageModal = document.getElementById('closeImageModal');
    const cancelImageBtn = document.getElementById('cancelImageBtn');
    const insertImageBtn2 = document.getElementById('insertImageBtn2');

    if (insertImageBtn) {
      insertImageBtn.addEventListener('click', () => {
        this.imageModal.classList.add('open');
      });
    }

    if (closeImageModal) {
      closeImageModal.addEventListener('click', () => {
        this.imageModal.classList.remove('open');
      });
    }

    if (cancelImageBtn) {
      cancelImageBtn.addEventListener('click', () => {
        this.imageModal.classList.remove('open');
      });
    }

    if (insertImageBtn2) {
      insertImageBtn2.addEventListener('click', () => {
        this.insertImage();
      });
    }
  },

  async insertImage() {
    const imageUrl = document.getElementById('imageUrl').value;
    const imageFile = document.getElementById('imageFile').files[0];

    let imageSrc = '';

    if (imageFile) {
      imageSrc = await this.fileToDataURL(imageFile);
    } else if (imageUrl) {
      imageSrc = imageUrl;
    }

    if (imageSrc) {
      const wrapper = document.createElement('div');
      wrapper.className = 'floating-image';
      wrapper.style.position = 'absolute';
      wrapper.style.zIndex = '50';
      wrapper.style.left = '20px';
      wrapper.style.top = '20px';

      const img = document.createElement('img');
      img.src = imageSrc;
      img.style.maxWidth = '400px';
      img.style.display = 'block';
      img.loading = 'lazy';
      
      const canvas = document.createElement('canvas');
      canvas.className = 'drawing-canvas';
      
      wrapper.appendChild(img);
      wrapper.appendChild(canvas);

      this.noteContent.appendChild(wrapper);

      this.setupFloatingImage(wrapper);

      if (typeof Drawing !== 'undefined') {
        Drawing.initCanvas(wrapper);
      }
    }

    this.imageModal.classList.remove('open');
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageFile').value = '';
  },

  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  setupFloatingImage(wrapper) {
    if (wrapper._eventsAttached) return;
    wrapper._eventsAttached = true;

    let resizeHandle = wrapper.querySelector('.resize-handle');
    if (!resizeHandle) {
      resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.innerHTML = '<i class="ph-bold ph-dots-six" style="font-size:14px;color:white;"></i>';
      resizeHandle.style.cssText = 'position:absolute;bottom:0px;right:0px;width:24px;height:24px;background:#B5A8D9;border-radius:50%;cursor:se-resize;z-index:100;display:none;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
      resizeHandle.title = 'Redimensionar';
      wrapper.appendChild(resizeHandle);
    }

    let deleteHandle = wrapper.querySelector('.delete-handle');
    if (!deleteHandle) {
      deleteHandle = document.createElement('div');
      deleteHandle.innerHTML = '<i class="ph-bold ph-x" style="font-size:12px;"></i>';
      deleteHandle.className = 'delete-handle';
      deleteHandle.style.cssText = 'position:absolute;top:-12px;right:-12px;width:26px;height:26px;background:#FFB4B4;color:white;border-radius:50%;cursor:pointer;z-index:101;display:none;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
      deleteHandle.title = 'Eliminar';
      wrapper.appendChild(deleteHandle);
    }

    const img = wrapper.querySelector('img');
    const canvas = wrapper.querySelector('.drawing-canvas');

    const handleMouseDown = function(e) {
      if (wrapper.classList.contains('drawing-locked')) return;
      
      if (e.target === resizeHandle || resizeHandle.contains(e.target) || e.target.classList.contains('resize-handle')) {
        wrapper._isResizing = true;
        wrapper._startX = e.clientX;
        wrapper._startY = e.clientY;
        wrapper._initialWidth = img.offsetWidth;
        wrapper._initialHeight = img.offsetHeight;
        if (canvas) {
          wrapper._oldCanvasData = canvas.toDataURL();
          wrapper._oldCanvasWidth = canvas.width;
          wrapper._oldCanvasHeight = canvas.height;
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      if (e.target === deleteHandle || deleteHandle.contains(e.target)) return;
      
      if (e.target === img || e.target === wrapper || wrapper.contains(e.target)) {
        wrapper._isDragging = true;
        wrapper._dragStartX = e.clientX;
        wrapper._dragStartY = e.clientY;
        wrapper._originalLeft = parseInt(wrapper.style.left) || 0;
        wrapper._originalTop = parseInt(wrapper.style.top) || 0;
        wrapper.style.zIndex = '1000';
        e.preventDefault();
      }
    };

    const handleMouseMove = function(e) {
      if (wrapper._isResizing) {
        const dx = e.clientX - wrapper._startX;
        const dy = e.clientY - wrapper._startY;
        
        const aspectRatio = wrapper._initialHeight / wrapper._initialWidth;
        
        let newWidth = Math.max(80, wrapper._initialWidth + dx);
        let newHeight = newWidth * aspectRatio;
        
        if (Math.abs(dy) > Math.abs(dx)) {
          newHeight = Math.max(80, wrapper._initialHeight + dy);
          newWidth = newHeight / aspectRatio;
        }
        
        img.style.width = newWidth + 'px';
        img.style.height = newHeight + 'px';
        
      } else if (wrapper._isDragging) {
        const dx = e.clientX - wrapper._dragStartX;
        const dy = e.clientY - wrapper._dragStartY;
        wrapper.style.left = (wrapper._originalLeft + dx) + 'px';
        wrapper.style.top = (wrapper._originalTop + dy) + 'px';
      }
    };

    const handleMouseUp = function() {
      if (wrapper._isResizing && canvas && wrapper._oldCanvasData) {
        const scaleX = img.offsetWidth / wrapper._initialWidth;
        const scaleY = img.offsetHeight / wrapper._initialHeight;
        
        canvas.width = Math.round(wrapper._oldCanvasWidth * scaleX);
        canvas.height = Math.round(wrapper._oldCanvasHeight * scaleY);
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const tempImg = new Image();
        tempImg.onload = function() {
          ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        };
        tempImg.src = wrapper._oldCanvasData;
        
        delete wrapper._oldCanvasData;
        delete wrapper._oldCanvasWidth;
        delete wrapper._oldCanvasHeight;
      }
      
      wrapper._isDragging = false;
      wrapper._isResizing = false;
      wrapper.style.zIndex = '';
      
      if (wrapper.classList.contains('selected')) {
        wrapper.dataset.width = img.offsetWidth;
        wrapper.dataset.left = wrapper.style.left;
        wrapper.dataset.top = wrapper.style.top;
      }
    };

    wrapper.onmousedown = handleMouseDown;
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    wrapper.onclick = function(e) {
      if (e.target === deleteHandle || (deleteHandle && deleteHandle.contains(e.target))) {
        return;
      }
      if (e.target === resizeHandle || (resizeHandle && resizeHandle.contains(e.target))) {
        return;
      }
      
      document.querySelectorAll('.floating-image').forEach(w => {
        w.classList.remove('selected');
        const rh = w.querySelector('.resize-handle');
        const dh = w.querySelector('.delete-handle');
        if (rh) rh.style.display = 'none';
        if (dh) dh.style.display = 'none';
      });
      wrapper.classList.add('selected');
      resizeHandle.style.display = 'block';
      deleteHandle.style.display = 'block';
    };

    deleteHandle.onclick = function(e) {
      e.stopPropagation();
      if (confirm('¿Eliminar esta imagen?')) {
        wrapper.remove();
      }
    };
  },

  // Auto-save logic has been removed. Manual saving is handled via the saveNoteBtn in the toolbar.

  openNote(note) {
    this.currentNote = note;
    this.emptyState.style.display = 'none';
    this.noteEditor.style.display = 'flex';

    this.noteTitle.value = note.title || '';
    this.noteContent.innerHTML = note.content || '';

    this.applyNoteStyle(note.style || {});

    const imageStyles = note.style && note.style.imageStyles ? note.style.imageStyles : [];
    
    setTimeout(() => {
      console.log('Looking for floating images, found:', document.querySelectorAll('.floating-image').length);
      document.querySelectorAll('.floating-image').forEach((wrapper, index) => {
        console.log('Setting up wrapper', index);
        this.setupFloatingImage(wrapper);
        
        const savedStyle = imageStyles.find(s => s.id === index);
        if (savedStyle) {
          const img = wrapper.querySelector('img');
          if (img && savedStyle.width) {
            img.style.width = savedStyle.width + 'px';
            wrapper.style.left = savedStyle.left;
            wrapper.style.top = savedStyle.top;
            wrapper.dataset.width = savedStyle.width;
            wrapper.dataset.left = savedStyle.left;
            wrapper.dataset.top = savedStyle.top;
          }
        }
        
        if (typeof Drawing !== 'undefined') {
          const canvas = wrapper.querySelector('.drawing-canvas');
          const drawingData = canvas ? canvas.getAttribute('data-drawing') : null;
          Drawing.initCanvas(wrapper);
          if (drawingData) {
            const img = wrapper.querySelector('img');
            if (img.complete) {
              Drawing.loadCanvasData(wrapper, drawingData);
            } else {
              img.onload = () => {
                Drawing.loadCanvasData(wrapper, drawingData);
              };
            }
          }
        }
      });
    }, 100);
  },

  applyNoteStyle(style) {
    if (!style) return;

    const noteEditor = document.getElementById('noteEditor');
    if (!noteEditor) return;

    if (style.backgroundColor) {
      noteEditor.style.setProperty('--note-bg', style.backgroundColor);
    }
    if (style.borderColor) {
      noteEditor.style.setProperty('--note-border-color', style.borderColor);
    }
    if (style.borderWidth) {
      noteEditor.style.setProperty('--note-border-width', style.borderWidth);
    }
    if (style.borderRadius) {
      noteEditor.style.setProperty('--note-radius', style.borderRadius);
    }
    if (style.clipPath) {
      noteEditor.style.setProperty('--note-clip-path', style.clipPath);
    } else {
      noteEditor.style.setProperty('--note-clip-path', 'none');
    }
    if (style.width) {
      noteEditor.style.setProperty('--note-width', style.width);
    }
    if (style.fontFamily) {
      noteEditor.style.setProperty('--note-font', style.fontFamily);
    }
    if (style.fontSize) {
      noteEditor.style.setProperty('--note-font-size', style.fontSize);
    }
    if (style.shadow === false) {
      noteEditor.style.setProperty('--note-shadow', 'none');
    } else if (style.shadow !== undefined) {
      noteEditor.style.setProperty('--note-shadow', '0 10px 40px rgba(0, 0, 0, 0.1)');
    }
    if (style.opacity) {
      noteEditor.style.setProperty('--note-opacity', `${style.opacity}%`);
    }
  },

  async saveNote() {
    if (!this.currentNote) return;

    const noteEditor = document.getElementById('noteEditor');
    const currentStyle = this.currentNote.style || {};
    
    const style = {
      backgroundColor: noteEditor.style.getPropertyValue('--note-bg') || currentStyle.backgroundColor || '#ffffff',
      borderColor: noteEditor.style.getPropertyValue('--note-border-color') || currentStyle.borderColor || '#e0e0e0',
      borderWidth: noteEditor.style.getPropertyValue('--note-border-width') || currentStyle.borderWidth || '1px',
      borderRadius: noteEditor.style.getPropertyValue('--note-radius') || currentStyle.borderRadius || '12px',
      clipPath: noteEditor.style.getPropertyValue('--note-clip-path') || currentStyle.clipPath || '',
      width: noteEditor.style.getPropertyValue('--note-width') || currentStyle.width || '600px',
      fontFamily: noteEditor.style.getPropertyValue('--note-font') || currentStyle.fontFamily || 'Poppins',
      fontSize: noteEditor.style.getPropertyValue('--note-font-size') || currentStyle.fontSize || '14px',
      shadow: currentStyle.shadow !== undefined ? currentStyle.shadow : true,
      opacity: currentStyle.opacity || 100
    };

    const imageStyles = [];
    document.querySelectorAll('.floating-image').forEach((wrapper, index) => {
      const img = wrapper.querySelector('img');
      const left = wrapper.dataset.left || wrapper.style.left;
      const top = wrapper.dataset.top || wrapper.style.top;
      const width = wrapper.dataset.width || img.offsetWidth;
      
      imageStyles.push({
        id: index,
        width: parseInt(width),
        left: left,
        top: top
      });
      wrapper.dataset.id = index;
      wrapper.dataset.width = width;
      wrapper.dataset.left = left;
      wrapper.dataset.top = top;
    });
    if (imageStyles.length > 0) {
      style.imageStyles = imageStyles;
    }

    this.serializeDrawingData();

    const noteData = {
      title: this.noteTitle.value,
      content: this.noteContent.innerHTML,
      style: style
    };

    try {
      const response = await fetch(`${API_URL}/notes/${this.currentNote.id}`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        this.currentNote = { ...this.currentNote, ...updatedNote };
        
        if (typeof App !== 'undefined') {
          App.updateNoteInList(this.currentNote);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  },

  closeNote() {
    this.currentNote = null;
    this.noteEditor.style.display = 'none';
    this.emptyState.style.display = 'flex';
  },

  serializeDrawingData() {
    const wrappers = document.querySelectorAll('.floating-image');
    wrappers.forEach(wrapper => {
      const canvas = wrapper.querySelector('.drawing-canvas');
      if (canvas) {
        try {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasDrawing = imageData.data.some(value => value !== 0);
          const dataUrl = canvas.toDataURL();
          canvas.setAttribute('data-drawing', hasDrawing ? dataUrl : '');
        } catch (e) {
          console.warn('Could not serialize canvas data:', e);
        }
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.Editor = Editor;
}
