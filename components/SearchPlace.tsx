import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
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
import searchPlaceMachine, { Place, searchPlaceModel } from '../machines/searchPlaceMachine';

interface SearchPlaceProps {
  focusOnSelect?: boolean;
  isDisabled?: boolean;
  showState?: boolean;
  onSelect?: (place: Place) => void;
}

const SearchPlace: React.FC<SearchPlaceProps> = (props) => {
  const [state, send] = useMachine(searchPlaceMachine, {
    devTools: true,
    actions: {
      focus: () => {
        inputRef.current?.focus();
      },
    },
  });

  useEffect(() => {
    send(searchPlaceModel.events.CHANGE_CONFIG({ focusOnSelect: props.focusOnSelect }));
  }, [props.focusOnSelect]);

  useEffect(() => {
    send(props.isDisabled ? searchPlaceModel.events.DISABLE() : searchPlaceModel.events.ENABLE());
  }, [props.isDisabled]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useOutsideClick({
    ref: containerRef,
    handler: () => send(searchPlaceModel.events.BLUR()),
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
    <VStack w="100%" spacing={2}>
      <If cond={props.showState}>
        <Then>
          <Badge colorScheme={colorSchema}>{JSON.stringify(state.value, null, 2)}</Badge>
        </Then>
      </If>
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
              onChange={(event) => send(searchPlaceModel.events.CHANGE(event.target.value))}
              onFocus={(event) => send(searchPlaceModel.events.FOCUS())}
              onClick={(event) => send(searchPlaceModel.events.CLICK())}
              isInvalid={state.hasTag('isErrored')}
              isDisabled={state.hasTag('isDisabled')}
              error={state.context.errorMessage!}
              placeholder="Search your location"
              rightElement={
                <If cond={state.hasTag('isDirty')}>
                  <Then>
                    <Button
                      isDisabled={state.hasTag('isDisabled')}
                      variant={state.hasTag('isErrored') ? 'searchBoxErrored' : 'searchBox'}
                      p={1}
                      size="xs"
                      onClick={() => send(searchPlaceModel.events.CLEAR())}
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
              <If cond={state.context.places.length > 0}>
                <Then>
                  {state.context.places.map((place) => (
                    <ListItem
                      key={place.place_id}
                      highlight={state.context.selected?.place_id === place.place_id}
                      onClick={(event) => {
                        send(searchPlaceModel.events.SELECT(Number(place.place_id)));
                        props?.onSelect?.(place);
                      }}
                    >
                      {place.display_name}
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

export default SearchPlace;

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
