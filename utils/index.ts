import { EventObject } from 'xstate';
import { map, Observable, pipe, Subject, tap } from 'rxjs';
import { useEffect, useState } from 'react';

export function assertEventType<TE extends EventObject, TType extends TE['type']>(
  event: TE,
  eventType: TType,
): asserts event is TE & { type: TType } {
  if (event.type !== eventType) {
    throw new Error(`Invalid event: expected "${eventType}", got "${event.type}"`);
  }
}

export function useSubscription<T>(source$: Observable<T>, nextHandler: (value: T) => void) {
  useEffect(() => {
    if (source$) {
      const subs = source$.subscribe(nextHandler);
      return () => {
        subs.unsubscribe();
      };
    }
  }, [source$]);
}

export function useObservable<T>(source$: Observable<T>, initialState?: T): T {
  const [value, setValue] = useState(initialState);
  useSubscription(source$, setValue);
  return value as T;
}

export function debug(message: string) {
  return pipe(tap((value) => console.log(`[${message}]`, value)));
}

export function mapTo(value: any) {
  return pipe(map(() => value));
}
