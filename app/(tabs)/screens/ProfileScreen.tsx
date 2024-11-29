import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';
import defaultImage from '../../../assets/images/perfil.png';

const ProfileScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState<string>(''); 
  const [profileImage, setProfileImage] = useState<string | null>(null); 

  const getToken = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Erro', 'Token não encontrado. Faça login novamente.');
      navigation.navigate('Login');
      throw new Error('Token não encontrado');
    }
    return token;
  };

  const fetchUserData = async () => {
    try {
      const token = await getToken();
  
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
        console.log('Dados do usuário:', result);
  
        setUserName(result.name || '');
        setProfileImage(
          typeof result.profileImage === 'string' && result.profileImage.trim() !== ''
            ? result.profileImage
            : null
        );
      } else {
        const errorText = await response.text();
        console.error('Erro do servidor:', errorText);
        Alert.alert('Erro', 'Falha ao obter dados do usuário.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível obter os dados do usuário.');
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

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Erro', 'Nenhuma imagem selecionada.');
        return;
      }

      const token = await getToken();

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
        setProfileImage(data.profileImage);
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
      const token = await getToken();

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserName('');
      setProfileImage(null);
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Não foi possível desconectar.');
    }
  };

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
        <Text style={styles.profileName}>{userName || 'Carregando...'}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.menuItemText}>Histórico de pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Cupon')}
        >
          <Text style={styles.menuItemText}>Cupons</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.menuItemText}>Meios de Pagamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Config')}
        >
          <Text style={styles.menuItemText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Desconectar</Text>
      </TouchableOpacity>

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
    paddingHorizontal: 20,
    backgroundColor: '#FFA3BE',
    paddingBottom: 60,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
    height: 150,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    marginTop: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuContainer: {
    width: '100%',
    marginTop: 60,
  },
  menuItem: {
    backgroundColor: '#DB7093',
    paddingVertical: 15,
    borderRadius: 10,
    borderColor: '#fff',
    borderWidth: 2,
    marginBottom: 10,
    alignItems: 'center',
  },
  menuItemText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#FFA3BE',
    borderRadius: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
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

export default ProfileScreen;