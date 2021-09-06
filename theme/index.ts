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
          /*color: colorMode === 'light' ? 'gray.600' : 'gray.400',*/
        },
      }),
      variants: {
        searchBox: (props) => ({
          field: {
            color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
            backgroundColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            border: '1px',
            borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
            _focus: {
              backgroundColor: props.colorMode === 'dark' ? 'gray.800' : 'white',
            },
            _disabled: {
              opacity: 0.3,
            },
          },
        }),
        searchBoxErrored: (props) => ({
          field: {
            color: props.colorMode === 'dark' ? 'red.400' : 'red.500',
            backgroundColor: props.colorMode === 'dark' ? 'gray.700' : 'red.50',
            border: '1px',
            borderColor: props.colorMode === 'dark' ? 'red.700' : 'red.200',
          },
        }),
      },
    },
    Button: {
      variants: {
        searchBox: (props) => ({
          color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
          border: '1px',
          _disabled: {
            opacity: 0.3,
          },
        }),
        searchBoxErrored: (props) => ({
          color: props.colorMode === 'dark' ? 'red.300' : 'red.500',
          border: '1px',
        }),
      },
    },
  },
});

export default theme;
