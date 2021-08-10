import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';

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
      RECEIVE_DATA: () => ({}),
      FETCH: () => ({}),
      CANCEL: () => ({}),
    },
  },
);

const placesAutocompleteMachine = createMachine(
  {
    initial: 'idle',
    context: placesAutocompleteModel.initialContext,
    states: {
      idle: {
        on: {
          FETCH: 'fetching',
          CHANGE: {},
        },
        initial: 'noError',
        states: {
          noError: {
            entry: ['clearErrorMessage'],
          },
          errored: {},
        },
      },
      fetching: {
        on: {
          FETCH: 'fetching',
          CANCEL: 'idle',
          RECEIVE_DATA: {
            target: 'idle',
            actions: 'assignDataToContext',
          },
          CHANGE: {},
        },
        invoke: {
          src: 'fetchData',
          onError: {
            target: 'idle.errored',
            actions: 'assignErrorToContext',
          },
        },
      },
    },
  },
  {
    services: {
      fetchData: () => () => {},
    },
    actions: {
      assignDataToContext: placesAutocompleteModel.assign({
        places: (_, event: any) => event.data,
      }),
      assignErrorToContext: placesAutocompleteModel.assign({
        errorMessage: (_, event: any) => event.data?.message || 'An unknown error occurred',
      }),
      clearErrorMessage: placesAutocompleteModel.assign({
        errorMessage: () => null,
      }),
    },
    guards: {
      /*hasSomeContent: (_, event) => {
        // debugger;
        return Boolean(event.value);
      },*/
    },
  },
);
export default placesAutocompleteMachine;
