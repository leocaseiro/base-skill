import { useMemo, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { useRxQuery } from './useRxQuery';
import type { Observable } from 'rxjs';
import { Button } from '#/components/ui/button';

const CounterDemo = ({ source$ }: { source$: Observable<number> }) => {
  const count = useRxQuery(source$, 0);
  return <p className="text-2xl font-bold tabular-nums">{count}</p>;
};

export const UseRxQueryDemo = () => {
  const [subject] = useState(() => new Subject<number>());
  const source$ = useMemo(() => subject.asObservable(), [subject]);
  const countRef = useRef(0);

  const increment = () => {
    countRef.current += 1;
    subject.next(countRef.current);
  };

  const reset = () => {
    countRef.current = 0;
    subject.next(0);
  };

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <CounterDemo source$={source$} />
      <div className="flex gap-2">
        <Button onClick={increment}>Increment</Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
};
