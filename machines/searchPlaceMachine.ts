import { assign, ContextFrom, EventFrom } from 'xstate';
import { inspect } from '@xstate/inspect';
import { createModel } from 'xstate/lib/model';

/*if (typeof window !== 'undefined') {
  inspect({
    // options
    url: 'https://stately.ai/viz?inspect',
    iframe: false, // open in new window
  });
}*/

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

export interface Config {
  focusOnSelect?: boolean;
}

export const searchPlaceModel = createModel(
  {
    query: '',
    places: [] as Place[],
    errorMessage: '' as null | string,
    selected: null as Place | null,
    config: {
      focusOnSelect: false,
    } as Config,
  },
  {
    events: {
      FOCUS: () => ({}),
      BLUR: () => ({}),
      CLEAR: () => ({}),
      ENABLE: () => ({}),
      DISABLE: () => ({}),
      CLICK: () => ({}),
      SELECT: (id: string | number) => ({ id }),
      CHANGE: (value: string) => ({ value }),
      CHANGE_CONFIG: (config: Partial<Config>) => ({ config }),
      'done.invoke.fetchPlaces': (data: Place[]) => ({ data }),
    },
  },
);

type Context = ContextFrom<typeof searchPlaceModel>;
type Event = EventFrom<typeof searchPlaceModel>;

export type { Context as SearchPlaceMachineContext };
export type { Event as SearchPlaceEvent };

const searchPlaceMachine = searchPlaceModel.createMachine(
  {
    type: 'parallel',
    context: {
      query: '',
      places: [],
      errorMessage: '',
      selected: null,
      config: {
        focusOnSelect: false,
      },
    },
    states: {
      status: {
        initial: 'enabled',
        states: {
          enabled: {
            initial: 'unfocused',
            tags: ['isEnabled'],
            states: {
              unfocused: {
                id: 'unfocused',
                initial: 'idle',
                tags: ['isUnfocused'],
                states: {
                  idle: {},
                  errored: {
                    tags: ['isErrored'],
                  },
                },
                on: {
                  FOCUS: [
                    { target: 'focused.errored', cond: 'hasAnyErrorReported' },
                    { target: 'focused.waitingSelection', cond: 'hasAnySuggestionToShow' },
                    { target: 'focused.fetching', cond: 'hasAnyQueryForFetch' },
                    { target: 'focused.idle' },
                  ],
                },
              },
              focused: {
                initial: 'idle',
                tags: ['isFocused'],
                states: {
                  idle: {},
                  fetching: {
                    tags: ['isFetching'],
                    invoke: {
                      src: 'fetchPlaces',
                      onDone: [
                        {
                          cond: 'hasResponseAnySuggestionToShow',
                          target: 'waitingSelection',
                          actions: ['assignResponseToSuggestions'],
                        },
                        { target: 'showingEmptyResult' },
                      ],
                      onError: {
                        target: 'errored',
                        actions: 'assignReasonToErrorMessage',
                      },
                    },
                  },
                  /*evaluatingChanges: {
                    tags: ['isChanging'],
                    entry: ['assignChangeToQuery', 'clearSelection', 'clearSuggestions', 'clearErrorMessage'],
                    always: [
                      { target: ['waitingForMoreChanges', '#value.dirty'], cond: 'hasAnyQueryForFetch' },
                      { target: ['idle', '#value.empty'] },
                    ],
                  },
                  waitingForMoreChanges: {
                    after: { 500: 'fetching' },
                  },*/
                  evaluatingChanges: {
                    tags: ['isChanging'],
                    entry: ['assignChangeToQuery', 'clearSelection', 'clearSuggestions', 'clearErrorMessage'],
                    after: {
                      500: [{ target: 'fetching', cond: 'hasAnyQueryForFetch' }, { target: 'idle' }],
                    },
                  },
                  errored: {
                    tags: ['isErrored', 'isOpened'],
                  },
                  waitingSelection: {
                    tags: ['isWaitingForSelection', 'isOpened'],
                    on: {
                      SELECT: [
                        {
                          cond: 'shouldFocusOnSelect',
                          target: 'suggestionSelected',
                          actions: ['assignSelectionToSelected', 'clearErrorMessage', 'focus'],
                        },
                        { target: '#unfocused.idle', actions: ['assignSelectionToSelected', 'clearErrorMessage'] },
                      ],
                    },
                  },
                  suggestionSelected: {
                    tags: ['isAnySuggestionSelected'],
                    on: {
                      CLICK: 'waitingSelection',
                    },
                  },
                  showingEmptyResult: {
                    tags: ['hasEmptyResult', 'isOpened'],
                  },
                },
                on: {
                  CHANGE: 'focused.evaluatingChanges',
                  BLUR: [{ target: 'unfocused.errored', cond: 'hasAnyErrorReported' }, { target: 'unfocused.idle' }],
                },
              },
            },
            on: {
              CLEAR: {
                target: '.focused.idle',
                actions: ['clearQueryValue', 'clearSuggestions', 'clearErrorMessage', 'clearSelection', 'focus'],
              },
            },
          },
          disabled: {
            tags: ['isDisabled'],
          },
        },
        on: {
          DISABLE: '.disabled',
          ENABLE: '.enabled',
          CHANGE_CONFIG: { actions: ['assignConfigToContext'] },
        },
      },
      value: {
        id: 'value',
        initial: 'empty',
        states: {
          empty: {
            tags: ['isEmpty'],
          },
          dirty: {
            tags: ['isDirty'],
          },
        },
        on: {
          '*': [{ target: '.dirty', cond: 'hasQueryAnyValue' }, { target: '.empty' }],
        },
      },
    },
  },
  {
    guards: {
      hasAnySuggestionToShow: (context, event) => {
        return context.places.length > 0;
      },
      hasResponseAnySuggestionToShow: (context, event) => {
        if (event.type !== 'done.invoke.fetchPlaces') return false;
        return event.data.length > 0;
      },
      hasAnyQueryForFetch: (context, event) => {
        return Boolean(context.query);
      },
      hasAnyErrorReported: (context, event) => {
        return Boolean(context.errorMessage);
      },
      shouldFocusOnSelect: (context, event) => {
        return Boolean(context.config.focusOnSelect);
      },
      hasQueryAnyValue: (context, event) => {
        return Boolean(context.query);
      },
    },
    actions: {
      assignReasonToErrorMessage: assign<Context, any>((context, event) => {
        return {
          // TODO: EL manejo de errores es al final
          errorMessage: 'Failed to fetch places',
        };
      }),
      assignResponseToSuggestions: assign<Context, Event>((context, event) => {
        if (event.type !== 'done.invoke.fetchPlaces') return {};
        return {
          places: event.data,
        };
      }),
      assignChangeToQuery: assign<Context, Event>((context, event) => {
        if (event.type !== 'CHANGE') return {};
        return { query: event.value };
      }),
      assignSelectionToSelected: assign<Context, Event>((context, event) => {
        if (event.type !== 'SELECT') return {};
        const place = context.places.find((place) => place.place_id === event.id);
        if (place) {
          return { query: place.display_name, selected: place };
        } else
          return {
            query: '',
            selected: null,
          };
      }),
      assignConfigToContext: assign<Context, Event>((context, event) => {
        if (event.type !== 'CHANGE_CONFIG') return {};
        return {
          config: { ...context.config, ...event.config },
        };
      }),
      clearSelection: assign<Context, Event>((context, event) => {
        return {
          selected: null,
        };
      }),
      clearErrorMessage: assign<Context, Event>((context, event) => {
        return {
          errorMessage: null,
        };
      }),
      clearQueryValue: assign<Context, Event>((context, event) => {
        if (event.type !== 'CLEAR') return {};
        return {
          query: '',
        };
      }),
      clearSuggestions: assign<Context, Event>(() => {
        return {
          places: [],
        };
      }),
    },
    services: {
      fetchPlaces: (context) => {
        if (Boolean(context.query)) {
          return fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${context.query.replaceAll(' ', '+')}`,
          ).then((response) => response.json());
        } else {
          return Promise.resolve([]);
        }
      },
    },
  },
);

export default searchPlaceMachine;
