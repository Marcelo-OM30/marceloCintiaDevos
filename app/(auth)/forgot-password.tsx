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
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Informe um e-mail válido');
      return;
    }
    setEmailError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    Alert.alert(
      'E-mail enviado',
      'Verifique sua caixa de entrada para redefinir a senha.',
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
          <View className="mb-8">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-brand text-sm">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-gray-900">Recuperar senha</Text>
            <Text className="text-gray-500 mt-1">
              Enviaremos um link de redefinição para seu e-mail.
            </Text>
          </View>

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            error={emailError}
          />

          <Button title="Enviar link" onPress={handleReset} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
