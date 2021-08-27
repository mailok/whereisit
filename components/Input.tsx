import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Button,
  Input as ChakraInput,
  InputGroup,
  InputProps as ChakraInputProps,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';
import { Else, If, Then } from './utils';

export interface InputProps extends ChakraInputProps {
  isLoading?: boolean;
  onClear?: VoidFunction;
}

const Input: React.FC<InputProps> = (props) => {
  const { isLoading, onClear, ...inputProps } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    inputProps.onChange?.(event);
  };
  const [inputHasContent, setInputHasContent] = useState(false);
  useEffect(() => {
    setInputHasContent(Boolean(inputRef?.current?.value));
  });
  const stateColor = inputProps.isInvalid ? 'red.300' : 'gray.400';

  return (
    <InputGroup>
      <ChakraInput
        ref={inputRef}
        variant="filled"
        focusBorderColor={stateColor}
        errorBorderColor="red.300"
        {...inputProps}
        onChange={onChange}
        pr="4rem"
      />
      <InputRightElement width="4rem">
        <If cond={isLoading}>
          <Then>
            <Spinner color="gray.400" />
          </Then>
          <Else if={inputHasContent}>
            <Button
              variant="outline"
              borderColor={stateColor}
              p={1}
              size="xs"
              color={stateColor}
              onClick={() => {
                onClear?.();
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
