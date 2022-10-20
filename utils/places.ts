import {
  catchError,
  map,
  Observable,
  of,
  pipe,
  debounceTime as waitForTerm,
  startWith,
  Subject,
  switchMap,
  merge,
  combineLatest,
  share,
  zip,
  withLatestFrom,
  filter,
} from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';
import { useObservable } from './index';
import { debug } from './index';
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
  error: boolean;
};

const typing$ = new Subject<string>();
const focus$ = new Subject<void>();
const click$ = new Subject<void>();
const selectedId$ = new Subject<Place['place_id']>();

const term$ = typing$.pipe(waitForTerm(500), replaceTerm(' ', '+'));
const query$ = term$.pipe(
  switchMap(fetchByTerm),
  startWith({
    places: [],
    isFetching: false,
    error: false,
  }),
  share(),
);

const placeSelected$ = selectedId$.pipe(
  withLatestFrom(query$),
  map(([id, query]) => query.places.find((place) => place.place_id === id)),
  map((place) => (place ? place.display_name : '')),
  filter((name) => !!name.trim()),
);

const value$ = merge(typing$, placeSelected$);

function change(event: React.ChangeEvent<HTMLInputElement>) {
  typing$.next(event.target.value);
}

function focus(event: React.FocusEvent<HTMLInputElement>) {
  focus$.next();
}

function click(event: React.MouseEvent<HTMLInputElement>) {
  click$.next();
}

function clear() {
  typing$.next('');
}

function select(placeId: Place['place_id']) {
  selectedId$.next(placeId);
}

function replaceTerm(searchValue: string | RegExp, replaceValue: string) {
  return pipe(map((term: string) => (term || '').replaceAll(searchValue, replaceValue)));
}

const defaultValue = {
  places: [],
  isFetching: false,
  error: false,
};

const loading = {
  ...defaultValue,
  isFetching: true,
};

function fetchByTerm(term: string): Observable<Query> {
  if (!term.trim()) return of(defaultValue);

  return fromFetch<Place[]>(`https://nominatim.openstreetmap.org/search?format=json&q=${term}`, {
    selector: (response) => response.json(),
  }).pipe(map(newQuery), startWith(loading), catchError(error));
}

function error(): Observable<Query> {
  return of({ places: [], isFetching: false, error: true });
}

function newQuery(places: Place[]): Query {
  return { places, isFetching: false, error: false };
}

function usePlaces() {
  const value = useObservable(value$, '');
  const query = useObservable(query$, defaultValue);
  return [value, query, { change, focus, click, clear, select }] as const;
}

export default { usePlaces };
