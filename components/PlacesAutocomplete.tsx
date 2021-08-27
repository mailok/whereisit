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

/*if (typeof window !== 'undefined') {
  inspect({
    // options
    // url: 'https://statecharts.io/inspect', // (default)
    iframe: false, // open in new window
  });
}*/

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = (props) => {
  const [state, send] = useMachine<AutocompleteMachineContext, AutocompleteMachineEvent>(placesAutocompleteMachine, {
    devTools: false,
  });
  console.log({ value: state.value, selected: state.context.placeSelected });

  return (
    <Autocomplete
      value={state.context.inputValue}
      isLoading={state.matches('fetching')}
      suggestions={state.context.places.map(fromPlaceToSuggestion)}
      onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
      onSelect={(suggestion) => send({ type: 'SELECT_SUGGESTION', placeId: Number(suggestion.key) })}
      onClickOutside={() => send({ type: 'CLOSE_SUGGESTIONS_LIST' })}
      onFocus={() => send({ type: 'FOCUS' })}
      onClear={() => send({ type: 'CLEAR' })}
      isOpen={state.matches('showingSuggestionList')}
      placeholder="Enter a place..."
      isInvalid={state.matches('showingErrorMessage')}
      error={state.context.errorMessage!}
      highlightedId={state.context.placeSelected?.place_id}
    />
  );
};
function fromPlaceToSuggestion(place: Place): Suggestion {
  return {
    key: place.place_id,
    label: place.display_name,
  };
}
