import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';


import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';
import defaultImage from '../../../assets/images/perfil.png';

const ConfigScreen = ({ navigation }: any) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    password?: string;
    cep: string;
    rua: string;
    estado: string;
  }>({
    name: '',
    email: '',
    cep: '',
    rua: '',
    estado: '',
  });

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado. Faça login novamente.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/user-info', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setProfileImage(
          typeof result.profileImage === 'string' && result.profileImage.trim() !== ''
            ? result.profileImage
            : null
        );
        setUserData({
          name: result.name || '',
          email: result.email || '',
          cep: result.cep || '',
          rua: result.rua || '',
          estado: result.estado || '',
        });
      } else {
        const errorText = await response.text();
        console.error('Erro do servidor ao buscar dados do usuário:', errorText);
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
    }
  };

  const updateUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado. Faça login novamente.');
        navigation.navigate('Login');
        return;
      }

      const dataToUpdate = { ...userData };
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }

      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/update-user', {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
      } else {
        const errorText = await response.text();
        console.error('Erro do servidor ao atualizar perfil:', errorText);
        Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Erro ao tentar atualizar o perfil.');
    }
  };

  const changeProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão para acessar a galeria foi negada.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) {
        console.log('Seleção de imagem cancelada.');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado. Faça login novamente.');
        navigation.navigate('Login');
        return;
      }

      const formData = new FormData();
      const localUri = result.assets[0]?.uri;
      if (!localUri) {
        Alert.alert('Erro', 'Imagem inválida. Por favor, tente novamente.');
        return;
      }

      const filename = localUri.split('/').pop() || 'profile.jpg';
      const fileType = `image/${filename.split('.').pop()}`;

      formData.append('profileImage', {
        uri: localUri,
        type: fileType,
        name: filename,
      } as any);

      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/update-profile-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(
          typeof data.profileImage === 'string' && data.profileImage.trim() !== ''
            ? data.profileImage
            : null
        );
        Alert.alert('Sucesso', 'Imagem de perfil alterada com sucesso.');
      } else {
        const errorText = await response.text();
        console.error('Erro do servidor:', errorText);
        Alert.alert('Erro', 'Falha ao alterar a imagem de perfil.');
      }
    } catch (error) {
      console.error('Erro ao alterar imagem de perfil:', error);
      Alert.alert('Erro', 'Não foi possível alterar a imagem de perfil.');
    }
  };

  const removeProfileImage = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado. Faça login novamente.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/remove-profile-image', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProfileImage(null);
        Alert.alert('Sucesso', 'Foto de perfil removida com sucesso.');
      } else {
        const errorText = await response.text();
        console.error('Erro do servidor ao remover a foto:', errorText);
        Alert.alert('Erro', 'Não foi possível remover a foto de perfil.');
      }
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error);
      Alert.alert('Erro', 'Erro ao tentar remover a foto de perfil.');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={changeProfileImage}>
          <Image
            source={
              profileImage && typeof profileImage === 'string' && profileImage.trim() !== ''
                ? { uri: profileImage }
                : defaultImage
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={removeProfileImage}>
          <Text style={styles.removeButtonText}>Remover Foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={userData.email}
          onChangeText={(text) => setUserData({ ...userData, email: text })}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={userData.password || ''}
          onChangeText={(text) => setUserData({ ...userData, password: text })}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="CEP"
          value={userData.cep}
          onChangeText={(text) => setUserData({ ...userData, cep: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Endereço Completo"
          value={userData.rua}
          onChangeText={(text) => setUserData({ ...userData, rua: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Estado"
          value={userData.estado}
          onChangeText={(text) => setUserData({ ...userData, estado: text })}
        />

        <TouchableOpacity style={styles.updateButton} onPress={updateUserData}>
          <Text style={styles.updateButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navButton}>
          <Image source={homeIcon} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.navButton}>
          <Image source={searchIcon} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('CartPage')} style={styles.navButton}>
          <Image source={cartIcon} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.navButton}>
          <Image source={userIcon} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFA3BE',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  removeButtonText: {
    color: '#FF0000',
    fontWeight: 'bold',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#DB7093',
    borderRadius: 10,
    borderColor: '#fff',
    borderWidth: 2,
    padding: 10,
    marginBottom: 15,
    marginTop: 10,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#FFA3BE',
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#577ae4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFA3BE',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DB7093',
  },
  navButton: {
    alignItems: 'center',
  },
  navIcon: {
    width: 30,
    height: 30,
  },
});

export default ConfigScreen;