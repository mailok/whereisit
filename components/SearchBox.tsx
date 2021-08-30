import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import searchBoxMachine, { Suggestion } from '../machines/searchBoxMachine';
import Autocomplete from './Autocomplete';
import { Badge, VStack } from '@chakra-ui/react';

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
  });

  useEffect(() => {
    send({ type: 'CHANGE_CONFIG', config: { focusOnSelect: props.focusOnSelect } });
  }, [props.focusOnSelect]);

  useEffect(() => {
    send({ type: props.isDisabled ? 'DISABLE' : 'ENABLE' });
  }, [props.isDisabled]);

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
      <Autocomplete
        value={state.context.query}
        isLoading={state.hasTag('isFetching')}
        suggestions={state.context.suggestions}
        onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
        onSelect={(suggestion) => send({ type: 'SELECT', id: Number(suggestion.id) })}
        onClickOutside={() => send({ type: 'BLUR' })}
        onFocus={(event) => send({ type: 'FOCUS' })}
        onClick={(event) => send({ type: 'CLICK' })}
        onClear={() => send({ type: 'CLEAR' })}
        isOpen={state.hasTag('isOpened')}
        placeholder="Enter a query..."
        isInvalid={state.hasTag('isErrored')}
        error={state.context.errorMessage!}
        highlightedId={state.context.selected?.id}
        focusOnSelect={state.context.config.focusOnSelect}
        isDisabled={state.hasTag('isDisabled')}
      />
    </VStack>
  );
};

export default SearchBox;

function getColorSchema() {}
