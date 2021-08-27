import { assign, createMachine } from 'xstate';

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

interface Context {
  inputValue: string;
  places: Place[];
  errorMessage: null | string;
}

type Event =
  | { type: 'CLEAR' }
  | { type: 'FOCUS' }
  | { type: 'CLOSE_SUGGESTIONS_LIST' }
  | { type: 'CHANGE'; value: string }
  | { type: 'SELECT_VALUE'; value: string }
  | { type: 'done.invoke.fetchSuggestions'; data: Place[] };

function fetchPlaces(query: string): Promise<Place[]> {
  return Boolean(query)
    ? fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query.replaceAll(' ', '+')}`).then((response) =>
        response.json(),
      )
    : Promise.resolve([]);
}

const placesAutocompleteMachine = createMachine<Context, Event>(
  {
    initial: 'idle',
    context: {
      inputValue: '',
      places: [],
      errorMessage: '',
    },
    states: {
      idle: {},
      changing: {
        entry: ['assignValueToInputValue'],
        after: {
          500: 'fetching',
        },
      },
      fetching: {
        entry: ['clearErrorMessage', 'clearPlaces'],
        invoke: {
          src: 'fetchSuggestions',
          onDone: [
            { target: 'showingSuggestionList', actions: ['assignDataToContext'], cond: 'responseHasPlaceToShow' },
            { target: 'showingEmptyResult' },
          ],
          onError: {
            target: 'showingErrorMessage',
            actions: 'assignErrorToContext',
          },
        },
      },
      showingSuggestionList: {},
      showingEmptyResult: {},
      showingErrorMessage: {},
    },
    on: {
      CHANGE: 'changing',
      CLEAR: {
        target: 'idle',
        actions: ['clearInputValue', 'clearPlaces', 'clearErrorMessage'],
      },
      CLOSE_SUGGESTIONS_LIST: [{ target: 'showingErrorMessage', cond: 'isAnyErrorReported' }, { target: 'idle' }],
      FOCUS: [
        { target: 'showingErrorMessage', cond: 'isAnyErrorReported' },
        { target: 'showingSuggestionList', cond: 'isAnyPlaceToShow' },
        { target: 'fetching', cond: 'isInputDirty' },
        { target: 'idle' },
      ],
      SELECT_VALUE: {
        target: 'idle',
        actions: ['assignValueToInputValue', 'clearErrorMessage'],
      },
    },
  },
  {
    services: {
      fetchSuggestions: (context) => fetchPlaces(context.inputValue),
    },
    actions: {
      // TODO: quitar el any
      assignErrorToContext: assign<Context, any>((context, event) => {
        return {
          errorMessage: 'Failed to fetch places',
        };
      }),
      assignDataToContext: assign<Context, Event>((context, event) => {
        if (event.type !== 'done.invoke.fetchSuggestions') return {};
        return {
          places: event.data,
        };
      }),
      assignValueToInputValue: assign<Context, Event>((context, event) => {
        if (event.type === 'CHANGE' || event.type === 'SELECT_VALUE') return { inputValue: event.value };
        return {};
      }),
      clearErrorMessage: assign<Context, Event>((context, event) => {
        return {
          errorMessage: null,
        };
      }),
      clearInputValue: assign<Context, Event>((context, event) => {
        if (event.type !== 'CLEAR') return {};
        return {
          inputValue: '',
        };
      }),
      clearPlaces: assign<Context, Event>(() => {
        return {
          places: [],
        };
      }),
    },
    guards: {
      isAnyPlaceToShow: (context, event) => {
        return context.places.length > 0;
      },
      responseHasPlaceToShow: (context, event) => {
        if (event.type !== 'done.invoke.fetchSuggestions') return false;
        return event.data.length > 0;
      },
      isInputDirty: (context, event) => {
        return Boolean(context.inputValue);
      },
      isAnyErrorReported: (context, event) => {
        return Boolean(context.errorMessage);
      },
    },
  },
);
export default placesAutocompleteMachine;
export type { Context as AutocompleteMachineContext, Event as AutocompleteMachineEvent };
