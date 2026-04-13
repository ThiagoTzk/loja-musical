import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useContext, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const { colors } = useContext(ThemeContext);
  const { usuario, logout } = useContext(UsuarioContext);

  const [foto, setFoto] = useState<string | null>(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [tipoCamera, setTipoCamera] = useState<"front" | "back">("back");

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  async function tirarFoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setFoto(photo.uri);
      setMostrarCamera(false);
    }
  }

  function trocarCamera() {
    setTipoCamera((prev) => (prev === "back" ? "front" : "back"));
  }

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

        {/* FOTO */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.foto} />
          ) : (
            <View style={[styles.foto, { backgroundColor: colors.card }]} />
          )}

          <Pressable
            style={[styles.botao,{backgroundColor:colors.accent, marginTop:10}]}
            onPress={async () => {
              const status = await requestPermission();
              if (status.granted) {
                setMostrarCamera(true);
              }
            }}
          >
            <Text>Adicionar foto de perfil</Text>
          </Pressable>
        </View>

        <Text style={[styles.email,{color:colors.text}]}>
          {usuario.email}
        </Text>

        <Text style={[styles.subtitulo,{color:colors.text}]}>
          Histórico de compras
        </Text>

        {usuario.historico.map((item,index)=>(
          <View key={index} style={styles.itemHistorico}>
            <Image source={item.imagem} style={styles.imagem} />

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

      {/* MODAL CAMERA */}
      <Modal visible={mostrarCamera} animationType="slide">
        <View style={{ flex: 1 }}>

          <CameraView
            style={{ flex: 1 }}
            ref={cameraRef}
            facing={tipoCamera}
          />

          {/* BOTÃO TIRAR FOTO */}
          <Pressable
            style={styles.botaoCamera}
            onPress={tirarFoto}
          >
            <Text style={{ color: "#fff" }}>Tirar Foto</Text>
          </Pressable>

          {/* BOTÃO TROCAR CAMERA */}
          <Pressable
            style={[styles.botaoCamera, { bottom: 110 }]}
            onPress={trocarCamera}
          >
            <Text style={{ color: "#fff" }}>
              Trocar câmera
            </Text>
          </Pressable>

          {/* BOTÃO CANCELAR */}
          <Pressable
            style={[styles.botaoCamera, { backgroundColor: "red", bottom: 180 }]}
            onPress={() => setMostrarCamera(false)}
          >
            <Text style={{ color: "#fff" }}>Cancelar</Text>
          </Pressable>

        </View>
      </Modal>

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
  },

  foto:{
    width:120,
    height:120,
    borderRadius:60
  },

  botaoCamera:{
    position:"absolute",
    bottom:40,
    alignSelf:"center",
    backgroundColor:"black",
    padding:15,
    borderRadius:10
  }
});