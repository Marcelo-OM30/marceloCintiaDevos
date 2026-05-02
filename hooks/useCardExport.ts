import { useRef, useCallback } from 'react';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export function useCardExport() {
  const viewShotRef = useRef<ViewShot>(null);

  const capture = useCallback(async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      return null;
    }
  }, []);

  const saveToGallery = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar a galeria para salvar.');
      return;
    }
    const uri = await capture();
    if (!uri) { Alert.alert('Erro', 'Não foi possível gerar a imagem.'); return; }
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Salvo!', 'Imagem salva na galeria com sucesso.');
  }, [capture]);

  const shareCard = useCallback(async () => {
    const uri = await capture();
    if (!uri) { Alert.alert('Erro', 'Não foi possível gerar a imagem.'); return; }
    const available = await Sharing.isAvailableAsync();
    if (!available) { Alert.alert('Compartilhamento não disponível neste dispositivo.'); return; }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar card' });
  }, [capture]);

  return { viewShotRef, saveToGallery, shareCard };
}
