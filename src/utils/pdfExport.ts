import { LessonEntry, PlannerData } from '../types';

/**
 * Escapes HTML characters for safety in print template
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the standalone HTML string for a class's complete planning
 */
export function buildClassPrintHtml(className: string, notesHtml: string, entries: LessonEntry[]): string {
  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const total = entries.length;
  const doneCount = entries.filter((e) => e.done).length;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Unterrichtsplanung - ${escapeHtml(className)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      padding: 15px 20px;
    }
    .no-print-bar {
      background: #1e293b;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .no-print-bar button {
      background: #4338ca;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .no-print-bar button:hover {
      background: #3730a3;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
    .header {
      border-bottom: 2.5px solid #1e293b;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .header-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
    }
    .header-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
    }
    .header-badge {
      display: inline-block;
      padding: 2px 7px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 3px;
    }

    /* NOTES BLOCK */
    .notes-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #4338ca;
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .notes-title {
      font-size: 9pt;
      font-weight: 700;
      color: #312e81;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 5px;
    }
    .notes-body {
      font-size: 9pt;
      color: #1e293b;
      line-height: 1.5;
    }
    .notes-body ul, .notes-body ol {
      padding-left: 20px;
      margin: 4px 0;
    }
    .notes-body li {
      margin-bottom: 2px;
    }

    /* TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 4px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background-color: #1e293b;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 7px;
      border: 1px solid #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    td {
      padding: 6px 7px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      color: #0f172a;
    }
    tbody tr:nth-child(even) td {
      background-color: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .col-idx {
      width: 26px;
      text-align: center;
      font-weight: 600;
      color: #64748b;
    }
    .col-date {
      width: 84px;
      white-space: nowrap;
      font-weight: 600;
      color: #0f172a;
    }
    .col-plan {
      min-width: 180px;
    }
    .col-done {
      width: 44px;
      text-align: center;
    }
    .col-eval {
      width: 78px;
    }
    .col-note {
      min-width: 140px;
      color: #334155;
    }
    .done-badge {
      display: inline-block;
      font-weight: bold;
      color: #15803d;
      font-size: 10pt;
    }
    .not-done {
      color: #cbd5e1;
    }
    .footer {
      margin-top: 15px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Druckvorschau &amp; PDF-Export: ${escapeHtml(className)}</strong>
      <div style="font-size: 11px; opacity: 0.8;">Klicke auf den Button oder drücke Strg+P / Cmd+P zum Speichern als PDF</div>
    </div>
    <button onclick="window.print()">🖨️ Jetzt Drucken / Als PDF speichern</button>
  </div>

  <div class="header">
    <div>
      <div class="header-title">📚 Unterrichtsplanung: ${escapeHtml(className)}</div>
      <div class="header-sub">Erstellt am ${currentDate}</div>
    </div>
    <div class="header-meta">
      <div>Gesamt: <strong>${total}</strong> Einheiten</div>
      <div class="header-badge">${doneCount} von ${total} erledigt (${total > 0 ? Math.round((doneCount / total) * 100) : 0}%)</div>
    </div>
  </div>

  ${
    notesHtml && notesHtml.replace(/<[^>]+>/g, '').trim()
      ? `
    <div class="notes-box">
      <div class="notes-title">📝 Notizen &amp; Allgemeine Stoffverteilung</div>
      <div class="notes-body">${notesHtml}</div>
    </div>
  `
      : ''
  }

  <table>
    <thead>
      <tr>
        <th class="col-idx">#</th>
        <th class="col-date">Datum</th>
        <th class="col-plan">Planung / Thema</th>
        <th class="col-done">Erledigt</th>
        <th class="col-eval">Bewertung</th>
        <th class="col-note">Bemerkungen</th>
      </tr>
    </thead>
    <tbody>
      ${
        entries.length === 0
          ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">Keine Unterrichtseinheiten eingetragen.</td></tr>`
          : entries
              .map(
                (entry, idx) => `
        <tr>
          <td class="col-idx">${idx + 1}</td>
          <td class="col-date">${escapeHtml(entry.date || '—')}</td>
          <td class="col-plan">${entry.plan || '—'}</td>
          <td class="col-done">${
            entry.done
              ? '<span class="done-badge">✓</span>'
              : '<span class="not-done">○</span>'
          }</td>
          <td class="col-eval">${escapeHtml(entry.grade || '—')}</td>
          <td class="col-note">${entry.note || '—'}</td>
        </tr>
      `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="footer">
    <span>Unterrichtsplaner • Vollständige Klassenübersicht</span>
    <span>Gedruckt / Exportiert am ${currentDate}</span>
  </div>
</body>
</html>
`;
}

/**
 * Opens a new browser tab with the full PDF print preview
 * and automatically triggers the print dialog so the user can save as PDF.
 */
export function openClassPdfInNewTab(className: string, notesHtml: string, entries: LessonEntry[]) {
  const html = buildClassPrintHtml(className, notesHtml, entries);

  // Use Blob URL to reliably open in a new tab even from inside iframes/cross-origin wrappers
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const newTab = window.open(blobUrl, '_blank');

  if (newTab) {
    newTab.focus();
    // Auto-trigger print dialog in the new tab after DOM load
    setTimeout(() => {
      try {
        newTab.print();
      } catch (e) {
        console.log('User can click print button in new tab', e);
      }
    }, 500);
  } else {
    // If popup was blocked by browser, trigger in current page or via a hidden anchor
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
