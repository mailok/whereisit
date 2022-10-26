import { Event, ExtractEvent, Place, Query } from './types';
import { catchError, filter, map, of, pipe, startWith, switchMap } from 'rxjs';
import { select } from '../utils';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';

export function createQuery(initialValue?: Partial<Query>): Query {
  return {
    isFetching: false,
    places: [],
    error: null,
    ...initialValue,
  };
}

function fromPlaceToQuery(places: Place[]) {
  return { places, isFetching: false, error: null };
}

function handleError(error: any) {
  return of({ places: [], isFetching: false, error: 'Ups! Something has gone wrong, please try again.' });
}

const FETCH_OPTIONS = {
  selector: (response: Response) => response.json(),
};

export function filterByEvent<T extends Event['type']>(eventType: T) {
  return pipe(filter((event: Event): event is ExtractEvent<T> => event.type === eventType));
}

export function selectPayload<T extends { payload: unknown }>() {
  return pipe(select<T, 'payload'>('payload'));
}

export function replaceCharacter(searchValue: string | RegExp, replaceValue: string) {
  return pipe(map((term: string) => (term || '').replaceAll(searchValue, replaceValue)));
}

export function fetchPlaces() {
  return pipe(
    switchMap((query: string) => {
      if (!query.trim()) return of(createQuery());

      return fromFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, FETCH_OPTIONS).pipe(
        map(fromPlaceToQuery),
        startWith(createQuery({ isFetching: true })),
        catchError(handleError),
      );
    }),
  );
}

export function mapPlaceById() {
  return pipe(
    map(([id, query]) => query.places.find((place: Place) => place.place_id === id)),
    filter<Place>((foundPlace) => Boolean(foundPlace)),
  );
}
