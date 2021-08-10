import { createMachine } from 'xstate';

const inputValueMachine = createMachine(
  {
    initial: 'without_value',
    states: {
      without_value: {},
      with_value: {},
    },
    on: {
      CHANGE: [{ target: 'with_value', cond: 'hasSomeContent' }, { target: 'without_value' }],
    },
  },
  {
    guards: {
      hasSomeContent: (_, event) => {
        // debugger;
        return Boolean(event.value);
      },
    },
  },
);
export default inputValueMachine;
