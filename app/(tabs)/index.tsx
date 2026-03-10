import { ThemeContext } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Home() {
  const { colors, theme, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.accent }]}>
          BlackTone Music
        </Text>

        <Pressable onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons
            name={theme === "dark" ? "sunny" : "moon"}
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.productsContainer}>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push("/produto/1")}
        >
          <Image
            source={require("../../assets/images/produto1.webp")}
            style={styles.image}
          />
          <Text style={[styles.productName, { color: colors.text }]}>
            Guitarra
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            R$ 999,90
          </Text>
          <Text style={[styles.installment, { color: colors.secondaryText }]}>
            10x sem juros no cartão
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push("/produto/2")}
        >
          <Image
            source={require("../../assets/images/produto2.webp")}
            style={styles.image}
          />
          <Text style={[styles.productName, { color: colors.text }]}>
            Produto 1
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            R$ 499,90
          </Text>
          <Text style={[styles.installment, { color: colors.secondaryText }]}>
            10x sem juros no cartão
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push("/produto/3")}
        >
          <Image
            source={require("../../assets/images/produto3.webp")}
            style={styles.image}
          />
          <Text style={[styles.productName, { color: colors.text }]}>
            Produto 2
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            R$ 299,90
          </Text>
          <Text style={[styles.installment, { color: colors.secondaryText }]}>
            10x sem juros no cartão
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push("/produto/4")}
        >
          <Image
            source={require("../../assets/images/produto4.webp")}
            style={styles.image}
          />
          <Text style={[styles.productName, { color: colors.text }]}>
            Produto 3
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            R$ 799,90
          </Text>
          <Text style={[styles.installment, { color: colors.secondaryText }]}>
            10x sem juros no cartão
          </Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },

  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },

  themeButton: {
    position: "absolute",
    right: 20,
  },

  productsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingBottom: 20,
  },

  card: {
    width: "45%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  price: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },

  installment: {
    fontSize: 12,
    marginTop: 4,
  },
});