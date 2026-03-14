const Spreadsheet = {
  init() {
    const insertTableBtn = document.getElementById('insertTableBtn');
    if (insertTableBtn) {
      insertTableBtn.addEventListener('click', () => {
        this.insertTable();
      });
    }
    
    // Listen for blur events on the noteContent to calculate formulas inside tables
    const noteContent = document.getElementById('noteContent');
    if (noteContent) {
      noteContent.addEventListener('blur', (e) => {
        if (e.target && e.target.tagName === 'TD' && e.target.closest('table.note-spreadsheet')) {
          this.calculateFormulas(e.target.closest('table.note-spreadsheet'));
        }
      }, true); // Use capture phase for blur event on children
    }
  },

  insertTable() {
    const rows = 4;
    const cols = 4;
    
    let html = `
      <div class="spreadsheet-wrapper" contenteditable="false" style="margin: 10px 0; user-select: none;">
        <table class="note-spreadsheet" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px; background: #e9ecef; border: 1px solid #dee2e6; padding: 8px; text-align: center;">#</th>
    `;
    
    for (let c = 0; c < cols; c++) {
      html += `<th style="background: #e9ecef; border: 1px solid #dee2e6; padding: 8px; text-align: center; min-width: 80px;">${String.fromCharCode(65 + c)}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      html += `<td contenteditable="false" style="background: #e9ecef; border: 1px solid #dee2e6; padding: 8px; text-align: center; font-weight: bold; user-select: none;">${r + 1}</td>`;
      for (let c = 0; c < cols; c++) {
        html += `<td contenteditable="true" data-row="${r}" data-col="${c}" style="border: 1px solid #dee2e6; padding: 8px; min-width: 80px; user-select: text;"></td>`;
      }
      html += '</tr>';
    }
    
    html += `
          </tbody>
        </table>
        <div class="spreadsheet-controls" style="margin-top: 5px; background: #f8f9fa; padding: 5px; border: 1px solid #dee2e6; border-radius: 4px; display: inline-block; user-select: none;">
          <button type="button" onclick="Spreadsheet.addRow(this)" style="padding: 4px 8px; margin-right: 5px; cursor: pointer; background: #fff; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px;">+ Fila</button>
          <button type="button" onclick="Spreadsheet.addColumn(this)" style="padding: 4px 8px; margin-right: 5px; cursor: pointer; background: #fff; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px;">+ Columna</button>
          <button type="button" onclick="Spreadsheet.deleteTable(this)" style="padding: 4px 8px; cursor: pointer; background: #ffeded; border: 1px solid #ffbcbc; color: #d63031; border-radius: 4px; font-size: 12px;">Eliminar Tabla</button>
        </div>
      </div>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, html);
  },

  addRow(btn) {
    const wrapper = btn.closest('.spreadsheet-wrapper');
    const table = wrapper.querySelector('table.note-spreadsheet');
    const tbody = table.querySelector('tbody');
    const colsCount = table.querySelectorAll('thead th').length - 1;
    const newRowIdx = tbody.querySelectorAll('tr').length;
    
    const tr = document.createElement('tr');
    let tdHtml = `<td contenteditable="false" style="background: #e9ecef; border: 1px solid #dee2e6; padding: 8px; text-align: center; font-weight: bold; user-select: none;">${newRowIdx + 1}</td>`;
    
    for (let c = 0; c < colsCount; c++) {
      tdHtml += `<td contenteditable="true" data-row="${newRowIdx}" data-col="${c}" style="border: 1px solid #dee2e6; padding: 8px; min-width: 80px; user-select: text;"></td>`;
    }
    
    tr.innerHTML = tdHtml;
    tbody.appendChild(tr);

    // Trigger auto-save if Editor exists
    if (typeof Editor !== 'undefined' && Editor.scheduleAutoSave) {
      Editor.scheduleAutoSave();
    }
  },

  addColumn(btn) {
    const wrapper = btn.closest('.spreadsheet-wrapper');
    const table = wrapper.querySelector('table.note-spreadsheet');
    const thead = table.querySelector('thead tr');
    const tbodyRows = table.querySelectorAll('tbody tr');
    const newColIdx = thead.querySelectorAll('th').length - 1;
    
    // Add header
    const th = document.createElement('th');
    th.style.cssText = "background: #e9ecef; border: 1px solid #dee2e6; padding: 8px; text-align: center; min-width: 80px;";
    th.innerText = String.fromCharCode(65 + newColIdx);
    thead.appendChild(th);
    
    // Add cell to each row
    tbodyRows.forEach((tr, r) => {
      const td = document.createElement('td');
      td.contentEditable = "true";
      td.dataset.row = r;
      td.dataset.col = newColIdx;
      td.style.cssText = "border: 1px solid #dee2e6; padding: 8px; min-width: 80px; user-select: text;";
      tr.appendChild(td);
    });

    // Trigger auto-save if Editor exists
    if (typeof Editor !== 'undefined' && Editor.scheduleAutoSave) {
      Editor.scheduleAutoSave();
    }
  },

  deleteTable(btn) {
    const wrapper = btn.closest('.spreadsheet-wrapper');
    if (wrapper) {
      wrapper.remove();
      // Trigger auto-save if Editor exists
      if (typeof Editor !== 'undefined' && Editor.scheduleAutoSave) {
        Editor.scheduleAutoSave();
      }
    }
  },

  calculateFormulas(table) {
    const cells = table.querySelectorAll('tbody td[contenteditable="true"]');
    
    // Build a data matrix
    const data = [];
    let maxRow = -1;
    let maxCol = -1;
    
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (!data[r]) data[r] = [];
      data[r][c] = cell.innerText.trim();
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    });
    
    let changed = false;

    // Check formulas
    cells.forEach(cell => {
      const val = cell.innerText.trim();
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      
      if (val.toUpperCase().startsWith('=SUM(')) {
        const match = val.match(/=SUM\((\w+):(\w+)\)/i);
        if (match) {
          const start = match[1].toUpperCase();
          const end = match[2].toUpperCase();
          const startCol = start.charCodeAt(0) - 65;
          const startRow = parseInt(start.substring(1)) - 1;
          const endCol = end.charCodeAt(0) - 65;
          const endRow = parseInt(end.substring(1)) - 1;

          let sum = 0;
          for (let rr = startRow; rr <= endRow && rr <= maxRow; rr++) {
            for (let cc = startCol; cc <= endCol && cc <= maxCol; cc++) {
              if (data[rr] && data[rr][cc]) {
                const num = parseFloat(data[rr][cc]);
                if (!isNaN(num) && (rr !== r || cc !== c)) {
                  sum += num;
                }
              }
            }
          }
          if (cell.innerText !== sum.toString()) {
            cell.innerText = sum;
            data[r][c] = sum;
            changed = true;
          }
        }
      }
    });

    if (changed && typeof Editor !== 'undefined' && Editor.scheduleAutoSave) {
      Editor.scheduleAutoSave();
    }
  }
};

if (typeof window !== 'undefined') {
  window.Spreadsheet = Spreadsheet;
}
