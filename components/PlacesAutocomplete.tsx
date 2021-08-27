import React from 'react';
import Autocomplete, { Suggestion } from './Autocomplete';
import { useMachine } from '@xstate/react';
import placesAutocompleteMachine, {
  AutocompleteMachineContext,
  AutocompleteMachineEvent,
  Place,
} from '../machines/placesAutocompleteMachine';
import { inspect } from '@xstate/inspect';

type PlacesAutocompleteProps = {};

if (typeof window !== 'undefined') {
  inspect({
    // options
    // url: 'https://statecharts.io/inspect', // (default)
    iframe: false, // open in new window
  });
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = (props) => {
  const [state, send] = useMachine<AutocompleteMachineContext, AutocompleteMachineEvent>(placesAutocompleteMachine, {
    devTools: true,
  });
  console.log(state.value);

  return (
    <Autocomplete
      value={state.context.inputValue}
      isLoading={state.matches('fetching')}
      suggestions={state.context.places.map(fromPlaceToSuggestion)}
      onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
      onSelect={(suggestion) => send({ type: 'SELECT_VALUE', value: suggestion.label })}
      onClickOutside={() => send({ type: 'CLOSE_SUGGESTIONS_LIST' })}
      onFocus={() => send({ type: 'FOCUS' })}
      onClear={() => send({ type: 'CLEAR' })}
      isOpen={state.matches('showingSuggestionList')}
      placeholder="Enter a place..."
      isInvalid={state.matches('showingErrorMessage')}
    />
  );
};
function fromPlaceToSuggestion(place: Place): Suggestion {
  return {
    key: place.place_id,
    label: place.display_name,
  };
}
