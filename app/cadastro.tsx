import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { router } from "expo-router";
import { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Cadastro(){

const {colors}=useContext(ThemeContext);
const {cadastrar}=useContext(UsuarioContext);

const [email,setEmail]=useState("");
const [senha,setSenha]=useState("");
const [erro,setErro]=useState("");

function validarEmail(email:string){

if(!email.includes("@"))
return "Email precisa ter @";

if(!email.includes(".com"))
return "Email precisa ter .com";

return null;
}

function validarSenha(senha:string){

if(senha.length<6)
return "Senha precisa ter 6 caracteres";

if(!/[!@#$%&*()?/]/.test(senha))
return "Senha precisa ter símbolo";

return null;
}

function criarConta(){

const erroEmail=validarEmail(email);
if(erroEmail){
setErro(erroEmail);
return;
}

const erroSenha=validarSenha(senha);
if(erroSenha){
setErro(erroSenha);
return;
}

const resultado=cadastrar(email,senha);

if(resultado !== true){
setErro(resultado);
return;
}

router.replace("/(tabs)/perfil");
}

return(

<View style={[styles.container,{backgroundColor:colors.background}]}>

<Text style={[styles.titulo,{color:colors.text}]}>
Criar Conta
</Text>

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
onPress={criarConta}
>
<Text>Criar conta</Text>
</Pressable>

<Pressable onPress={()=>router.push("/login")}>
<Text style={{color:colors.text,marginTop:20}}>
Já tenho conta
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