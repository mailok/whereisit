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
        entry: ['assignValueToInputValue', 'clearErrorMessage', 'clearPlaces'],
        after: {
          500: 'fetching',
        },
      },
      fetching: {
        invoke: {
          src: 'fetchSuggestions',
          onDone: [
            { target: 'showingSuggestionList', actions: ['assignDataToContext'], cond: 'ifResponseHaveAnyPlace' },
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
      CLOSE_SUGGESTIONS_LIST: 'idle',
      FOCUS: [
        { target: 'fetching', cond: 'ifHaveInputValueAndNoPlace' },
        { target: 'showingSuggestionList', cond: 'ifContextHaveAnyPlace' },
        { target: 'idle' },
      ],
      SELECT_VALUE: {
        target: 'idle',
        actions: ['assignValueToInputValue', 'clearPlaces', 'clearErrorMessage'],
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
          errorMessage: event.error,
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
      ifDontHaveErrors: (context) => {
        return !Boolean(context.errorMessage);
      },
      ifContextHaveAnyPlace: (context, event) => {
        return context.places.length > 0;
      },
      ifResponseHaveAnyPlace: (context, event) => {
        if (event.type !== 'done.invoke.fetchSuggestions') return false;
        return event.data.length > 0;
      },
      ifHaveInputValueAndNoPlace: (context, event) => {
        return Boolean(context.inputValue && !context.places.length);
      },
    },
  },
);
export default placesAutocompleteMachine;
export type { Context as AutocompleteMachineContext, Event as AutocompleteMachineEvent };
