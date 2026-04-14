import { useEffect, useId, useRef } from 'react';

interface MermaidProps {
  chart: string;
}

/**
 * Read a ref's `.current` without TS control-flow narrowing so that
 * re-reads after an `await` are not treated as redundant checks.
 */
const readRef = <T,>(r: React.RefObject<T>): T => r.current;

export const Mermaid = ({ chart }: MermaidProps) => {
  // useId produces strings like ":r0:" — colons are invalid in SVG ids
  const rawId = useId();
  const id = `mermaid-${rawId.replaceAll(':', '')}`;
  const ref = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const render = async () => {
      const mermaidModule = await import('mermaid');
      const mermaid = mermaidModule.default;
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      if (cancelledRef.current || !ref.current) return;
      try {
        const { svg } = await mermaid.render(id, chart.trim());
        const el = readRef(ref);
        if (!readRef(cancelledRef) && el) {
          el.innerHTML = svg;
        }
      } catch {
        const el = readRef(ref);
        if (!readRef(cancelledRef) && el) {
          el.textContent = chart;
        }
      }
    };
    render();
    return () => {
      cancelledRef.current = true;
    };
  }, [chart, id]);

  return <div ref={ref} aria-label="Diagram" />;
};
