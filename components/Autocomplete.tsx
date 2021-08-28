import {
  Box,
  List as ChakraList,
  ListItem as ChakraListItem,
  ListItemProps as ChakraListItemProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SlideFade,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { ListProps as NativeListProps } from '@chakra-ui/layout/dist/types/list';
import React, { FC } from 'react';
import Input, { InputProps } from './Input';
import useElementWidth from '../hooks/useElementWidth';
import useOnClickOutside, { AnyEvent } from '../hooks/useOnClickOutside';
import { Suggestion } from '../machines/searchBoxMachine';
import { Else, If, Then } from './utils';

interface AutocompleteProps extends Omit<InputProps, 'onSelect'> {
  suggestions?: Suggestion[];
  highlightedId?: number | string;
  onSelect?: (suggestion: Suggestion) => void;
  onClickOutside?: (event: AnyEvent) => void;
  isOpen?: boolean;
  focusOnSelect?: boolean;
}

const Autocomplete: FC<AutocompleteProps> = (props) => {
  const {
    suggestions = [],
    onSelect,
    isOpen = false,
    focusOnSelect = true,
    onClickOutside = () => {},
    highlightedId,
    ...inputProps
  } = props;
  const ref = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref!);

  useOnClickOutside(containerRef, onClickOutside);

  return (
    <VStack w="100%" spacing={0} align="stretch" ref={containerRef}>
      <Popover autoFocus={false} isOpen={isOpen} placement="bottom-start">
        <PopoverTrigger>
          {/*// @ts-ignore*/}
          <Box w="100%" ref={ref}>
            <Input {...inputProps} ref={inputRef} />
          </Box>
        </PopoverTrigger>
        <PopoverContent
          width={width - 2}
          mt="-7px"
          border="0"
          _focus={{
            boxShadow: 'none',
          }}
        >
          <List>
            <If cond={suggestions.length > 0}>
              <Then>
                {suggestions.map((suggestion) => (
                  <ListItem
                    key={suggestion.id}
                    highlight={highlightedId === suggestion.id}
                    onClick={(event) => {
                      onSelect?.(suggestion);
                      if (focusOnSelect) {
                        inputRef?.current?.focus();
                      }
                    }}
                  >
                    {suggestion.label}
                  </ListItem>
                ))}
              </Then>
              <Else if={!inputProps.isInvalid}>
                <ListItem>No results were found!</ListItem>
              </Else>
              <Else if={inputProps.isInvalid}>
                <ListItemErrored>{inputProps.error}</ListItemErrored>
              </Else>
            </If>
          </List>
        </PopoverContent>
      </Popover>
    </VStack>
  );
};

export default Autocomplete;

/********************************
 *
 *
 *
 */

interface ListProps extends NativeListProps {}

const List: React.FC<ListProps> = (props) => {
  const hoverBorderColor = useColorModeValue('#EDF2F7', '#171923');

  return (
    <ChakraList
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: hoverBorderColor,
          borderRadius: '24px',
        },
      }}
      boxShadow="xl"
      rounded="md"
      maxH={500}
      {...props}
    />
  );
};

/****************************************
 *
 *
 *
 */

interface ListItemProps extends ChakraListItemProps {
  highlight?: boolean;
}

const ListItem: React.FC<ListItemProps> = (props) => {
  const { highlight = false, ...othersProps } = props;
  const borderColor = useColorModeValue('white', 'gray.700');
  const hoverColor = useColorModeValue('gray.100', 'gray.900');
  const background = useColorModeValue(highlight ? 'gray.100' : undefined, highlight ? 'gray.900' : undefined);
  const textColor = useColorModeValue(highlight ? 'gray.600' : 'gray.600', 'gray.400');

  return (
    <SlideFade in offsetY="20px">
      <ChakraListItem
        p="3"
        cursor="pointer"
        border="1px"
        borderColor={borderColor}
        background={background}
        _hover={{
          background: hoverColor,
          borderColor: hoverColor,
          rounded: 'md',
        }}
        as={Text}
        fontWeight={highlight ? 'bold' : undefined}
        color={textColor}
        isTruncated
        {...othersProps}
      />
    </SlideFade>
  );
};

const ListItemErrored: React.FC = (props) => {
  const borderColor = useColorModeValue('red.500', 'red.300');
  const background = useColorModeValue('red.100', 'gray.900');
  const textColor = useColorModeValue('red.500', 'red.300');

  return (
    <SlideFade in offsetY="20px">
      <ChakraListItem
        p="3"
        cursor="pointer"
        border="1px"
        borderColor={borderColor}
        background={background}
        as={Text}
        color={textColor}
        borderRadius={6}
        isTruncated
        {...props}
      />
    </SlideFade>
  );
};
