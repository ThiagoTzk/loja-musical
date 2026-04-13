export type Produto = {
  id: string;
  nome: string;
  preco: string;
  imagem: any;
};

export const produtos: Produto[] = [
  {
    id: "1",
    nome: "Guitarra",
    preco: "R$ 999,90",
    imagem: require("../../assets/images/produto1.webp"),
  },
  {
    id: "2",
    nome: "Album DAMN.",
    preco: "R$ 499,90",
    imagem: require("../../assets/images/produto2.webp"),
  },
  {
    id: "3",
    nome: "Album Dtmf",
    preco: "R$ 299,90",
    imagem: require("../../assets/images/produto3.webp"),
  },
  {
    id: "4",
    nome: "Album RUBY",
    preco: "R$ 799,90",
    imagem: require("../../assets/images/produto4.webp"),
  },
];