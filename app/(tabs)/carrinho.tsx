import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { router } from "expo-router";
import { useContext } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Carrinho(){

  const { colors } = useContext(ThemeContext);
  const { carrinho, removerProduto } = useContext(CarrinhoContext);
  const { usuario } = useContext(UsuarioContext);

  function finalizarCompra(){
    if(!usuario){
      router.push("/login");
      return;
    }

    router.push("/pagamento");
  }

  const total = carrinho.reduce((acc, item) => {
    const preco = parseFloat(item.preco.replace("R$", "").replace(",", "."));
    return acc + preco;
  }, 0);

  return(

    <SafeAreaView style={[styles.container,{backgroundColor:colors.background}]}>

      <Text style={[styles.titulo,{color:colors.text}]}>
        Carrinho
      </Text>

      <ScrollView>

        {carrinho.length === 0 && (
          <Text style={{color:colors.text}}>
            Carrinho vazio
          </Text>
        )}

        {carrinho.map((item,index)=>(

          <View key={index} style={styles.produto}>

            <Image
              source={item.imagem}
              style={styles.imagem}
            />

            <View style={styles.infoProduto}>

              <Text style={{color:colors.text}}>
                {item.nome}
              </Text>

              <Text style={{color:colors.text}}>
                {item.preco}
              </Text>

            </View>

            <Pressable onPress={()=>removerProduto(index)}>
              <Text style={{color:"red"}}>
                Remover
              </Text>
            </Pressable>

          </View>

        ))}

      </ScrollView>

      {carrinho.length > 0 && (

        <>
          <View style={styles.totalContainer}>
            <Text style={[styles.total,{color:colors.text}]}>
              Total: R$ {total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={[styles.botao,{backgroundColor:colors.accent}]}
            onPress={finalizarCompra}
          >
            <Text style={styles.textoBotao}>
              Finalizar compra
            </Text>
          </Pressable>
        </>

      )}

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    padding:20
  },

  titulo:{
    fontSize:26,
    fontWeight:"bold",
    marginBottom:20
  },

  produto:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:20
  },

  imagem:{
    width:60,
    height:60,
    resizeMode:"contain",
    marginRight:10
  },

  infoProduto:{
    flex:1
  },

  totalContainer:{
    marginTop:20,
    marginBottom:10
  },

  total:{
    fontSize:20,
    fontWeight:"bold"
  },

  botao:{
    padding:18,
    borderRadius:10,
    alignItems:"center"
  },

  textoBotao:{
    fontWeight:"bold"
  }

});