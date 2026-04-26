import { useState } from 'react';

/**
 * usePdfExport — opens a clean styled print window and triggers the browser's
 * native "Save as PDF" dialog. Works perfectly with dark-themed apps that use
 * backdrop-filter, CSS variables, and glassmorphism — no external libraries needed.
 *
 * @returns {{ exportToPdf, isExporting }}
 */
export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * @param {string} elementId  — id of the DOM element to export
   * @param {string} fileName   — used as the print window title (browser uses as default PDF filename)
   */
  const exportToPdf = (elementId, fileName = 'lecture-lens-export') => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`usePdfExport: element #${elementId} not found`);
      return;
    }

    setIsExporting(true);

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for localhost to export PDF.');
        setIsExporting(false);
        return;
      }

      // Clone the content so we can strip interactive elements
      const clone = element.cloneNode(true);
      clone.querySelectorAll('button').forEach(btn => btn.remove());

      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const nowStr = new Date().toLocaleString();

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fileName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 2rem 2.5rem;
      background: #ffffff;
      color: #1a1a2e;
      font-size: 13px;
      line-height: 1.7;
    }

    /* Brand header */
    .pdf-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #10b981;
    }
    .pdf-brand-name { font-size: 1.1rem; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
    .pdf-brand-sub  { font-size: 0.7rem; color: #6b7280; margin-left: auto; }

    /* Typography */
    h1, h2, h3, h4 { color: #111827; margin: 1.2rem 0 0.4rem; font-weight: 700; line-height: 1.3; }
    h1 { font-size: 1.3rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.4rem; }
    h2 { font-size: 1.1rem; }
    h3 { font-size: 0.95rem; color: #10b981; }
    p  { margin: 0.4rem 0 0.7rem; }

    ul, ol { padding-left: 1.4rem; margin: 0.4rem 0; }
    li { margin-bottom: 0.25rem; }
    li::marker { color: #10b981; }

    strong { color: #111827; font-weight: 600; }
    em     { color: #374151; }
    a      { color: #10b981; text-decoration: underline; }

    code {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px;
      padding: 0.15rem 0.4rem; font-size: 0.82em;
      font-family: 'Courier New', monospace; color: #374151;
    }
    pre {
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 1rem; overflow: auto; font-size: 0.8rem;
    }
    pre code { background: none; border: none; padding: 0; }

    blockquote {
      border-left: 3px solid #10b981; margin: 0.75rem 0;
      padding: 0.5rem 1rem; background: #f0fdf4; color: #374151; border-radius: 0 4px 4px 0;
    }

    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.85rem; }
    th { background: #10b981; color: white; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; }
    td { padding: 0.45rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }

    /* Quiz cards */
    .quiz-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fafafa; }
    .quiz-question { font-weight: 600; margin-bottom: 0.5rem; }
    .quiz-number   { color: #10b981; font-weight: 700; }
    .quiz-options  { display: flex; flex-direction: column; gap: 0.3rem; }
    .quiz-option   { display: block; padding: 0.4rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 0.85rem; }
    .quiz-option.correct   { background: #d1fae5; border-color: #10b981; }
    .quiz-option.incorrect { background: #fee2e2; border-color: #ef4444; }
    .option-letter { font-weight: 700; margin-right: 0.4rem; color: #6b7280; }

    /* Flashcards */
    .flashcard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .flashcard      { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; background: #f9fafb; }
    .flashcard-inner, .flashcard-front, .flashcard-back { display: block !important; transform: none !important; backface-visibility: visible !important; position: static !important; }
    .flashcard-back { border-top: 1px dashed #d1d5db; margin-top: 0.5rem; padding-top: 0.5rem; }
    .flashcard-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #10b981; }
    .flashcard-text  { font-size: 0.85rem; color: #111827; margin: 0.25rem 0 0; }

    /* Section headers rendered in print */
    .pdf-summary-header,
    .link-summary-banner-header,
    .research-results-header,
    .study-heading {
      font-size: 1rem; font-weight: 700; color: #111827;
      margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid #e5e7eb;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .markdown-summary, .research-results-body { color: #1f2937; }

    /* Hide SVGs and export bar */
    svg, .study-export-bar, .pdf-summary-icon { display: none !important; }

    /* Footer */
    .pdf-footer {
      margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;
      font-size: 0.65rem; color: #9ca3af; text-align: right;
    }

    @media print {
      body { padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="pdf-brand">
    <span class="pdf-brand-name">📚 Lecture Lens</span>
    <span class="pdf-brand-sub">AI Study Tools — ${dateStr}</span>
  </div>

  ${clone.innerHTML}

  <div class="pdf-footer">Generated by Lecture Lens AI &bull; ${nowStr}</div>

  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 400);
    };
  <\/script>
</body>
</html>`);

      printWindow.document.close();
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
}
