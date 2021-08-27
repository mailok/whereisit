import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Button, Center, Container, HStack, IconButton, Stack, useColorMode, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import Autocomplete from '../components/Autocomplete';
import { MoonIcon, PhoneIcon, RepeatIcon, SunIcon } from '@chakra-ui/icons';
import { PlacesAutocomplete } from '../components/PlacesAutocomplete';

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [isLoading, setLoading] = useState(false);
  const toggleLoading = () => {
    setLoading(!isLoading);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Container h="100vh" w="100%" maxW="container.xs" display="flex" justifyContent="center" pt={12}>
          <VStack w="50%" spacing={14}>
            <HStack w="100%">
              <IconButton
                variant="outline"
                colorScheme="teal"
                aria-label="Call Sage"
                fontSize="20px"
                onClick={toggleColorMode}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              />
            </HStack>
            <PlacesAutocomplete />
            {/*<span>Debajo</span>*/}
          </VStack>
        </Container>
      </main>

      <footer className={styles.footer} />
    </div>
  );
}
