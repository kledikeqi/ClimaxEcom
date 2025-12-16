import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, 
  TouchableOpacity, StatusBar, Image, Modal, ScrollView, Linking, TextInput, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const API_URL = "http://192.168.1.6:8000"; // ip

export default function App() {
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI STATE
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  
  // view state (shop,wishlist,creators, contact)
  // 'shop', 'wishlist', 'deals', 'creators', 'contact'
  const [currentView, setCurrentView] = useState('shop'); 

  // modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // checkout state
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  // FETCH
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        setDisplayedProducts(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  // LOGIC

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    setCurrentView('shop');
    if (category === 'All') setDisplayedProducts(allProducts);
    else setDisplayedProducts(allProducts.filter(item => item.category === category));
  };

  const toggleWishlist = (product) => {
    const exists = wishlist.find(item => item.id === product.id);
    if (exists) {
        setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
        setWishlist([...wishlist, product]);
    }
  };

  const addToCart = (product, size) => {
    if (!size) { Alert.alert("Hold up!", "Please select a size first."); return; }
    setCart([...cart, { ...product, selectedSize: size }]);
    setSelectedProduct(null);
    Alert.alert("Success", "Added to cart");
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
        const raw = parseInt(item.price.replace(/[^0-9]/g, ''));
        total += raw;
    });
    return total;
  };

  const submitOrder = async () => {
    if(!formData.name || !formData.address || !formData.phone) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
    }
    const orderPayload = {
        customer_name: formData.name,
        address: formData.address,
        phone: formData.phone,
        total_price: calculateTotal(),
        items: cart
    };
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const result = await response.json();
        if (result.status === 'success') {
            Alert.alert("ORDER CONFIRMED", `Order #${result.order_id} placed successfully!`);
            setCart([]); 
            setCheckoutStep(1); 
            setFormData({ name: '', address: '', phone: '' });
            setCartOpen(false);
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Server connection failed.");
    }
  };

  // NAVIGATION HELPER
  const navigateTo = (view) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  // COMPONENT PARTS

  const renderHeader = () => (
    <View style={styles.header}>
      {/* MENU BUTTON */}
      <TouchableOpacity onPress={() => setMenuOpen(true)} style={{padding: 5}}>
        <Ionicons name="menu" size={30} color="white" />
      </TouchableOpacity>
      
      <Image source={require('./assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
      
      {/* CART BUTTON */}
      <TouchableOpacity style={styles.cartBtn} onPress={() => setCartOpen(true)}>
        <Ionicons name="cart" size={28} color="white" />
        {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cart.length}</Text></View>}
      </TouchableOpacity>
    </View>
  );

  const ProductCard = ({ item }) => {
    const isWishlisted = wishlist.find(w => w.id === item.id);
    return (
      <TouchableOpacity style={styles.cardContainer} onPress={() => {setSelectedProduct(item); setSelectedSize(null);}} activeOpacity={0.9}>
        <LinearGradient colors={['#1e1e24', '#0d0d0d']} style={styles.card}>
            
            {/* BADGE */}
            {item.badge && (
                <View style={[styles.cardBadge, {backgroundColor: '#D32F2F'}]}>
                    <Text style={styles.cardBadgeText}>{item.badge}</Text>
                </View>
            )}

            {/* WISHLIST HEART ICON */}
            <TouchableOpacity style={styles.heartBtn} onPress={() => toggleWishlist(item)}>
                <Ionicons 
                    name={isWishlisted ? "heart" : "heart-outline"} 
                    size={22} 
                    color={isWishlisted ? "#D32F2F" : "white"} 
                />
            </TouchableOpacity>

            <LinearGradient colors={item.colors || ['#333', '#444']} style={styles.imagePlaceholder} />
            <View style={styles.textContainer}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price}</Text>
            </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // VIEW RENDERS

  const renderShop = () => (
    <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={
            <View>
                <LinearGradient colors={['#1a0505', '#000000']} style={styles.heroContainer}>
                    <Text style={styles.heroTitle}>REDEFINE <Text style={{color: '#D32F2F'}}>DARKNESS</Text></Text>
                    <Text style={styles.heroSubtitle}>Premium Gothic & Streetwear from Tirana.</Text>
                </LinearGradient>
                <View style={styles.catWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContainer}>
                        {['All', 'Hoodies', 'Pants', 'Jewelry', 'Jackets'].map((cat) => (
                            <TouchableOpacity key={cat} style={[styles.catButton, selectedCategory === cat && styles.catButtonActive]} onPress={() => filterByCategory(cat)}>
                                <Text style={[styles.catText, selectedCategory === cat && {color: 'white'}]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ProductCard item={item} />}
    />
  );

  const renderWishlist = () => (
    <View style={{flex:1, padding:10}}>
        <Text style={styles.pageTitle}>MY WISHLIST ({wishlist.length})</Text>
        {wishlist.length === 0 ? (
            <Text style={{color:'grey', textAlign:'center', marginTop:50}}>No items saved yet.</Text>
        ) : (
            <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => <ProductCard item={item} />}
            />
        )}
    </View>
  );

  const renderCreators = () => (
    <ScrollView style={styles.pageContent}>
      <Text style={styles.pageTitle}>THE TEAM</Text>
      <View style={styles.teamGrid}>
        {[
            {name: "Kledi", role: "Lead Dev", desc: "Ecommerce Architect"},
            {name: "Orgito", role: "Fashion Designer", desc: "Visionary"},
            {name: "Klea", role: "Graphic Designer", desc: "Visuals"},
            {name: "Abi", role: "Graphic Designer", desc: "Creative Dir."}
        ].map((m, i) => (
            <LinearGradient key={i} colors={['#222', '#111']} style={styles.teamCard}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{m.name[0]}</Text></View>
                <Text style={styles.teamName}>{m.name}</Text>
                <Text style={styles.teamRole}>{m.role}</Text>
            </LinearGradient>
        ))}
      </View>
    </ScrollView>
  );

  const renderContact = () => (
    <ScrollView style={styles.pageContent}>
      <Text style={styles.pageTitle}>CONTACT</Text>
      <View style={styles.contactContainer}>
        <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+355699810385')}>
            <Ionicons name="call" size={24} color="#D32F2F" />
            <Text style={styles.contactValue}>+355 69 981 0385</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:climax.store.al@gmail.com')}>
            <Ionicons name="mail" size={24} color="#D32F2F" />
            <Text style={styles.contactValue}>climax.store.al@gmail.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#1a0505']} style={styles.background} />
      
      <SafeAreaView style={{flex:1}}>
        {renderHeader()}
        
        {loading ? <ActivityIndicator size="large" color="#D32F2F" style={{marginTop:50}}/> : (
            <View style={{flex:1}}>
                {currentView === 'shop' && renderShop()}
                {currentView === 'wishlist' && renderWishlist()}
                {currentView === 'creators' && renderCreators()}
                {currentView === 'contact' && renderContact()}
            </View>
        )}
      </SafeAreaView>

      {/* MENU MODAL */}
      <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.sidebar}>
                <TouchableOpacity onPress={() => setMenuOpen(false)} style={{alignSelf:'flex-end', marginBottom:20}}>
                    <Ionicons name="close" size={30} color="white"/>
                </TouchableOpacity>
                
                <Image source={require('./assets/logo.png')} style={styles.sidebarLogo} resizeMode="contain" />
                
                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('shop')}>
                    <Ionicons name="shirt-outline" size={20} color="white" style={{marginRight:10}}/>
                    <Text style={styles.menuText}>SHOP COLLECTION</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('wishlist')}>
                    <Ionicons name="heart-outline" size={20} color="white" style={{marginRight:10}}/>
                    <Text style={styles.menuText}>MY WISHLIST</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => {setMenuOpen(false); setCartOpen(true);}}>
                    <Ionicons name="cart-outline" size={20} color="white" style={{marginRight:10}}/>
                    <Text style={styles.menuText}>MY CART</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('creators')}>
                    <Ionicons name="people-outline" size={20} color="white" style={{marginRight:10}}/>
                    <Text style={styles.menuText}>CREATORS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('contact')}>
                    <Ionicons name="call-outline" size={20} color="white" style={{marginRight:10}}/>
                    <Text style={styles.menuText}>CONTACT US</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={{flex:1}} onPress={() => setMenuOpen(false)} />
        </View>
      </Modal>

      {/* CART/CHECKOUT MODAL */}
      <Modal visible={isCartOpen} animationType="slide" onRequestClose={() => setCartOpen(false)}>
        <View style={{flex:1, backgroundColor:'#111'}}>
            <SafeAreaView style={{flex:1}}>
                <View style={styles.cartHeader}>
                    <Text style={styles.pageTitle}>{checkoutStep === 1 ? "YOUR CART" : "CHECKOUT"}</Text>
                    <TouchableOpacity onPress={() => setCartOpen(false)}><Ionicons name="close" size={30} color="white"/></TouchableOpacity>
                </View>

                {checkoutStep === 1 ? (
                    <>
                        <ScrollView style={{padding:20}}>
                            {cart.length === 0 ? <Text style={{color:'grey', textAlign:'center', marginTop:50}}>Cart is empty</Text> : (
                                cart.map((item, i) => (
                                    <View key={i} style={styles.cartItem}>
                                        <View>
                                            <Text style={{color:'white', fontWeight:'bold'}}>{item.name}</Text>
                                            <Text style={{color:'grey', fontSize:12}}>Size: {item.selectedSize}</Text>
                                        </View>
                                        <Text style={{color:'#D32F2F'}}>{item.price}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        {cart.length > 0 && (
                            <View style={styles.checkoutBox}>
                                <Text style={styles.totalText}>Total: {calculateTotal().toLocaleString()} LEK</Text>
                                <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutStep(2)}>
                                    <Text style={styles.checkoutBtnText}>PROCEED TO ORDER</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    <ScrollView style={{padding:20}}>
                        <Text style={styles.formLabel}>FULL NAME</Text>
                        <TextInput style={styles.input} placeholderTextColor="#555" placeholder="Kledi Keqi" value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})}/>
                        <Text style={styles.formLabel}>ADDRESS</Text>
                        <TextInput style={styles.input} placeholderTextColor="#555" placeholder="Tirana, Albania" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})}/>
                        <Text style={styles.formLabel}>PHONE</Text>
                        <TextInput style={styles.input} placeholderTextColor="#555" placeholder="+355 69..." keyboardType="phone-pad" value={formData.phone} onChangeText={(t) => setFormData({...formData, phone: t})}/>
                        <TouchableOpacity style={styles.checkoutBtn} onPress={submitOrder}>
                            <Text style={styles.checkoutBtnText}>CONFIRM ORDER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginTop:20, alignSelf:'center'}} onPress={() => setCheckoutStep(1)}><Text style={{color:'grey'}}>Back</Text></TouchableOpacity>
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
      </Modal>

      {/* PRODUCT DETAIL MODAL */}
      <Modal visible={selectedProduct !== null} animationType="slide" transparent onRequestClose={() => setSelectedProduct(null)}>
        <View style={styles.modalOverlayBottom}>
            <View style={styles.productModal}>
                {selectedProduct && (
                    <>
                        <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedProduct(null)}><Ionicons name="close" size={28} color="white" /></TouchableOpacity>
                        <LinearGradient colors={selectedProduct.colors || ['#333','#444']} style={styles.modalImage} />
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                            <Text style={styles.modalPrice}>{selectedProduct.price}</Text>
                            <Text style={styles.modalDesc}>{selectedProduct.description}</Text>
                            <Text style={styles.sectionHeader}>SELECT SIZE</Text>
                            <View style={styles.sizeRow}>
                                {selectedProduct.sizes.map(size => (
                                    <TouchableOpacity key={size} style={[styles.sizeBtn, selectedSize === size && styles.sizeBtnActive]} onPress={() => setSelectedSize(size)}>
                                        <Text style={[styles.sizeText, selectedSize === size && {color:'white'}]}>{size}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.modalAddBtn} onPress={() => addToCart(selectedProduct, selectedSize)}>
                                <Text style={styles.modalAddText}>ADD TO CART</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: 'black' },
  background: { position: 'absolute', width:'100%', height:'100%' },
  header: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', padding:15, backgroundColor:'rgba(0,0,0,0.8)' },
  logoImage: { width: 120, height: 40 },
  cartBtn: { position:'relative' },
  badge: { position:'absolute', right:-5, top:-5, backgroundColor:'#D32F2F', width:18, height:18, borderRadius:9, justifyContent:'center', alignItems:'center' },
  badgeText: { color:'white', fontSize:10, fontWeight:'bold' },
  
  // HERO & CATS
  heroContainer: { padding: 25, borderBottomWidth:1, borderColor:'#222' },
  heroTitle: { color:'white', fontSize:28, fontWeight:'900', fontStyle:'italic' },
  heroSubtitle: { color:'#aaa', marginTop:5 },
  catWrapper: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10 },
  catContainer: { paddingHorizontal: 15 },
  catButton: { paddingHorizontal: 20, paddingVertical: 8, marginRight: 10, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth:1, borderColor:'#333' },
  catButtonActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  catText: { color: '#888', fontWeight: 'bold' },

  // LIST & CARDS
  listContent: { paddingHorizontal: 10, paddingBottom: 100 },
  cardContainer: { flex: 1, margin: 6 },
  card: { borderRadius: 12, padding: 8, alignItems: 'center', borderWidth:1, borderColor:'#222', backgroundColor:'#121212', position:'relative' },
  cardBadge: { position:'absolute', top:8, left:8, zIndex:10, paddingHorizontal:8, paddingVertical:4, borderRadius:4 },
  cardBadgeText: { color:'white', fontSize:10, fontWeight:'bold' },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 20 },
  imagePlaceholder: { width: '100%', height: 140, borderRadius: 8, marginBottom: 10 },
  textContainer: { width: '100%', paddingHorizontal:5 },
  productName: { color: 'white', fontWeight: 'bold', fontSize: 13, marginBottom:2 },
  productPrice: { color: '#D32F2F', fontSize: 12, fontWeight:'bold' },

  // PAGES
  pageTitle: { color:'white', fontSize:26, fontWeight:'900', marginBottom:20, marginTop:10, textAlign:'center' },
  pageContent: { padding:20 },
  teamGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  teamCard: { width:'48%', padding:15, borderRadius:10, marginBottom:15, alignItems:'center', borderWidth:1, borderColor:'#333' },
  avatar: { width:50, height:50, borderRadius:25, backgroundColor:'#D32F2F', justifyContent:'center', alignItems:'center', marginBottom:10 },
  avatarText: { color:'white', fontWeight:'bold', fontSize:20 },
  teamName: { color:'white', fontWeight:'bold', fontSize:16 },
  teamRole: { color:'#888', fontSize:12 },
  contactContainer: { backgroundColor:'#111', padding:20, borderRadius:15 },
  contactRow: { flexDirection:'row', alignItems:'center', marginBottom:25 },
  contactValue: { color:'white', fontSize:16, marginLeft:15, fontWeight:'bold' },

  // MENUS & MODALS
  modalOverlay: { flex:1, flexDirection:'row', backgroundColor:'rgba(0,0,0,0.8)' },
  modalOverlayBottom: { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.8)' },
  sidebar: { width:'75%', backgroundColor:'#050505', padding:20, paddingTop:50, borderRightWidth:1, borderColor:'#333' },
  sidebarLogo: { width:150, height:50, alignSelf:'center', marginBottom:40 },
  menuItem: { paddingVertical:15, borderBottomWidth:1, borderColor:'#222', flexDirection:'row', alignItems:'center' },
  menuText: { color:'white', fontSize:16, fontWeight:'bold', letterSpacing:1 },

  // CART & CHECKOUT
  cartHeader: { padding:20, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderColor:'#333' },
  cartItem: { flexDirection:'row', justifyContent:'space-between', padding:15, backgroundColor:'#222', borderRadius:10, marginBottom:10 },
  checkoutBox: { padding:20, borderTopWidth:1, borderColor:'#333' },
  totalText: { color:'white', fontSize:20, fontWeight:'bold', marginBottom:10 },
  checkoutBtn: { backgroundColor:'#D32F2F', padding:15, borderRadius:10, alignItems:'center', marginTop: 10 },
  checkoutBtnText: { color:'white', fontWeight:'bold', fontSize:16 },
  formLabel: { color: '#888', fontWeight:'bold', marginTop: 20, marginBottom: 8, fontSize: 12 },
  input: { backgroundColor: '#222', color: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 16 },

  // PRODUCT MODAL
  productModal: { height:'75%', backgroundColor:'#111', borderTopLeftRadius:20, borderTopRightRadius:20, overflow:'hidden' },
  modalImage: { width:'100%', height:250 },
  closeModal: { position:'absolute', top:20, right:20, zIndex:10, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:20, padding:5 },
  modalContent: { padding:25, flex:1 },
  modalTitle: { color:'white', fontSize:24, fontWeight:'bold' },
  modalPrice: { color:'#D32F2F', fontSize:22, fontWeight:'bold' },
  modalDesc: { color:'#ccc', marginTop:15, lineHeight:20 },
  sectionHeader: { color:'#888', fontWeight:'bold', marginTop:20, marginBottom:10 },
  sizeRow: { flexDirection:'row', gap:10 },
  sizeBtn: { width:40, height:40, borderRadius:20, borderWidth:1, borderColor:'#444', justifyContent:'center', alignItems:'center' },
  sizeBtnActive: { backgroundColor:'#D32F2F', borderColor:'#D32F2F' },
  sizeText: { color:'#888', fontWeight:'bold' },
  modalAddBtn: { backgroundColor:'#D32F2F', padding:15, borderRadius:10, alignItems:'center', marginTop:'auto', marginBottom:20 },
  modalAddText: { color:'white', fontWeight:'bold', fontSize:16, letterSpacing:1 },
});