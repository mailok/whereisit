import React, { ChangeEvent, useRef } from 'react';
import {
  Button,
  InputGroup,
  InputRightElement,
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Spinner,
} from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import inputValueMachine from '../machines/inputValueMachine';
import { Else, If, Then } from './utils';

export interface InputProps extends ChakraInputProps {
  isLoading?: boolean;
  onClear?: VoidFunction;
}

const Input: React.FC<InputProps> = (props) => {
  const { isLoading, onClear, ...inputProps } = props;
  const [state, send] = useMachine(inputValueMachine);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    send('CHANGE', { value: event.target.value });
    inputProps.onChange?.(event);
  };

  return (
    <InputGroup>
      <ChakraInput ref={inputRef} variant="filled" {...inputProps} onChange={onChange} />
      <InputRightElement width="60px">
        <If cond={isLoading}>
          <Then>
            <Spinner color="gray.400" />
          </Then>
          <Else if={state.matches('with_value')}>
            <Button
              variant="outline"
              borderColor="gray.400"
              p={1}
              size="xs"
              color="gray.400"
              onClick={() => {
                onClear?.();
                if (onClear) {
                  send('CHANGE', { value: '' });
                }
                inputRef.current?.focus();
              }}
            >
              CLEAR
            </Button>
          </Else>
        </If>
      </InputRightElement>
    </InputGroup>
  );
};

export default Input;
