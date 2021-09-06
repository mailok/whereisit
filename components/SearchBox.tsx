import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import searchBoxMachine, { Suggestion } from '../machines/searchBoxMachine';
import {
  Badge,
  Button,
  List as ChakraList,
  ListItem as ChakraListItem,
  ListItemProps as ChakraListItemProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SlideFade,
  Text,
  useColorModeValue,
  useOutsideClick,
  VStack,
} from '@chakra-ui/react';
import { ListProps as NativeListProps } from '@chakra-ui/layout/dist/types/list';
import { Else, If, Then } from './utils';
import Input from './Input';
import { Search2Icon } from '@chakra-ui/icons';

interface SearchBoxProps {
  fetchHandler: (query: string) => Promise<any>;
  mapResultToSuggestion: (value: any) => Suggestion;
  focusOnSelect?: boolean;
  isDisabled?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = (props) => {
  const [state, send] = useMachine(searchBoxMachine, {
    devTools: true,
    services: {
      fetchSuggestions: (context) =>
        props.fetchHandler(context.query).then((response) => response.map(props.mapResultToSuggestion)),
    },
    actions: {
      focus: () => {
        inputRef.current?.focus();
      },
    },
  });

  useEffect(() => {
    send({ type: 'CHANGE_CONFIG', config: { focusOnSelect: props.focusOnSelect } });
  }, [props.focusOnSelect]);

  useEffect(() => {
    send({ type: props.isDisabled ? 'DISABLE' : 'ENABLE' });
  }, [props.isDisabled]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useOutsideClick({
    ref: containerRef,
    handler: () => send({ type: 'BLUR' }),
  });

  const colorSchema = state.hasTag('isChanging')
    ? 'orange'
    : state.hasTag('isFetching')
    ? 'teal'
    : state.hasTag('isWaitingForSelection')
    ? 'yellow'
    : state.hasTag('isAnySuggestionSelected')
    ? 'purple'
    : state.hasTag('hasEmptyResult')
    ? 'pink'
    : state.hasTag('isErrored')
    ? 'red'
    : undefined;

  return (
    <VStack w={'100%'} spacing={10}>
      <Badge colorScheme={colorSchema}>{JSON.stringify(state.value, null, 2)}</Badge>
      <VStack w="100%" spacing={0} align="stretch" ref={containerRef}>
        <Popover
          autoFocus={false}
          returnFocusOnClose={false}
          isOpen={state.hasTag('isOpened')}
          placement="bottom-start"
          matchWidth
        >
          <PopoverTrigger>
            <Input
              ref={inputRef}
              value={state.context.query}
              isLoading={state.hasTag('isFetching')}
              onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
              onFocus={(event) => send({ type: 'FOCUS' })}
              onClick={(event) => send({ type: 'CLICK' })}
              isInvalid={state.hasTag('isErrored')}
              isDisabled={state.hasTag('isDisabled')}
              error={state.context.errorMessage!}
              placeholder="Enter a query..."
              rightElement={
                <If cond={state.hasTag('isDirty')}>
                  <Then>
                    <Button
                      isDisabled={state.hasTag('isDisabled')}
                      variant={state.hasTag('isErrored') ? 'searchBoxErrored' : 'searchBox'}
                      p={1}
                      size="xs"
                      onClick={() => send({ type: 'CLEAR' })}
                    >
                      CLEAR
                    </Button>
                  </Then>
                  <Else>
                    <Search2Icon color={'gray.400'} />
                  </Else>
                </If>
              }
            />
          </PopoverTrigger>
          <PopoverContent
            width="inherit"
            mt="-7px"
            border="0"
            _focus={{
              boxShadow: 'none',
            }}
          >
            <List>
              <If cond={state.context.suggestions.length > 0}>
                <Then>
                  {state.context.suggestions.map((suggestion) => (
                    <ListItem
                      key={suggestion.id}
                      highlight={state.context.selected?.id === suggestion.id}
                      onClick={(event) => send({ type: 'SELECT', id: Number(suggestion.id) })}
                    >
                      {suggestion.label}
                    </ListItem>
                  ))}
                </Then>
                <Else if={!state.hasTag('isErrored')}>
                  <ListItem>No results were found!</ListItem>
                </Else>
                <Else if={state.hasTag('isErrored')}>
                  <ListItemErrored>{state.context.errorMessage}</ListItemErrored>
                </Else>
              </If>
            </List>
          </PopoverContent>
        </Popover>
      </VStack>
    </VStack>
  );
};

export default SearchBox;

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
