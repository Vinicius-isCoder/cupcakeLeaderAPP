import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';


type CartItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  quantity: number;
  image: string;
};

const CartScreen = ({ navigation }: any) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    };

    checkAuthentication();
  }, []);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cart');
        if (!response.ok) {
          throw new Error('Erro ao buscar itens do carrinho.');
        }
        const data = await response.json();
        setCartItems(data.cartItems);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const clearCart = async () => {
    Alert.alert(
      "Limpar Carrinho",
      "Tem certeza que deseja remover todos os itens do carrinho?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            try {
              const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/cart/clear', {
                method: 'DELETE',
              });
              if (!response.ok) {
                throw new Error('Erro ao limpar o carrinho.');
              }
              setCartItems([]);
              Alert.alert("Sucesso", "Carrinho limpo com sucesso.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar o carrinho.");
            }
          },
        },
      ]
    );
  };

  const finalizePurchase = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Usuário não autenticado",
        "Você precisa estar logado para finalizar a compra.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Fazer login", onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('userToken');
  
      const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cartItems }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar o histórico de pedidos.');
      }
  
      const clearCartResponse = await fetch('https://cupcakeleaderapp-production.up.railway.app/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!clearCartResponse.ok) {
        throw new Error('Erro ao limpar o carrinho.');
      }
  
      setCartItems([]);
  
      Alert.alert(
        "Compra finalizada com sucesso!",
        "Seus itens foram enviados para o histórico de pedidos."
      );
    } catch (error) {
      Alert.alert("Erro", (error as Error).message || "Erro ao finalizar a compra.");
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: `https://cupcakeleaderapp-production.up.railway.app/uploads/${item.image}` }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>Preço: R$ {item.price.toFixed(2)}</Text>
        <Text style={styles.cartItemQuantity}>Quantidade: {item.quantity}</Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: R$ {calculateTotal().toFixed(2)}</Text>
      </View>
    </View>
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
      <Text style={styles.title}>Seu Carrinho</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyCartText}>Seu carrinho está vazio.</Text>
      ) : (
        <>
          <FlatList
            data={[...cartItems].reverse()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cartList}
            ListFooterComponent={renderFooter}
          />
        </>
      )}
     
      {cartItems.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpar Carrinho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={finalizePurchase}
            style={styles.finalizeButton}
          >
            <Text style={styles.finalizeButtonText}>Finalizar Compra</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    backgroundColor: '#FFA3BE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  cartList: {
    paddingBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    padding: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  cartItemQuantity: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  footer: {
    marginTop: 10,
  },
  totalContainer: {
    padding: 10,
    backgroundColor: '#DB7093',
    borderRadius: 10,
    marginBottom: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  clearButton: {
    backgroundColor: '#FFA3BE',
    borderRadius: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
    flex: 1,
    marginRight: 5,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalizeButton: {
    backgroundColor: '#FFA3BE',
    borderColor: '#DB7093',
    borderWidth: 2,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  finalizeButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCartText: {
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

export default CartScreen;