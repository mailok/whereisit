import { assign, createMachine } from 'xstate';
import { Ref } from 'react';

interface Context {
  input: HTMLInputElement | null;
}

type Event = { type: 'FOCUS' } | { type: 'REPORT_INPUT_DIRTY' };

const createInputMachine = (input: Context['input']) =>
  createMachine<Context, Event>(
    {
      context: {
        input,
      },
      initial: 'pristine',
      states: {
        pristine: {
          invoke: {
            src: 'checkForInputDirty',
          },
          on: {
            REPORT_INPUT_DIRTY: 'dirty',
          },
        },
        dirty: {},
      },
      on: {
        FOCUS: [],
      },
    },
    {
      services: {
        checkForInputDirty: (context) => (send) => {
          debugger;
          const listener = (event: any) => {
            if (Boolean(event.target.value)) {
              send('REPORT_INPUT_DIRTY');
              console.log('reporting dirty...');
            } else {
              console.log('nada que hacer');
            }
          };
          context.input?.addEventListener('change', listener);

          return () => {
            context.input?.removeEventListener('change', listener);
          };
        },
      },
    },
  );

export default createInputMachine;
