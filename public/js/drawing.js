const Drawing = {
  isDrawMode: false,
  currentCanvas: null,
  ctx: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  canvases: [],

  init() {
    this.drawingTools = document.getElementById('drawingTools');
    this.drawModeBtn = document.getElementById('drawModeBtn');
    this.drawColor = document.getElementById('drawColor');
    this.drawSize = document.getElementById('drawSize');
    this.clearDrawBtn = document.getElementById('clearDraw');
    this.exitDrawModeBtn = document.getElementById('exitDrawMode');

    if (this.drawModeBtn) {
      this.drawModeBtn.addEventListener('click', () => {
        this.toggleDrawMode();
      });
    }

    if (this.clearDrawBtn) {
      this.clearDrawBtn.addEventListener('click', () => {
        this.clearCurrentCanvas();
      });
    }

    if (this.exitDrawModeBtn) {
      this.exitDrawModeBtn.addEventListener('click', () => {
        this.exitDrawMode();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawMode) {
        this.exitDrawMode();
      }
    });
  },

  toggleDrawMode() {
    if (this.isDrawMode) {
      this.exitDrawMode();
    } else {
      this.enterDrawMode();
    }
  },

  enterDrawMode() {
    const selectedImage = document.querySelector('.floating-image.selected');
    
    if (!selectedImage) {
      alert('Selecciona una imagen primero haciendo clic en ella');
      return;
    }

    this.isDrawMode = true;
    this.currentCanvas = selectedImage.querySelector('.drawing-canvas');
    
    if (!this.currentCanvas) {
      return;
    }

    this.ctx = this.currentCanvas.getContext('2d');
    
    if (this.drawingTools) {
      this.drawingTools.style.display = 'flex';
    }

    if (this.drawModeBtn) {
      this.drawModeBtn.classList.add('active');
    }

    document.querySelectorAll('.floating-image').forEach(img => {
      img.classList.add('drawing-locked');
    });
    
    this.setupCanvasEvents();
    document.body.classList.add('draw-mode-cursor');
  },

  exitDrawMode() {
    this.isDrawMode = false;
    this.currentCanvas = null;
    this.ctx = null;

    if (this.drawingTools) {
      this.drawingTools.style.display = 'none';
    }

    if (this.drawModeBtn) {
      this.drawModeBtn.classList.remove('active');
    }

    document.querySelectorAll('.floating-image').forEach(img => {
      img.classList.remove('drawing-locked');
    });

    document.body.classList.remove('draw-mode-cursor');
  },

  initCanvas(wrapper) {
    const img = wrapper.querySelector('img');
    const canvas = wrapper.querySelector('.drawing-canvas');

    if (!img || !canvas) return;

    const updateCanvasSize = () => {
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      canvas.style.width = img.offsetWidth + 'px';
      canvas.style.height = img.offsetHeight + 'px';
    };

    if (img.complete) {
      updateCanvasSize();
    } else {
      img.onload = updateCanvasSize;
    }

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  },

  setupCanvasEvents() {
    if (!this.currentCanvas) return;

    const getCanvasCoords = (clientX, clientY) => {
      const rect = this.currentCanvas.getBoundingClientRect();
      const scaleX = this.currentCanvas.width / rect.width;
      const scaleY = this.currentCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      if (!this.isDrawMode) return;
      
      this.isDrawing = true;
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const coords = getCanvasCoords(clientX, clientY);
      
      this.lastX = coords.x;
      this.lastY = coords.y;
      
      this.ctx.beginPath();
      this.ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e) => {
      if (!this.isDrawing || !this.isDrawMode) return;
      
      e.preventDefault();
      
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const coords = getCanvasCoords(clientX, clientY);
      
      this.ctx.strokeStyle = this.drawColor ? this.drawColor.value : '#000000';
      this.ctx.lineWidth = this.drawSize ? this.drawSize.value : 3;
      this.ctx.lineTo(coords.x, coords.y);
      this.ctx.stroke();
      
      this.lastX = coords.x;
      this.lastY = coords.y;
    };

    const stopDrawing = () => {
      this.isDrawing = false;
    };

    this.currentCanvas.addEventListener('mousedown', startDrawing);
    this.currentCanvas.addEventListener('mousemove', draw);
    this.currentCanvas.addEventListener('mouseup', stopDrawing);
    this.currentCanvas.addEventListener('mouseout', stopDrawing);

    this.currentCanvas.addEventListener('touchstart', startDrawing);
    this.currentCanvas.addEventListener('touchmove', draw);
    this.currentCanvas.addEventListener('touchend', stopDrawing);
  },

  clearCurrentCanvas() {
    if (!this.currentCanvas) return;

    const ctx = this.currentCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.currentCanvas.width, this.currentCanvas.height);
  },

  getCanvasData(wrapper) {
    const canvas = wrapper.querySelector('.drawing-canvas');
    if (!canvas) return null;
    return canvas.toDataURL();
  },

  loadCanvasData(wrapper, dataUrl) {
    if (!dataUrl) return;
    
    let canvas = wrapper.querySelector('.drawing-canvas');
    if (!canvas) return;

    const img = wrapper.querySelector('img');
    if (!img) return;

    const ctx = canvas.getContext('2d');
    const drawingImg = new Image();
    
    drawingImg.onload = () => {
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      canvas.style.width = img.offsetWidth + 'px';
      canvas.style.height = img.offsetHeight + 'px';
      ctx.drawImage(drawingImg, 0, 0);
    };
    
    drawingImg.src = dataUrl;
  }
};

if (typeof window !== 'undefined') {
  window.Drawing = Drawing;
}
