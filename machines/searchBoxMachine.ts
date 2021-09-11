import { assign, createMachine } from 'xstate';
import { inspect } from '@xstate/inspect';

if (typeof window !== 'undefined') {
  inspect({
    // options
    url: 'https://stately.ai/viz?inspect',
    iframe: false, // open in new window
  });
}

export interface Suggestion {
  id: number | string;
  label: string;
}

export interface Config {
  focusOnSelect?: boolean;
}

interface Context {
  query: string;
  suggestions: Suggestion[];
  selected: Suggestion | null;
  errorMessage: null | string;
  config: Config;
}

type Event =
  | { type: 'FOCUS' }
  | { type: 'BLUR' }
  | { type: 'CLEAR' }
  | { type: 'ENABLE' }
  | { type: 'DISABLE' }
  | { type: 'CLICK' }
  | { type: 'SELECT'; id: string | number }
  | { type: 'CHANGE'; value: string }
  | { type: 'CHANGE_CONFIG'; config: Partial<Config> }
  | { type: 'done.invoke.fetchSuggestions'; data: Suggestion[] };

const searchBoxMachine = createMachine<Context, Event>(
  {
    type: 'parallel',
    context: {
      query: '',
      suggestions: [],
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
                      src: 'fetchSuggestions',
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
    on: {
      DISABLE: 'status.disabled',
      ENABLE: 'status.enabled',
      CHANGE_CONFIG: { actions: ['assignConfigToContext'] },
    },
  },
  {
    actions: {
      assignReasonToErrorMessage: assign<Context, any>((context, event) => {
        return {
          // TODO: EL manejo de errores es al final
          errorMessage: 'Failed to fetch places',
        };
      }),
      assignResponseToSuggestions: assign<Context, Event>((context, event) => {
        if (event.type !== 'done.invoke.fetchSuggestions') return {};
        return {
          suggestions: event.data,
        };
      }),
      assignChangeToQuery: assign<Context, Event>((context, event) => {
        if (event.type !== 'CHANGE') return {};
        return { query: event.value };
      }),
      assignSelectionToSelected: assign<Context, Event>((context, event) => {
        if (event.type !== 'SELECT') return {};
        const suggestion = context.suggestions.find((suggestion) => suggestion.id === event.id);
        if (suggestion) {
          return { query: suggestion.label, selected: suggestion };
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
          suggestions: [],
        };
      }),
    },
    guards: {
      hasAnySuggestionToShow: (context, event) => {
        return context.suggestions.length > 0;
      },
      hasResponseAnySuggestionToShow: (context, event) => {
        if (event.type !== 'done.invoke.fetchSuggestions') return false;
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
  },
);

export default searchBoxMachine;
