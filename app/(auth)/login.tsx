import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'E-mail inválido';
    if (!password) errs.password = 'Senha obrigatória';
    else if (password.length < 6) errs.password = 'Mínimo de 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      Alert.alert('Erro ao entrar', err);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Título */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold text-brand">Devos</Text>
            <Text className="text-gray-500 mt-2 text-center">
              Sua jornada devocional diária
            </Text>
          </View>

          {/* Formulário */}
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            className="self-end mb-6"
          >
            <Text className="text-sm text-brand">Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button title="Entrar" onPress={handleLogin} loading={loading} />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Ainda não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-brand font-semibold">Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
