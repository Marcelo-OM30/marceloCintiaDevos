import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
};

export function Button({ title, onPress, loading = false, variant = 'primary', disabled = false }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        'h-12 rounded-xl items-center justify-center px-6',
        isPrimary
          ? 'bg-brand'
          : 'border-2 border-brand bg-transparent',
        (disabled || loading) ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#7C3AED'} />
      ) : (
        <Text
          className={[
            'text-base font-semibold',
            isPrimary ? 'text-white' : 'text-brand',
          ].join(' ')}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
