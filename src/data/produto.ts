import { ImageSourcePropType } from "react-native";

export type Produto = {
  id: string;
  nome: string;
  preco: string;
  precoNumero?: number;
  categoria: string;
  descricao: string;
  imagem: ImageSourcePropType;
  imagemLocal?: string;
  imagemUrl?: string;
};

const imagensLocais: Record<string, ImageSourcePropType> = {
  "1": require("../../assets/images/produto1.webp"),
  "2": require("../../assets/images/produto2.webp"),
  "3": require("../../assets/images/produto3.webp"),
  "4": require("../../assets/images/produto4.webp"),
  "5": require("../../assets/images/produto5.webp"),
};

export function resolverImagemProduto(id: string, imagemUrl?: string) {
  if (imagemUrl) {
    return { uri: imagemUrl };
  }

  return imagensLocais[id] ?? imagensLocais["1"];
}

export const produtos: Produto[] = [
  {
    id: "1",
    nome: "Guitarra",
    preco: "R$ 999,90",
    precoNumero: 999.9,
    categoria: "Cordas",
    descricao:
      "Guitarra versatil para estudos, gravacoes caseiras e apresentacoes pequenas.",
    imagem: resolverImagemProduto("1"),
    imagemLocal: "1",
  },
  {
    id: "2",
    nome: "Album DAMN.",
    preco: "R$ 499,90",
    precoNumero: 499.9,
    categoria: "Vinil colecionavel",
    descricao:
      "Edicao para colecionadores com arte marcante e acabamento premium.",
    imagem: resolverImagemProduto("2"),
    imagemLocal: "2",
  },
  {
    id: "3",
    nome: "Album Dtmf",
    preco: "R$ 299,90",
    precoNumero: 299.9,
    categoria: "Vinil importado",
    descricao:
      "Disco para quem procura textura sonora quente e presenca de vitrine.",
    imagem: resolverImagemProduto("3"),
    imagemLocal: "3",
  },
  {
    id: "4",
    nome: "Album RUBY",
    preco: "R$ 799,90",
    precoNumero: 799.9,
    categoria: "Edicao especial",
    descricao:
      "Album de edicao especial para completar uma colecao musical autoral.",
    imagem: resolverImagemProduto("4"),
    imagemLocal: "4",
  },
];
