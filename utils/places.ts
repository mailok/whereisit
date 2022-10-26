import {
  catchError,
  debounceTime as waitAfterChanges,
  distinctUntilChanged,
  filter,
  interval,
  map,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  of,
  pairwise,
  pipe,
  share,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
  UnaryFunction,
  pluck,
  withLatestFrom,
  iif,
} from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';
import { debug, mapTo, selectProperty, useObservable } from './index';
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

type Event =
  | { type: 'change'; payload: string }
  | { type: 'focus' }
  | { type: 'click' }
  | { type: 'blur' }
  | { type: 'clear' }
  | { type: 'select'; payload: Place['place_id'] };

type ExtractEvent<T extends Event['type']> = Extract<Event, { type: T }>;

export const Status = {
  idle: 'idle',
  noContentFound: 'no_content_found',
  contentFound: 'content_found',
  loading: 'loading',
} as const;

const LOADING: Query = {
  isFetching: true,
  places: [],
  error: null,
};

const defaultResponse: Query = {
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
const events = new Subject<Event>();

const changes = events.pipe(filterByEvent('change'), selectPayload());
const selections = events.pipe(filterByEvent('select'), selectPayload());
const focuses = events.pipe(filterByEvent('focus'));
const blurs = events.pipe(filterByEvent('blur'));
const clicks = events.pipe(filterByEvent('click'));

function fireEvent(event: Event) {
  events.next(event);
}
// ========================================= INTERMEDIATE OBSERVABLES ===========================================

const queries = changes.pipe(waitAfterChanges(500), replaceCharacter(' ', '+'), share());

const responses = queries.pipe(fetchPlaces(), startWith(defaultResponse), share());

const loads = responses.pipe(selectProperty('isFetching'), filter(truthyValues));

const selectedPlaces = selections.pipe(withLatestFrom(responses), mapPlaceById(), selectProperty('display_name'));

const results = responses.pipe(pairwise(), filter(doneRequests), map(isResponseEmpty), share());

// ========================================= STATE OPERATORS ===========================================
const values = merge(changes, selectedPlaces);

const places = responses.pipe(selectProperty('places'), distinctUntilChanged());
const errors = responses.pipe(selectProperty('error'), distinctUntilChanged());

const statuses = merge(
  values.pipe(mapTo(Status.idle)),
  loads.pipe(mapTo(Status.loading)),
  results.pipe(filter(truthyValues), mapTo(Status.noContentFound)),
  results.pipe(filter(falsyValues), mapTo(Status.contentFound)),
).pipe(distinctUntilChanged());

const onFocus = merge(merge(values, focuses).pipe(mapTo(true)), blurs.pipe(mapTo(false))).pipe(
  filter(truthyValues),
  distinctUntilChanged(),
);

// ========================================= CUSTOM OPERATORS ===========================================

function filterByEvent<T extends Event['type']>(eventType: T) {
  return pipe(filter((event: Event): event is ExtractEvent<T> => event.type === eventType));
}

function selectPayload<T extends { payload: unknown }>() {
  return pipe(selectProperty<T, 'payload'>('payload'));
}

function replaceCharacter(searchValue: string | RegExp, replaceValue: string) {
  return pipe(map((term: string) => (term || '').replaceAll(searchValue, replaceValue)));
}

function fetchPlaces() {
  return pipe(
    switchMap((query: string) => {
      if (!query.trim()) return of(defaultResponse);

      return fromFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, FETCH_OPTIONS).pipe(
        map(TO_QUERY),
        startWith(LOADING),
        catchError(TO_ERROR),
      );
    }),
  );
}

function mapPlaceById() {
  return pipe(
    map(([id, query]) => query.places.find((place: Place) => place.place_id === id)),
    filter<Place>((foundPlace) => Boolean(foundPlace)),
  );
}

function doneRequests([oldQuery, newQuery]: [Query, Query]) {
  return oldQuery.isFetching && !newQuery.isFetching;
}

function isResponseEmpty([_, lastResponse]: [Query, Query]) {
  return !Boolean(lastResponse.places.length);
}

function truthyValues(value: boolean) {
  return value;
}

function falsyValues(value: boolean) {
  return !value;
}

function change(event: React.ChangeEvent<HTMLInputElement>) {
  fireEvent({ type: 'change', payload: event.target.value });
}

function focus(event?: React.FocusEvent<HTMLInputElement>) {
  fireEvent({ type: 'focus' });
}

function click(event: React.MouseEvent<HTMLInputElement>) {
  fireEvent({ type: 'click' });
}

function blur() {
  fireEvent({ type: 'blur' });
}

function clear() {
  fireEvent({ type: 'change', payload: '' });
}

function select(placeId: Place['place_id']) {
  fireEvent({ type: 'select', payload: placeId });
}

function usePlaces(props: { onFocus: Function | undefined }) {
  const value = useObservable(values, '');
  const data = useObservable(places, []);
  const status = useObservable(statuses, 'idle');
  const error = useObservable(errors, null);

  // @ts-ignore
  useObservable(onFocus.pipe(tap(props.onFocus)), false);

  return { value, places: data, status, error, Event: { change, focus, click, blur, clear, select } };
}

export default { usePlaces };
