import { ChakraProvider } from '@chakra-ui/react';
import React, { FC } from 'react';
import theme from '../theme';

const Providers: FC = (props) => {
  return <ChakraProvider theme={theme}>{props.children}</ChakraProvider>;
};

export default Providers;
