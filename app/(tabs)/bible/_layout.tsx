import { Stack } from 'expo-router';

export default function BibleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Bíblia' }} />
      <Stack.Screen name="[book]/index" options={{ title: 'Capítulos' }} />
      <Stack.Screen name="[book]/[chapter]" options={{ title: '' }} />
      <Stack.Screen name="search" options={{ title: 'Pesquisar', presentation: 'modal' }} />
    </Stack>
  );
}
