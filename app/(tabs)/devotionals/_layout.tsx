import { Stack } from 'expo-router';

export default function DevotionalsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meus Devocionais' }} />
      <Stack.Screen
        name="new"
        options={{ title: 'Novo Devocional', presentation: 'modal' }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Devocional' }} />
      <Stack.Screen
        name="[id]/edit"
        options={{ title: 'Editar', presentation: 'modal' }}
      />
    </Stack>
  );
}
