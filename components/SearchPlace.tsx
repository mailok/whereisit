import React from 'react';
import {
  Badge,
  Button,
  List as ChakraList,
  ListItem as ChakraListItem,
  ListItemProps as ChakraListItemProps,
  ListProps as NativeListProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SlideFade,
  Text,
  useColorModeValue,
  VStack,
  useOutsideClick,
} from '@chakra-ui/react';
import { Else, If, Then } from './utils';
import Input from './Input';
import { Search2Icon } from '@chakra-ui/icons';
import InputSearch from '../InputSearch/react';
import { Place } from '../InputSearch/types';

interface SearchPlaceProps {
  focusOnSelect?: boolean;
  isDisabled?: boolean;
  showState?: boolean;
  onSelect?: (place: Place) => void;
}

const SearchPlace: React.FC<SearchPlaceProps> = (props) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { value, places, isLoading, isPopOverOpen, placeSelected, error, Event } = InputSearch.usePlaces({
    onFocus: () => {
      inputRef.current?.focus();
    },
  });
  const isErrored = Boolean(error);

  useOutsideClick({
    ref: containerRef,
    handler: Event.blur,
  });

  let colorSchema = isErrored
    ? 'red'
    : isLoading
    ? 'yellow'
    : isPopOverOpen && Boolean(places.length)
    ? 'green'
    : isPopOverOpen && !Boolean(places.length)
    ? 'teal'
    : undefined;

  return (
    <VStack w="100%" spacing={2}>
      <If cond={props.showState}>
        <Then>
          <Badge colorScheme={colorSchema}>
            {JSON.stringify(
              {
                value: value.length > 10 ? `${value.slice(0, 10)}...` : value,
                placesLength: places.length,
                isLoading,
                isPopOverOpen,
                error: error ? `${error.slice(0, 10)}...` : error,
              },
              null,
              2,
            )}
          </Badge>
        </Then>
      </If>
      <VStack w="100%" spacing={0} align="stretch" ref={containerRef}>
        <Popover
          autoFocus={false}
          returnFocusOnClose={false}
          isOpen={isPopOverOpen}
          placement="bottom-start"
          matchWidth
        >
          <PopoverTrigger>
            <Input
              ref={inputRef}
              value={value}
              isLoading={isLoading}
              onChange={Event.change}
              onFocus={Event.focus}
              onClick={Event.click}
              isInvalid={isErrored}
              isDisabled={props.isDisabled}
              error={error!}
              placeholder="Search your location"
              rightElement={
                <If cond={Boolean(value)}>
                  <Then>
                    <Button
                      isDisabled={props.isDisabled}
                      variant={isErrored ? 'searchBoxErrored' : 'searchBox'}
                      p={1}
                      size="xs"
                      onClick={Event.clear}
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
              <If cond={Boolean(places.length)}>
                <Then>
                  {places.map((place) => (
                    <ListItem
                      key={place.place_id}
                      highlight={placeSelected?.place_id === place.place_id}
                      onClick={(event) => {
                        Event.select(Number(place.place_id));
                        if (props.focusOnSelect) {
                          Event.focus();
                        }
                        props?.onSelect?.(place);
                      }}
                    >
                      {place.display_name}
                    </ListItem>
                  ))}
                </Then>
                <Else if={!error && !Boolean(places.length)}>
                  <ListItem>No results were found!</ListItem>
                </Else>
                <Else if={isErrored}>
                  <ListItemErrored>{error}</ListItemErrored>
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
