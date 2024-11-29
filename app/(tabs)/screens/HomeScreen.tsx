import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import logo from '../../../assets/images/logo.png';
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

const HomeScreen = ({ navigation, route }: any) => {
  const [cupcakes, setCupcakes] = useState<Cupcake[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchCupcakes = async () => {
      try {
        const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cupcakes');
        const data = await response.json();
        setCupcakes(data.cupcakes);

        if (route.params?.focusCupcakeId) {
          const index = data.cupcakes.findIndex(
            (cupcake: Cupcake) => cupcake.id === route.params.focusCupcakeId
          );
          if (index !== -1) {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({
                y: index * 600, 
                animated: true,
              });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar cupcakes:', error);
      }
    };

    fetchCupcakes();
  }, [route.params?.focusCupcakeId]);

  const handleIncrement = (id: number) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const handleDecrement = (id: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 1) - 1, 1),
    }));
  };

  const handleAddToCart = async (id: number) => {
    const quantity = quantities[id] || 1;

    try {
        console.log(`Enviando requisição para adicionar ao carrinho:`, {
            cupcakeId: id,
            quantity,
        });

        const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cupcakeId: id,
                quantity,
            }),
        });

        const data = await response.json();
        console.log(`Resposta recebida:`, data);

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao adicionar item ao carrinho.');
        }

        Alert.alert(
            'Sucesso',
            `Adicionado ao carrinho: ${quantity}x ${
                cupcakes.find((cupcake) => cupcake.id === id)?.name
            }`
        );
    } catch (error) {
        console.error('Erro ao adicionar item ao carrinho:', error);
        Alert.alert(
            'Não foi possível adicionar o item ao carrinho. Tente novamente.'
        );
    }
};

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
          <Text style={styles.appName}>CupCakeLeader</Text>
        </View>
        <View style={styles.cupcakeList}>
          {cupcakes.map((cupcake) => (
            <View key={cupcake.id} style={styles.cupcakeItem}>
              <Image
                source={{ uri: `https://cupcakeleaderapp-production.up.railway.app/uploads/${cupcake.image}` }}
                style={styles.cupcakeImage}
              />
              <Text style={styles.cupcakeName}>{cupcake.name}</Text>
              <Text style={styles.cupcakeDescription}>{cupcake.description}</Text>
              <Text style={styles.cupcakePrice}>
                Preço: R$ {cupcake.price.toFixed(2)}
              </Text>
              <View style={styles.actionContainer}>
                <TouchableOpacity onPress={() => handleAddToCart(cupcake.id)}>
                  <Text style={styles.addToCartText}>Adicionar ao carrinho</Text>
                </TouchableOpacity>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => handleDecrement(cupcake.id)}>
                    <Text style={styles.quantityText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{quantities[cupcake.id] || 1}</Text>
                  <TouchableOpacity onPress={() => handleIncrement(cupcake.id)}>
                    <Text style={styles.quantityText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    marginTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  cupcakeList: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  cupcakeItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
    padding: 10,
    marginBottom: 20,
    width: '90%',
    alignItems: 'center',
  },
  cupcakeImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
  },
  cupcakeName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  cupcakeDescription: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '400',
    color: '#555',
    textAlign: 'center',
  },
  cupcakePrice: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    justifyContent: 'space-between',
    backgroundColor: '#DB7093',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  quantityText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: 'bold',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
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

export default HomeScreen;