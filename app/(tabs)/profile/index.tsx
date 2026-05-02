import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Stats {
  devotionals: number;
  bookmarks: number;
  highlights: number;
}

function useProfile(userId: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

function useStats(userId: string | undefined) {
  return useQuery<Stats>({
    queryKey: ['stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [devs, bookmarks, highlights] = await Promise.all([
        supabase.from('devotionals').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
        supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
        supabase.from('highlights').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
      ]);
      return {
        devotionals: devs.count ?? 0,
        bookmarks: bookmarks.count ?? 0,
        highlights: highlights.count ?? 0,
      };
    },
  });
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: stats } = useStats(user?.id);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  function startEdit() {
    setFullName(profile?.full_name ?? '');
    setBio(profile?.bio ?? '');
    setEditing(true);
  }

  const { mutateAsync: saveProfile, isPending: saving } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null, bio: bio.trim() || null })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.id] });
      setEditing(false);
    },
    onError: (e: any) => Alert.alert('Erro', e.message ?? 'Não foi possível salvar.'),
  });

  const { mutateAsync: uploadAvatar, isPending: uploading } = useMutation({
    mutationFn: async (uri: string) => {
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `avatars/${user!.id}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user!.id);
      if (profErr) throw profErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
    onError: (e: any) => Alert.alert('Erro', e.message ?? 'Erro ao enviar foto.'),
  });

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await uploadAvatar(result.assets[0].uri);
  }

  async function handleSignOut() {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  const initials = (profile?.username ?? '?').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="bg-brand pt-12 pb-8 items-center px-6">
          {/* Avatar */}
          <TouchableOpacity onPress={pickAvatar} className="mb-4 relative">
            {uploading ? (
              <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center">
                <ActivityIndicator color="#fff" />
              </View>
            ) : profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full border-4 border-white"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-white/20 border-4 border-white items-center justify-center">
                <Text className="text-white text-3xl font-bold">{initials}</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-white rounded-full w-8 h-8 items-center justify-center shadow">
              <Text className="text-base">📷</Text>
            </View>
          </TouchableOpacity>

          {!editing ? (
            <>
              <Text className="text-white text-xl font-bold">
                {profile?.full_name ?? profile?.username}
              </Text>
              <Text className="text-white/70 text-sm mt-1">@{profile?.username}</Text>
              {profile?.bio ? (
                <Text className="text-white/80 text-sm text-center mt-2 leading-5">
                  {profile.bio}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={startEdit}
                className="mt-4 bg-white/20 border border-white/40 rounded-xl px-5 py-2"
              >
                <Text className="text-white text-sm font-medium">Editar perfil</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="w-full mt-2 gap-3">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nome completo"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="bg-white/20 rounded-xl px-4 py-3 text-white text-sm"
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Bio (opcional)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                className="bg-white/20 rounded-xl px-4 py-3 text-white text-sm min-h-16"
                textAlignVertical="top"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  className="flex-1 bg-white/10 rounded-xl py-3 items-center"
                >
                  <Text className="text-white text-sm">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveProfile()}
                  disabled={saving}
                  className="flex-1 bg-white rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="#7C3AED" size="small" />
                  ) : (
                    <Text className="text-brand font-semibold text-sm">Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row mx-6 mt-6 bg-gray-50 rounded-2xl overflow-hidden">
          {[
            { label: 'Devocionais', value: stats?.devotionals ?? 0 },
            { label: 'Favoritos', value: stats?.bookmarks ?? 0 },
            { label: 'Marcações', value: stats?.highlights ?? 0 },
          ].map((s, i) => (
            <View
              key={s.label}
              className={`flex-1 py-4 items-center ${i < 2 ? 'border-r border-gray-200' : ''}`}
            >
              <Text className="text-2xl font-bold text-brand">{s.value}</Text>
              <Text className="text-xs text-gray-500 mt-1">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Info section */}
        <View className="mx-6 mt-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Conta
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
              <Text className="text-gray-500 text-sm flex-1">E-mail</Text>
              <Text className="text-gray-800 text-sm">{user?.email}</Text>
            </View>
            <View className="flex-row items-center px-4 py-4">
              <Text className="text-gray-500 text-sm flex-1">Usuário</Text>
              <Text className="text-gray-800 text-sm">@{profile?.username}</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <View className="mx-6 mt-6">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
          >
            <Text className="text-red-500 font-semibold">Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
