import React, { FC, useRef, useState } from 'react';
import ReactMapGL, { FlyToInterpolator, ViewState } from 'react-map-gl';
import { Box, useColorModeValue, Flex } from '@chakra-ui/react';
import SearchPlace from './SearchPlace';

interface MapProps {}

const Map: FC<MapProps> = () => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState<ViewState>(VIEW_STATE_DEFAULT);

  const mapStyle = useColorModeValue(
    'mapbox://styles/mapbox/light-v9',
    'mapbox://styles/leighhalliday/ckhjaksxg0x2v19s1ovps41ef',
  );

  return (
    <Flex alignItems="center" w="100%" borderRadius="4px" flexDir="column" gap={2}>
      <Box width="60%">
        <SearchPlace
          onSelect={(place) =>
            setViewState((prevState) => ({
              ...prevState,
              latitude: Number(place.lat),
              longitude: Number(place.lon),
              transitionInterpolator: new FlyToInterpolator(),
              transitionDuration: 3000,
            }))
          }
          showState
          focusOnSelect
        />
      </Box>
      <ReactMapGL
        width="80%"
        height="80vh"
        ref={mapRef}
        viewState={viewState}
        onViewportChange={setViewState}
        minZoom={5}
        maxZoom={15}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        mapStyle={mapStyle}
      ></ReactMapGL>
    </Flex>
  );
};

export default Map;

const VIEW_STATE_DEFAULT: ViewState = {
  latitude: 20.0214637,
  longitude: -75.8294928,
  zoom: 5,
};
