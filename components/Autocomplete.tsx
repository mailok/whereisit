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
import React, { FC, Key } from 'react';
import Input, { InputProps } from './Input';
import useElementWidth from '../hooks/useElementWidth';
import useOnClickOutside, { AnyEvent } from '../hooks/useOnClickOutside';

export interface Suggestion {
  key: Key;
  label: string;
  iconSrc?: string;
}

interface AutocompleteProps extends Omit<InputProps, 'onSelect'> {
  suggestions?: Suggestion[];
  highlightedId?: number;
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
            {suggestions.map((suggestion) => (
              <ListItem
                key={suggestion.key}
                highlight={highlightedId === suggestion.key}
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
