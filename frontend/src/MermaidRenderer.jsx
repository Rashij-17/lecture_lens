import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialise once with a dark theme that matches the Midnight Aurora palette
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    // Background / canvas
    background:         '#0f1117',
    mainBkg:            '#1a1f2e',
    nodeBorder:         '#10b981',
    // Text
    primaryTextColor:   '#e2e8f0',
    secondaryTextColor: '#94a3b8',
    tertiaryTextColor:  '#64748b',
    // Node fills
    primaryColor:       '#1e2a3a',
    secondaryColor:     '#162130',
    tertiaryColor:      '#0f1a26',
    // Edges & lines
    lineColor:          '#10b981',
    edgeLabelBackground:'#1a1f2e',
    // Cluster / subgraph
    clusterBkg:         '#161c28',
    clusterBorder:      '#334155',
    // Flowchart arrows
    arrowheadColor:     '#10b981',
    // Sequence diagram
    actorBkg:           '#1a1f2e',
    actorBorder:        '#10b981',
    activationBorderColor: '#10b981',
    activationBkgColor: '#1e2a3a',
    signalColor:        '#10b981',
    signalTextColor:    '#e2e8f0',
    noteBkgColor:       '#162130',
    noteTextColor:      '#94a3b8',
    noteBorderColor:    '#334155',
    // Fonts
    fontFamily:         'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize:           '14px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  securityLevel: 'loose',
});

let _idCounter = 0;

export default function MermaidRenderer({ chart }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    const id = `mermaid-svg-${++_idCounter}`;
    setError(null);

    // ReactMarkdown sometimes passes HTML escaped quotes (&quot;) or other entities inside code blocks
    // Mermaid syntax strictly requires pure double quotes, so we decode them here to prevent crashes.
    const cleanedChart = chart
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    mermaid
      .render(id, cleanedChart)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make the SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
        }
      })
      .catch((err) => {
        console.error('[MermaidRenderer] render error:', err);
        setError('Could not render the concept map. The AI may have produced invalid syntax.');
      });
  }, [chart]);

  if (error) {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '10px',
        color: '#fca5a5',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '1.25rem',
        background: 'rgba(16, 185, 129, 0.04)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '14px',
        margin: '0.5rem 0',
      }}
    />
  );
}
