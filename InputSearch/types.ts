export interface Place {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: any;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon: string;
}

export type Query = {
  places: Place[];
  isFetching: boolean;
  error: null | string;
};

export type Event =
  | { type: 'change'; payload: string }
  | { type: 'focus' }
  | { type: 'click' }
  | { type: 'blur' }
  | { type: 'clear' }
  | { type: 'select'; payload: Place['place_id'] };

export type ExtractEvent<T extends Event['type']> = Extract<Event, { type: T }>;
