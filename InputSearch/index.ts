import {
  debounceTime as waitAfterChanges,
  distinctUntilChanged,
  filter,
  map,
  merge,
  pairwise,
  share,
  startWith,
  Subject,
  withLatestFrom,
} from 'rxjs';
import { mapTo, select } from '../utils';
import { Event, Query } from './types';
import {
  createQuery,
  fetchPlaces,
  filterByEvent,
  mapPlaceById,
  replaceCharacter,
  selectPayload,
} from './custom-operators';

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

const responses = queries.pipe(fetchPlaces(), startWith(createQuery()), share());

// ========================================= STATE OPERATORS ===========================================
const loads = responses.pipe(select('isFetching'));

const selectedPlaces = merge(selections.pipe(withLatestFrom(responses), mapPlaceById()), changes.pipe(mapTo(null)));

const values = merge(changes, selectedPlaces.pipe(filter(truthyValues), select('display_name')));

const places = responses.pipe(select('places'), distinctUntilChanged());
const errors = merge(values.pipe(mapTo(null)), responses.pipe(select('error')).pipe(distinctUntilChanged()));

const focus = merge(merge(values, focuses).pipe(mapTo(true)), blurs.pipe(mapTo(false))).pipe(
  filter(truthyValues),
  distinctUntilChanged(),
);

const showingResults = merge(
  clicks.pipe(withLatestFrom(responses), map(somethingToShow)),
  responses.pipe(pairwise(), filter(doneRequests), mapTo(true)),
  merge(blurs, values).pipe(mapTo(false)),
).pipe(startWith(false), distinctUntilChanged());
// ====================================================================================

function doneRequests([oldQuery, newQuery]: [Query, Query]) {
  return oldQuery.isFetching && !newQuery.isFetching;
}

function somethingToShow([_, query]: [any, Query]) {
  return Boolean(query.places.length) || Boolean(query.error);
}

function truthyValues(value: any) {
  return Boolean(value);
}

function falsyValues(value: boolean) {
  return !value;
}

export default { values, places, errors, showingResults, loads, selectedPlaces, focus, fireEvent };
