import React from 'react';
import {
  FormControl,
  Input as ChakraInput,
  InputGroup,
  InputProps as ChakraInputProps,
  InputRightElement,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { Else, If, Then } from './utils';

export interface InputProps extends ChakraInputProps {
  isLoading?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { isLoading, error, rightElement, ...inputProps } = props;
  const isInvalid = inputProps.isInvalid;

  const { color, focusBorderColor } = useInputFocusBorderColor(isInvalid);
  const errorBorderColor = useColorModeValue('red.300', 'red.300');

  return (
    <InputGroup>
      <FormControl isInvalid={isInvalid}>
        <ChakraInput
          ref={ref}
          variant={isInvalid ? 'outline' : 'filled'}
          focusBorderColor={focusBorderColor}
          errorBorderColor={errorBorderColor}
          color={color}
          {...inputProps}
          pr="4rem"
          autoComplete="off"
        />
        {/*<FormErrorMessage>{error}</FormErrorMessage>*/}
      </FormControl>

      <InputRightElement width="4rem">
        <If cond={isLoading}>
          <Then>
            <Spinner color="gray.400" />
          </Then>
          <Else>{rightElement}</Else>
        </If>
      </InputRightElement>
    </InputGroup>
  );
});

Input.displayName = 'Input';

export default Input;

export const useInputFocusBorderColor = (isInvalid?: boolean) => {
  const color = useColorModeValue(isInvalid ? 'red.500' : 'gray.500', isInvalid ? 'red.300' : 'gray.300');
  const focusBorderColor = useColorModeValue(isInvalid ? 'red.400' : 'gray.400', isInvalid ? 'red.300' : 'gray.600');
  return {
    color,
    focusBorderColor,
  };
};
