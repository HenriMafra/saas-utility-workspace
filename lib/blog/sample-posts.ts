export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cluster: string;
  keyword: string;
  published: boolean;
  published_at: string;
}

export const SAMPLE_POSTS: BlogPost[] = [
  {
    slug: "como-comprimir-pdf-sem-perder-qualidade",
    title: "Como comprimir PDF sem perder qualidade — guia completo",
    excerpt:
      "Aprenda as melhores técnicas para reduzir o tamanho de PDFs sem comprometer a legibilidade. Veja quando usar compressão no navegador e quando usar ferramentas avançadas.",
    cluster: "pdf",
    keyword: "comprimir pdf",
    published: true,
    published_at: "2025-11-10T10:00:00.000Z",
    body: `
## Por que comprimir PDFs?

PDFs gerados por scanners ou com imagens de alta resolução podem facilmente passar de 20 MB. Isso dificulta o envio por e-mail, o armazenamento em nuvem e o carregamento em dispositivos móveis.

## Métodos disponíveis

### 1. Compressão no navegador (recomendado para arquivos ≤ 25 MB)

A Praticca usa a biblioteca PDF.js para reprocessar o arquivo diretamente no seu computador — **nenhum dado sai do dispositivo**. É ideal para documentos pessoais como contratos e declarações.

### 2. Compressão com reescala de imagens

Para PDFs com muitas fotos, reduzir a resolução das imagens internas de 300 DPI para 150 DPI costuma diminuir o arquivo em 50–70% sem perda perceptível na tela.

### 3. Remoção de metadados

Miniaturas, histórico de edições e fontes incorporadas desnecessárias podem adicionar MBs silenciosamente. Ferramentas avançadas permitem limpar esses dados.

## Dicas práticas

- Para enviar por WhatsApp: comprima até 16 MB.
- Para enviar por e-mail corporativo: limite comum é 10 MB.
- Para imprimir: mantenha pelo menos 150 DPI nas imagens.

## Como usar a Praticca para comprimir PDF

1. Acesse [Comprimir PDF](/ferramentas/comprimir-pdf).
2. Arraste seu arquivo ou clique para selecionar.
3. Escolha o nível de compressão.
4. Clique em **Processar** e depois em **Baixar**.

O arquivo processado fica disponível por 1 hora e é apagado automaticamente.

## Conclusão

A compressão no navegador é a opção mais privada e rápida para a maioria dos casos. Se precisar de controle granular sobre imagens e metadados, use ferramentas dedicadas como o Ghostscript.
    `.trim(),
  },
  {
    slug: "remover-fundo-de-imagem-guia-pratico",
    title: "Remover fundo de imagem: guia prático para iniciantes",
    excerpt:
      "Saiba como tirar o fundo de fotos para criar imagens com transparência, ideais para logotipos, produtos e redes sociais — sem instalar nada.",
    cluster: "imagem",
    keyword: "remover fundo de imagem",
    published: true,
    published_at: "2025-11-25T14:00:00.000Z",
    body: `
## Para que serve remover o fundo?

Imagens com fundo transparente (formato PNG) são essenciais para:

- **E-commerce**: fotos de produto sobre fundo branco ou colorido.
- **Apresentações**: inserir pessoas ou objetos em slides sem o fundo indesejado.
- **Logotipos**: garantir que a marca fique bem em qualquer cor de plano de fundo.
- **Redes sociais**: criar conteúdo visual limpo e profissional.

## Como funciona a remoção automática

Modelos modernos de segmentação (como o BRIA RMBG) identificam a "saliência" da imagem — os pixels que pertencem ao objeto principal — e tornam o restante transparente. O resultado é salvo como PNG.

A Praticca roda esse modelo **diretamente no seu navegador** usando WebAssembly e ONNX Runtime, então suas fotos nunca saem do dispositivo.

## Passo a passo na Praticca

1. Acesse [Remover Fundo](/ferramentas/remover-fundo).
2. Envie sua imagem (JPG, PNG ou WebP, até 15 MB).
3. Aguarde o processamento — leva de 2 a 5 segundos.
4. Baixe a imagem em PNG com fundo transparente.

## Dicas para melhores resultados

- **Contraste alto** entre o objeto e o fundo melhora muito a precisão.
- Fundos muito parecidos com o objeto (ex.: camiseta branca em fundo branco) podem ter bordas imprecisas.
- Para ajustes finos, use um editor como o Photopea após a remoção.

## Quando a remoção automática não basta

Para fios de cabelo muito finos, vidro translúcido ou fumaça, a remoção manual (máscara a pincel) ainda oferece resultados superiores. Mas para 80% dos casos cotidianos, a remoção automática já entrega um ótimo resultado.
    `.trim(),
  },
  {
    slug: "validar-cnpj-e-cpf-online-como-funciona",
    title: "Como validar CPF e CNPJ online — e por que o dígito verificador existe",
    excerpt:
      "Entenda o algoritmo por trás da validação de CPF e CNPJ, saiba a diferença entre um número válido e um número real, e veja como usar a Praticca para validar ou gerar dados de teste.",
    cluster: "validacao",
    keyword: "validar cpf cnpj",
    published: true,
    published_at: "2025-12-05T09:00:00.000Z",
    body: `
## O que é o dígito verificador?

Tanto o CPF (11 dígitos) quanto o CNPJ (14 dígitos) possuem dígitos verificadores — os dois últimos números — calculados a partir dos anteriores usando o **algoritmo de módulo 11**. Esse mecanismo detecta erros de digitação sem precisar consultar uma base de dados.

## CPF: como funciona a validação

1. Multiplique os 9 primeiros dígitos pelos pesos 10, 9, 8 … 2.
2. Calcule o resto da divisão da soma por 11.
3. Se o resto for < 2, o primeiro dígito verificador é 0; senão, é 11 − resto.
4. Repita o processo com os 10 primeiros dígitos (incluindo o primeiro verificador) e pesos 11 a 2.

CPFs com todos os dígitos iguais (111.111.111-11, por exemplo) **falham** na validação mesmo que o algoritmo resultasse em número válido.

## CNPJ: diferenças em relação ao CPF

O CNPJ usa os pesos 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 na primeira etapa e 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 na segunda.

## Número válido ≠ número real

Um número que passa no algoritmo **não garante** que existe na Receita Federal. Para checar se um CPF ou CNPJ está ativo, é necessário consultar as APIs oficiais — o que exige autenticação e não é oferecido por ferramentas gratuitas.

## Como usar a Praticca para validar

1. Acesse [Validador e Gerador](/ferramentas/validador-gerador).
2. Selecione a aba **CPF** ou **CNPJ**.
3. Digite o número (com ou sem pontuação).
4. O resultado aparece instantaneamente, sem enviar dados para servidor.

## Geração de dados de teste

Precisa de CPFs ou CNPJs válidos para preencher formulários de desenvolvimento? A Praticca gera números que passam na validação do algoritmo — ideais para testes em ambientes de homologação.

> **Atenção:** usar CPF ou CNPJ de terceiros sem autorização é crime. Use apenas números gerados para fins de teste.
    `.trim(),
  },
];
