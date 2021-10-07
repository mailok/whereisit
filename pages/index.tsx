import React from 'react';
import Map from '../components/Map';
import Layout from '../components/Layout';
import { SimpleGrid } from '@chakra-ui/react';

export default function Home() {
  return (
    <Layout>
      <SimpleGrid columns={2} spacing={3} p="3px">
        <Map />
      </SimpleGrid>
    </Layout>
  );
}
