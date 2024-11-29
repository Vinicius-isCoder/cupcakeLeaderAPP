import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, toZonedTime } from 'date-fns-tz';


import homeIcon from '../../../assets/images/Home.png';
import searchIcon from '../../../assets/images/lupa.png';
import cartIcon from '../../../assets/images/Carrinho.png';
import userIcon from '../../../assets/images/usuario.png';


type GroupedOrder = {
  purchase_id: string;
  created_at: string;
  items: {
    cupcake_name: string;
    quantity: number;
    total_price: number;
  }[];
};

const HistoryScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        const response = await fetch('https://cupcakeleaderapp-production.up.railway.app/orders/history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao buscar histórico de pedidos.');
        }

        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const renderGroup = ({ item }: { item: GroupedOrder }) => {
    const utcDate = new Date(item.created_at);
    const adjustedDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
    const formattedDate = format(adjustedDate, 'dd/MM/yyyy HH:mm');
  
    return (
      <View style={styles.orderGroup}>
        <Text style={styles.groupDate}>Data: {formattedDate}</Text>
        {item.items.map((order, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.cupcakeName}>{order.cupcake_name}</Text>
            <Text style={styles.orderDetails}>
              Quantidade: {order.quantity} | Total: R$ {order.total_price.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  

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
          <Text style={styles.retryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Pedidos</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não fez nenhum pedido.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderGroup}
          keyExtractor={(item) => item.purchase_id}
          contentContainerStyle={styles.list}
          ListFooterComponent={<View style={{ height: 20 }} />}
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
    padding: 20,
    backgroundColor: '#FFA3BE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  list: {
    paddingBottom: 10,
  },
  orderGroup: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderColor: '#DB7093',
    borderWidth: 2,
  },
  groupDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  cupcakeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  orderDetails: {
    fontSize: 12,
    color: '#777',
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

export default HistoryScreen;