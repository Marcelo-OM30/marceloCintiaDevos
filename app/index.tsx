import { Redirect } from 'expo-router';

// Redireciona para as tabs (home) por padrão
// Quando auth estiver implementado, redirecionar para (auth)/login se não logado
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
