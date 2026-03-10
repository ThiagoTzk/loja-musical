import { ThemeContext } from "@/src/context/ThemeContext";
import { useContext, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function Busca() {

  const { colors } = useContext(ThemeContext);
  const [busca, setBusca] = useState("");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <Text style={[styles.titulo, { color: colors.text }]}>
        Buscar Produtos
      </Text>

      <TextInput
        placeholder="Digite o nome do produto..."
        placeholderTextColor={colors.secondaryText}
        value={busca}
        onChangeText={setBusca}
        style={[
          styles.input,
          { borderColor: colors.secondaryText, color: colors.text }
        ]}
      />

      <ScrollView>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image
            source={require("../../assets/images/produto1.webp")}
            style={styles.imagem}
          />
          <View>
            <Text style={{ color: colors.text }}>Guitarra</Text>
            <Text style={{ color: colors.text }}>R$ 999,90</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image
            source={require("../../assets/images/produto2.webp")}
            style={styles.imagem}
          />
          <View>
            <Text style={{ color: colors.text }}>Produto 1</Text>
            <Text style={{ color: colors.text }}>R$ 499,90</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image
            source={require("../../assets/images/produto3.webp")}
            style={styles.imagem}
          />
          <View>
            <Text style={{ color: colors.text }}>Produto 2</Text>
            <Text style={{ color: colors.text }}>R$ 299,90</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image
            source={require("../../assets/images/produto4.webp")}
            style={styles.imagem}
          />
          <View>
            <Text style={{ color: colors.text }}>Produto 3</Text>
            <Text style={{ color: colors.text }}>R$ 799,90</Text>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15
  },

  imagem: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginRight: 10
  }

});