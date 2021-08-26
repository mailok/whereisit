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
  isOpen: boolean;
}

type Event =
  | { type: 'FETCH' }
  | { type: 'CLEAR' }
  | { type: 'CANCEL' }
  | { type: 'CHANGE'; value: string }
  | { type: 'FETCH_ERROR'; error: string }
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
      isOpen: false,
    },
    states: {
      idle: {
        initial: 'noError',
        entry: ['computeIsOpenValue'],
        states: {
          noError: {
            entry: ['clearErrorMessage'],
          },
          errored: {},
        },
      },
      changing: {
        entry: ['clearErrorMessage'],
        after: {
          500: 'fetching',
        },
      },
      fetching: {
        entry: ['closeSuggestionsList'],
        invoke: {
          src: 'fetchSuggestions',
          onDone: { target: 'idle.noError', actions: 'assignDataToContext' },
          onError: {
            target: 'idle.errored',
            actions: 'assignErrorToContext',
          },
        },
      },
    },
    on: {
      CHANGE: {
        target: 'changing',
        actions: ['assignValueToInputValue', 'clearErrorMessage'],
      },
      CLEAR: {
        target: 'idle.noError',
        actions: ['clearInputValue', 'clearPlaces', 'clearErrorMessage', 'computeIsOpenValue'],
      },
    },
  },
  {
    services: {
      fetchSuggestions: (context) => fetchPlaces(context.inputValue),
    },
    actions: {
      assignErrorToContext: assign<Context, Event>((context, event) => {
        if (event.type !== 'FETCH_ERROR') return {};
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
      computeIsOpenValue: assign<Context, Event>((context) => {
        return {
          isOpen: context.places.length > 0,
        };
      }),
      closeSuggestionsList: assign<Context, Event>(() => {
        return {
          isOpen: false,
        };
      }),
      assignValueToInputValue: assign<Context, Event>((context, event) => {
        if (event.type !== 'CHANGE') return {};
        return {
          inputValue: event.value,
        };
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
    guards: {},
  },
);
export default placesAutocompleteMachine;
export type { Context as AutocompleteMachineContext, Event as AutocompleteMachineEvent };
