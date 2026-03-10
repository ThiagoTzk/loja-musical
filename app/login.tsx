import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { router } from "expo-router";
import { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login(){

const {colors}=useContext(ThemeContext);
const {login}=useContext(UsuarioContext);

const [email,setEmail]=useState("");
const [senha,setSenha]=useState("");
const [erro,setErro]=useState("");

function entrar(){

const resultado=login(email,senha);

if(resultado !== true){
setErro(resultado);
return;
}

router.replace("/(tabs)/perfil");
}

return(

<View style={[styles.container,{backgroundColor:colors.background}]}>

<Text style={[styles.titulo,{color:colors.text}]}>Login</Text>

<TextInput
placeholder="Email"
placeholderTextColor={colors.secondaryText}
style={[styles.input,{color:colors.text,borderColor:colors.text}]}
value={email}
onChangeText={setEmail}
/>

<TextInput
placeholder="Senha"
placeholderTextColor={colors.secondaryText}
secureTextEntry
style={[styles.input,{color:colors.text,borderColor:colors.text}]}
value={senha}
onChangeText={setSenha}
/>

{erro!=="" && (
<Text style={{color:"red"}}>{erro}</Text>
)}

<Pressable
style={[styles.botao,{backgroundColor:colors.accent}]}
onPress={entrar}
>
<Text>Entrar</Text>
</Pressable>

<Pressable onPress={()=>router.push("/cadastro")}>
<Text style={{color:colors.text,marginTop:20}}>
Criar conta
</Text>
</Pressable>

</View>
);
}

const styles=StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
padding:20
},

titulo:{
fontSize:26,
marginBottom:20
},

input:{
borderWidth:1,
padding:10,
marginBottom:10
},

botao:{
padding:15,
alignItems:"center",
marginTop:10
}

});