import React from 'react';
import { useMachine } from '@xstate/react';
import searchBoxMachine, { Suggestion } from '../machines/searchBoxMachine';
import Autocomplete from './Autocomplete';
import { Badge, VStack } from '@chakra-ui/react';

interface SearchBoxProps {
  fetchHandler: (query: string) => Promise<any>;
  mapResultToSuggestion: (value: any) => Suggestion;
}

const SearchBox: React.FC<SearchBoxProps> = (props) => {
  const [state, send] = useMachine(searchBoxMachine, {
    devTools: false,
    services: {
      fetchSuggestions: (context) =>
        props.fetchHandler(context.query).then((response) => response.map(props.mapResultToSuggestion)),
    },
  });

  const isInvalid = [{ enable: { focused: 'errored' } }, { enable: { unfocused: 'errored' } }].some(state.matches);

  // TODO: Eliminar esto
  const colorSchema = state.matches({ enable: { focused: 'changing' } })
    ? 'orange'
    : state.matches({ enable: { focused: 'fetching' } })
    ? 'teal'
    : state.matches({ enable: { focused: 'waitingSelection' } })
    ? 'yellow'
    : state.matches({ enable: { focused: 'suggestionSelected' } })
    ? 'purple'
    : state.matches({ enable: { focused: 'showingEmptyResult' } })
    ? 'blackAlpha'
    : isInvalid
    ? 'red'
    : undefined;

  return (
    <VStack w={'100%'} spacing={10}>
      <Badge colorScheme={colorSchema}>{JSON.stringify(state.value, null, 2)}</Badge>
      <Autocomplete
        value={state.context.query}
        isLoading={state.matches({ enable: { focused: 'fetching' } })}
        suggestions={state.context.suggestions}
        onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
        onSelect={(suggestion) => send({ type: 'SELECT', id: Number(suggestion.id) })}
        onClickOutside={() => send({ type: 'BLUR' })}
        onFocus={(event) => send({ type: 'FOCUS' })}
        onClick={(event) => send({ type: 'CLICK' })}
        onClear={() => send({ type: 'CLEAR' })}
        isOpen={state.matches({ enable: { focused: 'waitingSelection' } })}
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
