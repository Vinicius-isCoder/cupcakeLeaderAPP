import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';

type Cupcake = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
};

const SearchScreen = ({ navigation }: any) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [cupcakes, setCupcakes] = useState<Cupcake[]>([]);
    const [filteredCupcakes, setFilteredCupcakes] = useState<Cupcake[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchCupcakes = async () => {
        try {
          const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cupcakes');
          if (!response.ok) {
            throw new Error('Erro ao buscar cupcakes.');
          }
          const data = await response.json();
          setCupcakes(data.cupcakes);
          setError(null);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchCupcakes();
    }, []);
  
    const handleSearch = (text: string) => {
      setSearchTerm(text);
  
      if (text.trim() === '') {
        setFilteredCupcakes([]);
        return;
      }
  
      const results = cupcakes.filter((cupcake) =>
        cupcake.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCupcakes(results);
    };
  
    const handleCupcakePress = (cupcakeId: number) => {
      navigation.navigate('Home', { focusCupcakeId: cupcakeId });
    };
  
    const renderItem = ({ item }: { item: Cupcake }) => (
      <TouchableOpacity onPress={() => handleCupcakePress(item.id)}>
        <View style={styles.cupcakeItem}>
          <Image
            source={{ uri: `https://cupcakeleaderapp-production.up.railway.app/uploads/${item.image}` }}
            style={styles.cupcakeImage}
          />
          <View style={styles.cupcakeDetails}>
            <Text style={styles.cupcakeName}>{item.name}</Text>
            <Text style={styles.cupcakePrice}>R$ {item.price.toFixed(2)}</Text>
            <Text style={styles.cupcakeDescription}>{item.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DB7093" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      );
    }
  
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
  
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por cupcakes..."
          placeholderTextColor="#555"
          value={searchTerm}
          onChangeText={handleSearch}
        />
        {searchTerm.trim() === '' ? (
          <Text style={styles.emptyText}>Digite algo para buscar cupcakes.</Text>
        ) : filteredCupcakes.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum cupcake encontrado.</Text>
        ) : (
          <FlatList
            data={filteredCupcakes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
    backgroundColor: '#FFA3BE',
    paddingHorizontal: 20,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 80,
  },
  cupcakeItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    padding: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
  },
  cupcakeImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  cupcakeDetails: {
    flex: 1,
  },
  cupcakeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cupcakePrice: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cupcakeDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA3BE',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA3BE',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#DB7093',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
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

export default SearchScreen;