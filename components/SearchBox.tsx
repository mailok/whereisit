import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import searchBoxMachine, { Suggestion } from '../machines/searchBoxMachine';
import Autocomplete from './Autocomplete';
import { Badge, VStack } from '@chakra-ui/react';

interface SearchBoxProps {
  fetchHandler: (query: string) => Promise<any>;
  mapResultToSuggestion: (value: any) => Suggestion;
  focusOnSelect?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = (props) => {
  const [state, send] = useMachine(searchBoxMachine, {
    devTools: false,
    services: {
      fetchSuggestions: (context) =>
        props.fetchHandler(context.query).then((response) => response.map(props.mapResultToSuggestion)),
    },
  });

  const isInvalid = [{ enabled: { focused: 'errored' } }, { enabled: { unfocused: 'errored' } }].some(state.matches);
  const isOpen = [
    { enabled: { focused: 'waitingSelection' } },
    { enabled: { focused: 'showingEmptyResult' } },
    { enabled: { focused: 'errored' } },
  ].some(state.matches);

  useEffect(() => {
    send({ type: 'CHANGE_CONFIG', config: { focusOnSelect: props.focusOnSelect } });
  }, [props.focusOnSelect]);

  // TODO: Eliminar esto
  const colorSchema = state.matches({ enabled: { focused: 'changing' } })
    ? 'orange'
    : state.matches({ enabled: { focused: 'fetching' } })
    ? 'teal'
    : state.matches({ enabled: { focused: 'waitingSelection' } })
    ? 'yellow'
    : state.matches({ enabled: { focused: 'suggestionSelected' } })
    ? 'purple'
    : state.matches({ enabled: { focused: 'showingEmptyResult' } })
    ? 'pink'
    : isInvalid
    ? 'red'
    : undefined;

  return (
    <VStack w={'100%'} spacing={10}>
      <Badge colorScheme={colorSchema}>{JSON.stringify(state.value, null, 2)}</Badge>
      <Autocomplete
        value={state.context.query}
        isLoading={state.matches({ enabled: { focused: 'fetching' } })}
        suggestions={state.context.suggestions}
        onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
        onSelect={(suggestion) => send({ type: 'SELECT', id: Number(suggestion.id) })}
        onClickOutside={() => send({ type: 'BLUR' })}
        onFocus={(event) => send({ type: 'FOCUS' })}
        onClick={(event) => send({ type: 'CLICK' })}
        onClear={() => send({ type: 'CLEAR' })}
        isOpen={isOpen}
        placeholder="Enter a query..."
        isInvalid={isInvalid}
        error={state.context.errorMessage!}
        highlightedId={state.context.selected?.id}
        focusOnSelect={state.context.config.focusOnSelect}
      />
    </VStack>
  );
};

export default SearchBox;

function getColorSchema() {}
