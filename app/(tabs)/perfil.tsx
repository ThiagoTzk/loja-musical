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

export default function Perfil() {

  const { colors } = useContext(ThemeContext);
  const { usuario, logout } = useContext(UsuarioContext);

  if (!usuario) {
    return (
      <SafeAreaView style={[styles.container,{backgroundColor:colors.background}]}>

        <Text style={[styles.titulo,{color:colors.text}]}>
          Perfil
        </Text>

        <Pressable
          style={[styles.botao,{backgroundColor:colors.accent}]}
          onPress={()=>router.push("/login")}
        >
          <Text>Login</Text>
        </Pressable>

        <Pressable
          style={[styles.botao,{backgroundColor:colors.accent}]}
          onPress={()=>router.push("/cadastro")}
        >
          <Text>Cadastro</Text>
        </Pressable>

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container,{backgroundColor:colors.background}]}>
      
      <ScrollView>

        <Text style={[styles.titulo,{color:colors.text}]}>
          Perfil
        </Text>

        <Text style={[styles.email,{color:colors.text}]}>
          {usuario.email}
        </Text>

        <Text style={[styles.subtitulo,{color:colors.text}]}>
          Histórico de compras
        </Text>

        {usuario.historico.map((item,index)=>(
          <View key={index} style={styles.itemHistorico}>

            <Image
              source={item.imagem}
              style={styles.imagem}
            />

            <View>
              <Text style={{color:colors.text}}>
                {item.nome}
              </Text>

              <Text style={{color:colors.text}}>
                {item.preco}
              </Text>
            </View>

          </View>
        ))}

        <Pressable
          style={[styles.botao,{backgroundColor:colors.accent}]}
          onPress={logout}
        >
          <Text>Sair</Text>
        </Pressable>

      </ScrollView>

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
marginBottom:10
},

email:{
fontSize:18,
marginBottom:20
},

subtitulo:{
fontSize:20,
marginTop:20,
marginBottom:10
},

itemHistorico:{
flexDirection:"row",
alignItems:"center",
marginBottom:15
},

imagem:{
width:60,
height:60,
marginRight:10,
resizeMode:"contain"
},

botao:{
padding:15,
borderRadius:8,
alignItems:"center",
marginTop:20
}

});