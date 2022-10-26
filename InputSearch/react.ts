import React from 'react';
import { useObservable } from '../utils';
import { tap } from 'rxjs';
import InputSearch from './index';
import { Place } from './types';

function change(event: React.ChangeEvent<HTMLInputElement>) {
  InputSearch.fireEvent({ type: 'change', payload: event.target.value });
}

function focus(event?: React.FocusEvent<HTMLInputElement>) {
  InputSearch.fireEvent({ type: 'focus' });
}

function click(event: React.MouseEvent<HTMLInputElement>) {
  InputSearch.fireEvent({ type: 'click' });
}

function blur() {
  InputSearch.fireEvent({ type: 'blur' });
}

function clear() {
  InputSearch.fireEvent({ type: 'change', payload: '' });
}

function select(placeId: Place['place_id']) {
  InputSearch.fireEvent({ type: 'select', payload: placeId });
}

function usePlaces(props: { onFocus: Function | undefined }) {
  const value = useObservable(InputSearch.values, '');
  const data = useObservable(InputSearch.places, []);
  const status = useObservable(InputSearch.statuses, 'idle');
  const error = useObservable(InputSearch.errors, null);
  const placeSelected = useObservable(InputSearch.selectedPlaces, '');

  useObservable(
    InputSearch.focus.pipe(
      tap(() => {
        props.onFocus?.();
      }),
    ),
    false,
  );

  return { value, places: data, status, placeSelected, error, Event: { change, focus, click, blur, clear, select } };
}

export default { usePlaces };
