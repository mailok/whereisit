import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      '50': '#EDF2F7',
      '100': '#CEDBE9',
      '200': '#AEC4DB',
      '300': '#8EADCD',
      '400': '#6E96BF',
      '500': '#4E7FB1',
      '600': '#3F668D',
      '700': '#2F4C6A',
      '800': '#1F3347',
      '900': '#101923',
    },
  },
  components: {
    Input: {
      baseStyle: ({ colorMode }) => ({
        field: {
          color: colorMode === 'light' ? 'gray.600' : 'gray.400',
        },
      }),
      sizes: {},
      defaultProps: {},
    },
  },
});

export default theme;
