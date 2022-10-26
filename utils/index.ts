import { EventObject } from 'xstate';
import { map, Observable, pipe, Subject, tap, UnaryFunction } from 'rxjs';
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

export function mapTo<E, P>(value: P): UnaryFunction<Observable<E>, Observable<P>> {
  return pipe(map(() => value));
}

export function selectProperty<E, P extends keyof E>(property: P): UnaryFunction<Observable<E>, Observable<E[P]>> {
  return pipe(map((obj) => obj[property]));
}
