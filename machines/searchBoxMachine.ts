import { assign, createMachine } from 'xstate';

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
    initial: 'enabled',
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
      enabled: {
        initial: 'unfocused',
        states: {
          unfocused: {
            id: 'unfocused',
            initial: 'idle',
            states: {
              idle: {},
              errored: {},
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
            states: {
              idle: {},
              fetching: {
                entry: ['clearErrorMessage', 'clearSuggestions'],
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
              changing: {
                entry: ['assignChangeToQuery', 'clearSelection'],
                after: {
                  500: [
                    { target: 'fetching', cond: 'hasAnyQueryForFetch' },
                    { target: 'idle', actions: 'clearErrorMessage' },
                  ],
                },
              },
              errored: {},
              waitingSelection: {
                on: {
                  SELECT: [
                    {
                      cond: 'shouldFocusOnSelect',
                      target: 'suggestionSelected',
                      actions: ['assignSelectionToSelected', 'clearErrorMessage'],
                    },
                    { target: '#unfocused.idle', actions: ['assignSelectionToSelected', 'clearErrorMessage'] },
                  ],
                },
              },
              suggestionSelected: {
                on: {
                  CLICK: 'waitingSelection',
                },
              },
              showingEmptyResult: {},
            },
            on: {
              CHANGE: 'focused.changing',
              BLUR: [{ target: 'unfocused.errored', cond: 'hasAnyErrorReported' }, { target: 'unfocused.idle' }],
            },
          },
        },
      },
      disabled: {},
    },
    on: {
      CLEAR: {
        target: 'enabled.focused.idle',
        actions: ['clearQueryValue', 'clearSuggestions', 'clearErrorMessage', 'clearSelection'],
      },
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
    },
  },
);

export default searchBoxMachine;
