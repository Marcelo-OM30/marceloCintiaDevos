import { View, TextInput, Text } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  error?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  error,
}: Props) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        className={[
          'h-12 rounded-xl border px-4 text-base text-gray-900 bg-white',
          error ? 'border-red-400' : 'border-gray-300',
        ].join(' ')}
        placeholderTextColor="#9CA3AF"
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
