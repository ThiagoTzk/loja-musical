# Firestore - produtos

Crie a colecao `produtos` no Cloud Firestore.

## Documento `1`

- `ativo`: boolean `true`
- `categoria`: string `Cordas`
- `descricao`: string `Guitarra versatil para estudos, gravacoes caseiras e apresentacoes pequenas.`
- `imagemLocal`: string `1`
- `imagemUrl`: string vazio ou URL publica da imagem
- `nome`: string `Guitarra`
- `ordem`: number `1`
- `preco`: number `999.9`
- `precoTexto`: string `R$ 999,90`

## Documento `2`

- `ativo`: boolean `true`
- `categoria`: string `Vinil colecionavel`
- `descricao`: string `Edicao para colecionadores com arte marcante e acabamento premium.`
- `imagemLocal`: string `2`
- `imagemUrl`: string vazio ou URL publica da imagem
- `nome`: string `Album DAMN.`
- `ordem`: number `2`
- `preco`: number `499.9`
- `precoTexto`: string `R$ 499,90`

## Documento `3`

- `ativo`: boolean `true`
- `categoria`: string `Vinil importado`
- `descricao`: string `Disco para quem procura textura sonora quente e presenca de vitrine.`
- `imagemLocal`: string `3`
- `imagemUrl`: string vazio ou URL publica da imagem
- `nome`: string `Album Dtmf`
- `ordem`: number `3`
- `preco`: number `299.9`
- `precoTexto`: string `R$ 299,90`

## Documento `4`

- `ativo`: boolean `true`
- `categoria`: string `Edicao especial`
- `descricao`: string `Album de edicao especial para completar uma colecao musical autoral.`
- `imagemLocal`: string `4`
- `imagemUrl`: string vazio ou URL publica da imagem
- `nome`: string `Album RUBY`
- `ordem`: number `4`
- `preco`: number `799.9`
- `precoTexto`: string `R$ 799,90`

Observacao: quando `imagemUrl` estiver preenchido, o app usa a imagem do banco. Quando estiver vazio, o app usa a imagem local de fallback pelo campo `imagemLocal`.
