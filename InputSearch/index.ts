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

export const Status = {
  idle: 'idle',
  noContentFound: 'no_content_found',
  contentFound: 'content_found',
  loading: 'loading',
} as const;

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

const loads = responses.pipe(select('isFetching'), filter(truthyValues));

const results = responses.pipe(pairwise(), filter(doneRequests), map(isResponseEmpty), share());

// ========================================= STATE OPERATORS ===========================================
const selectedPlaces = selections.pipe(withLatestFrom(responses), mapPlaceById(), select('display_name'));

const values = merge(changes, selectedPlaces);

const places = responses.pipe(select('places'), distinctUntilChanged());
const errors = merge(values.pipe(mapTo(null)), responses.pipe(select('error')).pipe(distinctUntilChanged()));

const statuses = merge(
  values.pipe(mapTo(Status.idle)),
  loads.pipe(mapTo(Status.loading)),
  results.pipe(filter(truthyValues), mapTo(Status.noContentFound)),
  results.pipe(filter(falsyValues), mapTo(Status.contentFound)),
).pipe(distinctUntilChanged());

const focus = merge(merge(values, focuses).pipe(mapTo(true)), blurs.pipe(mapTo(false))).pipe(
  filter(truthyValues),
  distinctUntilChanged(),
);

// ====================================================================================

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

export default { values, places, errors, statuses, selectedPlaces, focus, fireEvent };
