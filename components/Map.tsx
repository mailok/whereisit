import React, { FC, useEffect, useRef, useState } from 'react';
import ReactMapGL, { ViewState } from 'react-map-gl';
import { Box, Center, useColorModeValue } from '@chakra-ui/react';
import SearchPlace from './SearchPlace';

interface MapProps {}

const Map: FC<MapProps> = () => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState<ViewState>(VIEW_STATE_DEFAULT);

  const mapStyle = useColorModeValue(
    'mapbox://styles/mapbox/light-v9',
    'mapbox://styles/leighhalliday/ckhjaksxg0x2v19s1ovps41ef',
  );
  const borderColor = useColorModeValue('gray.300', 'gray.800');

  useEffect(() => {
    if (mapRef.current) {
      // mapRef?.current?.getMap().getBounds();
    }
  }, [viewState, mapRef]);

  return (
    <Box w="100%" borderRadius="4px" border="1px" borderColor={borderColor}>
      <ReactMapGL
        width="100%"
        height="calc(100vh - 74px)"
        ref={mapRef}
        viewState={viewState}
        onViewportChange={setViewState}
        minZoom={5}
        maxZoom={15}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        mapStyle={mapStyle}
      >
        <SearchPlaceLayout>
          <SearchPlace onSelect={(place) => console.log(place)} />
        </SearchPlaceLayout>
      </ReactMapGL>
    </Box>
  );
};

export default Map;

const VIEW_STATE_DEFAULT: ViewState = {
  latitude: 20.0214637,
  longitude: -75.8294928,
  zoom: 5,
};

function SearchPlaceLayout({ children }: any) {
  return (
    <Center height="3em">
      <Box width="70%">{children}</Box>
    </Center>
  );
}
