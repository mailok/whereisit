import React, { ChangeEvent, forwardRef, useEffect, useRef, useState } from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  Input as ChakraInput,
  InputGroup,
  InputProps as ChakraInputProps,
  InputRightElement,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { Else, If, Then } from './utils';
import { Search2Icon } from '@chakra-ui/icons';

export interface InputProps extends ChakraInputProps {
  isLoading?: boolean;
  onClear?: VoidFunction;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { isLoading, error, onClear, ...inputProps } = props;
  const isInvalid = inputProps.isInvalid;
  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    inputProps.onChange?.(event);
  };
  const [inputHasContent, setInputHasContent] = useState(false);
  useEffect(() => {
    if (ref !== null) {
      setInputHasContent(Boolean((ref as any)?.current?.value));
    } else {
      setInputHasContent(Boolean(inputRef?.current?.value));
    }
  });

  const color = useColorModeValue(isInvalid ? 'red.500' : 'gray.500', isInvalid ? 'red.300' : 'gray.300');
  const focusBorderColor = useColorModeValue(isInvalid ? 'red.400' : 'gray.400', isInvalid ? 'red.300' : 'gray.600');
  const errorBorderColor = useColorModeValue('red.300', 'red.300');

  return (
    <InputGroup>
      <FormControl isInvalid={isInvalid}>
        <ChakraInput
          ref={ref ? ref : inputRef}
          variant={isInvalid ? 'outline' : 'filled'}
          focusBorderColor={focusBorderColor}
          errorBorderColor={errorBorderColor}
          color={color}
          {...inputProps}
          onChange={onChange}
          pr="4rem"
          autocomplete="off"
        />
        {/*<FormErrorMessage>{error}</FormErrorMessage>*/}
      </FormControl>

      <InputRightElement width="4rem">
        <If cond={isLoading}>
          <Then>
            <Spinner color="gray.400" />
          </Then>
          <Else if={inputHasContent}>
            <Button
              variant="outline"
              borderColor={focusBorderColor}
              p={1}
              size="xs"
              color={color}
              onClick={() => {
                onClear?.();
                if (ref !== null) {
                  (ref as any)?.current?.focus();
                } else {
                  inputRef.current?.focus();
                }
              }}
            >
              CLEAR
            </Button>
          </Else>
          <Else if={!inputHasContent}>
            <Search2Icon color="gray.400" />
          </Else>
        </If>
      </InputRightElement>
    </InputGroup>
  );
});

Input.displayName = 'Input';
export default Input;
