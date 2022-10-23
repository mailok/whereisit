import {
  catchError,
  debounceTime as waitForTerm,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Observable,
  of,
  pairwise,
  pipe,
  share,
  startWith,
  Subject,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';
import { mapTo, useObservable } from './index';
import React from 'react';

export interface Place {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: any;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon: string;
}

type Query = {
  places: Place[];
  isFetching: boolean;
  error: null | string;
};

export const STATUS = {
  IDLE: 'idle',
  NO_CONTENT_FOUND: 'no_content_found',
  CONTENT_FOUND: 'content_found',
  LOADING: 'loading',
} as const;

const LOADING: Query = {
  isFetching: true,
  places: [],
  error: null,
};

const DEFAULT: Query = {
  isFetching: false,
  places: [],
  error: null,
};

const TO_QUERY = (places: Place[]): Query => ({ places, isFetching: false, error: null });

const TO_ERROR = (error: any): Observable<Query> =>
  of({ places: [], isFetching: false, error: 'Ups! something wrong' });

const FETCH_OPTIONS = {
  selector: (response: Response) => response.json(),
};

// ========================================= SOURCE OBSERVABLES ===========================================
const typings$ = new Subject<string>();
const focuses$ = new Subject<void>();
const clicks$ = new Subject<void>();
const selections$ = new Subject<Place['place_id']>();

// ========================================= INTERMEDIATE OBSERVABLES ===========================================

const queries$ = typings$.pipe(waitForTerm(500), replaceTerm(' ', '+'), share());

const requests$ = queries$.pipe(switchMap(fetchByTerm), startWith(DEFAULT), share());

const loads$ = requests$.pipe(
  map((query) => query.isFetching),
  filter((isLoading) => isLoading),
  mapTo(STATUS.LOADING),
);

const selectedPlaces$ = selections$.pipe(
  withLatestFrom(requests$),
  map(([id, query]) => query.places.find((place) => place.place_id === id)),
  map((place) => (place ? place.display_name : '')),
  filter((name) => !!name.trim()),
);

const emptyResponses$ = requests$.pipe(
  pairwise(),
  filter(([oldQuery, newQuery]) => oldQuery.isFetching && !newQuery.isFetching),
  map(([_, newQuery]) => !Boolean(newQuery.places.length)),
  share(),
);

const notFound$ = emptyResponses$.pipe(
  filter((hasPlaces) => hasPlaces),
  mapTo(STATUS.NO_CONTENT_FOUND),
);

const found$ = emptyResponses$.pipe(
  filter((hasPlaces) => !hasPlaces),
  mapTo(STATUS.CONTENT_FOUND),
);

// ========================================= STATE OPERATORS ===========================================
const values$ = merge(typings$, selectedPlaces$);

const places$ = requests$.pipe(
  map((query) => query.places),
  distinctUntilChanged(),
);
const errors$ = requests$.pipe(
  map((query) => query.error),
  distinctUntilChanged(),
);

const idle$ = values$.pipe(mapTo(STATUS.IDLE));

const statuses$ = merge(notFound$, found$, idle$, loads$).pipe(distinctUntilChanged());
// ========================================= CUSTOM OPERATORS ===========================================

function replaceTerm(searchValue: string | RegExp, replaceValue: string) {
  return pipe(map((term: string) => (term || '').replaceAll(searchValue, replaceValue)));
}

function fetchByTerm(term: string): Observable<Query> {
  if (!term.trim()) return of(DEFAULT);

  return fromFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${term}`, FETCH_OPTIONS).pipe(
    map(TO_QUERY),
    startWith(LOADING),
    catchError(TO_ERROR),
  );
}

function change(event: React.ChangeEvent<HTMLInputElement>) {
  typings$.next(event.target.value);
}

function focus(event: React.FocusEvent<HTMLInputElement>) {
  focuses$.next();
}

function click(event: React.MouseEvent<HTMLInputElement>) {
  clicks$.next();
}

function clear() {
  typings$.next('');
}

function select(placeId: Place['place_id']) {
  selections$.next(placeId);
}

function usePlaces() {
  const value = useObservable(values$, '');
  const places = useObservable(places$, []);
  const status = useObservable(statuses$, 'idle');
  const error = useObservable(errors$, null);
  return { value, places, status, error, Event: { change, focus, click, clear, select } };
}

export default { usePlaces };
