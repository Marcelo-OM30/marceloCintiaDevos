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

export default function RegisterScreen() {
  const signUp = useAuthStore((s) => s.signUp);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!username.trim()) errs.username = 'Nome de usuário obrigatório';
    else if (username.trim().length < 3) errs.username = 'Mínimo de 3 caracteres';
    else if (!/^[a-z0-9_]+$/.test(username.trim()))
      errs.username = 'Use apenas letras minúsculas, números e _';

    if (!email.trim()) errs.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'E-mail inválido';

    if (!password) errs.password = 'Senha obrigatória';
    else if (password.length < 6) errs.password = 'Mínimo de 6 caracteres';

    if (!confirmPassword) errs.confirmPassword = 'Confirme sua senha';
    else if (password !== confirmPassword) errs.confirmPassword = 'As senhas não coincidem';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    const err = await signUp(email.trim().toLowerCase(), password, username.trim().toLowerCase());
    setLoading(false);

    if (err) {
      Alert.alert('Erro ao cadastrar', err);
      return;
    }

    Alert.alert(
      'Cadastro realizado!',
      'Verifique seu e-mail para confirmar a conta e depois faça login.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
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
          {/* Cabeçalho */}
          <View className="mb-8">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-brand text-sm">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-gray-900">Criar conta</Text>
            <Text className="text-gray-500 mt-1">
              Junte-se à comunidade devocional
            </Text>
          </View>

          {/* Formulário */}
          <Input
            label="Nome de usuário"
            value={username}
            onChangeText={setUsername}
            placeholder="ex: joao_silva"
            autoCapitalize="none"
            error={errors.username}
          />

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
            placeholder="mínimo 6 caracteres"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="repita a senha"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View className="mt-2 mb-6">
            <Text className="text-xs text-gray-400 text-center">
              Ao criar sua conta, você concorda com nossos Termos de Uso e
              Política de Privacidade.
            </Text>
          </View>

          <Button title="Criar conta" onPress={handleRegister} loading={loading} />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-brand font-semibold">Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
