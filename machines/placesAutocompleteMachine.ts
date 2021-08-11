import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { assertEventType } from '../utils';

const placesAutocompleteModel = createModel(
  {
    inputValue: '' as string,
    places: {} as unknown[],
    errorMessage: null as null | string,
  },
  {
    events: {
      CHANGE: (value: string, shouldFetch?: boolean) => ({
        value,
        shouldFetch,
      }),
      RECEIVE_DATA: (data: unknown[]) => ({ data }),
      FETCH_ERROR: (error: string) => ({ error }),
      FETCH: () => ({}),
      CANCEL: () => ({}),
    },
  },
);

/*type AutocompleteContext = ContextFrom<typeof placesAutocompleteModel>;
type AutocompleteEvent = EventFrom<typeof placesAutocompleteModel>;*/

const placesAutocompleteMachine = createMachine(
  {
    initial: 'idle',
    context: placesAutocompleteModel.initialContext,
    states: {
      idle: {
        initial: 'noError',
        states: {
          noError: {
            entry: ['clearErrorMessage'],
          },
          errored: {},
        },
      },
      changing: {
        after: {
          500: [
            {
              target: 'fetching',
              cond: 'shouldFetchOnChange',
            },
            { target: 'idle' },
          ],
        },
      },
      fetching: {
        on: {
          CANCEL: 'idle',
        },
        invoke: {
          src: 'fetchData',
          onDone: {
            target: 'idle',
            actions: 'assignDataToContext',
          },
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
    },
  },
  {
    services: {
      fetchData: () => () => {},
    },
    actions: {
      assignErrorToContext: (_, event: any) => ({
        errorMessage: event.error,
      }),
      assignDataToContext: (_, event) => {
        assertEventType(event, 'RECEIVE_DATA');
        return {
          places: event.data,
        };
      },
      assignValueToInputValue: (_, event) => {
        assertEventType(event, 'CHANGE');
        return {
          inputValue: event.value,
        };
      },
      clearErrorMessage: (_, event: any) => ({
        errorMessage: null,
      }),
    },
    guards: {
      shouldFetchOnChange: (_, event) => {
        assertEventType(event, 'CHANGE');
        return Boolean(event.shouldFetch);
      },
    },
  },
);
export default placesAutocompleteMachine;
