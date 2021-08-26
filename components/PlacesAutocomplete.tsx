import React from 'react';
import Autocomplete, { Suggestion } from './Autocomplete';
import { useMachine } from '@xstate/react';
import placesAutocompleteMachine, { Place } from '../machines/placesAutocompleteMachine';

type PlacesAutocompleteProps = {};

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = (props) => {
  const [state, send] = useMachine(placesAutocompleteMachine);

  return (
    <Autocomplete
      value={state.context.inputValue}
      isLoading={state.matches('fetching')}
      suggestions={state.context.places.map(fromPlaceToSuggestion)}
      onChange={(event) => send({ type: 'CHANGE', value: event.target.value })}
      onSelect={(suggestion) => console.log('SUggestion:', suggestion)}
      onClear={() => send({ type: 'CLEAR' })}
      isOpen={state.context.isOpen}
    />
  );
};
function fromPlaceToSuggestion(place: Place): Suggestion {
  return {
    key: place.place_id,
    label: place.display_name,
  };
}
