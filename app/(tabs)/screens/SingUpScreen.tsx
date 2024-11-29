import React, { useState } from 'react';
import { View, TextInput, Image, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';

import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';

const SignupScreen = ({ navigation }: any) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [estado, setEstado] = useState('');

  const validateForm = () => {
    if (!nome || !email || !senha || !cep || !rua || !estado) {
      Alert.alert('Erro', 'Todos os campos devem ser preenchidos.');
      return false;
    }
    return true;
  };

  const registerUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cadastro', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomeUser: nome,
          emailUser: email,
          senhaUser: senha,
          cepUser: cep,
          ruaUser: rua,
          estadoUser: estado,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', result.error || 'Erro desconhecido ao cadastrar.');
        return;
      }

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o usuário.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        onChangeText={(text) => setNome(text)}
        value={nome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        onChangeText={(text) => setSenha(text)}
        secureTextEntry
        value={senha}
      />
      <TextInput
        style={styles.input}
        placeholder="CEP"
        onChangeText={(text) => setCep(text)}
        value={cep}
      />
      <TextInput
        style={styles.input}
        placeholder="Endereço Completo"
        onChangeText={(text) => setRua(text)}
        value={rua}
      />
      <TextInput 
        style={styles.input}
        placeholder="Estado"
        onChangeText={(text) => setEstado(text)}
        value={estado}
      />
      <TouchableOpacity style={styles.button} onPress={registerUser}>
        <Text style={styles.buttonText}>Cadastrar</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFA3BE',
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 2,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 10,
    backgroundColor: '#DB7093',
  },
  button: {
    backgroundColor: '#DB7093', 
    paddingVertical: 15, 
    borderRadius: 10,
    alignItems: 'center', 
    marginTop: 20, 
  },
  buttonText: {
    color: '#fff', 
    fontSize: 18,
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
  navButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  navIcon: {
    width: 30,
    height: 30,
  },
});

export default SignupScreen;