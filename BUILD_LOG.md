# Build Log — Matrix Rain

## Entrada 1 — Solicitação e inspeção inicial

- **Prompt / Solicitação:** Criar um efeito Matrix Rain usando Expo, começar com renderização baseada em CPU, tornar caracteres, cores, fontes e velocidades aleatórios e documentar decisões e problemas de desenvolvimento neste arquivo.
- **Resumo da decisão:** Usar Expo com React Native e componentes de texto animados; não introduzir Canvas, WebGL ou dependências de renderização por GPU na implementação inicial.
- **Ações Realizadas:** Inspecionei a pasta de trabalho e procurei configurações, código existente, documentação e um build log anterior.
- **Resultado:** A pasta estava vazia. Não havia framework, dependências ou comportamento existente a preservar; a implementação será criada como um projeto Expo independente.
- **Problemas / Erros:** Nenhum.
- **Correções tentadas:** Nenhuma necessária.

## Entrada 2 — Implementação da primeira versão

- **Prompt / Solicitação:** Implementar o efeito em Expo, com aleatoriedade para caracteres, cores, fontes e velocidades, mantendo a primeira implementação em CPU e documentando o processo.
- **Resumo da decisão:** Criar um aplicativo Expo com React Native e TypeScript, sem bibliotecas de gráficos. Cada fluxo usa texto React Native e `Animated` anima sua transformação no driver JavaScript (`useNativeDriver: false`), sem Canvas, WebGL ou shaders. Os glifos continuam sendo elementos de texto da plataforma. A proposta foi escolhida como uma referência simples em CPU, não como uma comparação de desempenho já medida.
- **Ações Realizadas:** Adicionei a configuração Expo e os comandos para Android, iOS e web; implementei fluxos de caracteres com comprimentos, posições iniciais, velocidades, cores, caracteres e fontes escolhidos via `Math.random()`; incluí renovação periódica dos glifos, controles de pausa/retomada e geração de um novo conjunto; escrevi instruções de execução e resumo técnico no README.
- **Resultado:** A primeira versão do aplicativo Expo está implementada. Cada coluna recebe uma trajetória e duração próprias; caracteres, cor, fonte, tamanho e opacidade variam, e os estilos dos glifos são parcialmente renovados ao longo da animação. A interface identifica o modo CPU e oferece controles acessíveis.
- **Problemas / Erros:** A primeira checagem de compatibilidade do Expo informou que `react-native@0.81.4` não é a versão indicada para o SDK 54, que espera `0.81.5`. A checagem TypeScript passou antes desse ajuste. A instalação inicial também reportou avisos de dependências transitivas obsoletas e vulnerabilidades no conjunto instalado; não apliquei correções automáticas que poderiam alterar dependências sem relação direta com a compatibilidade do SDK.
- **Correções tentadas:** Atualizei a versão declarada do React Native para `0.81.5`, conforme a indicação do Expo; a checagem seguinte confirmou a compatibilidade. Durante a revisão da abordagem de CPU, substituí o driver nativo pelo driver JavaScript, para que as atualizações de posição também sejam processadas pelo JavaScript, e não apenas a composição dos glifos. A exportação web inicial e a checagem TypeScript passaram antes dessa última alteração; uma validação final está pendente.

## Entrada 3 — Validação final e aderência ao modo CPU

- **Prompt / Solicitação:** Garantir que a primeira implementação use apenas renderização baseada em CPU e documentar as decisões e os problemas do desenvolvimento.
- **Resumo da decisão:** Usar `useNativeDriver: false` para a animação das transformações; assim, a própria animação também usa o driver JavaScript, tornando explícita a abordagem de referência em CPU.
- **Ações Realizadas:** Revisei a estratégia de animação à luz da restrição de CPU, atualizei o código e o README e repeti as verificações após a troca do driver.
- **Resultado:** As validações finais passaram: `npm run typecheck`, `npx expo install --check` e `npx expo export --platform web`. A exportação web gerou o bundle e o HTML de entrada sem erros. A implementação final usa o driver JavaScript para as transformações e não adiciona Canvas, WebGL ou bibliotecas gráficas.
- **Problemas / Erros:** A checagem inicial encontrou uma incompatibilidade de patch na versão do React Native; a configuração foi corrigida para a versão solicitada pelo SDK. A instalação também informou 35 vulnerabilidades em dependências do conjunto (12 moderadas e 23 altas), além de alertas de pacotes transitivos obsoletos.
- **Correções tentadas:** Alinhei o React Native a `0.81.5` e usei `useNativeDriver: false`; a checagem do Expo confirmou que as dependências estão atualizadas. Não apliquei `npm audit fix` porque isso poderia alterar dependências além do escopo e com impacto desconhecido. As verificações finais passaram após esses ajustes.

## Entrada 4 — Atualização para compatibilidade com Expo Go SDK 57

- **Prompt / Solicitação:** Corrigir a incompatibilidade informada: o Expo Go instalado usa SDK 57, mas o projeto usa SDK 54.
- **Resumo da decisão:** Atualizar o projeto para Expo SDK 57 e usar `npx expo install --fix` para selecionar as versões de React Native e dependências compatíveis com esse SDK, em vez de definir versões manualmente.
- **Ações Realizadas:** Consultei o registro npm e confirmei que a linha Expo 57 está publicada. Atualizei `expo` para `~57.0.30` e executei `npx expo install --fix`, que alinhou React a `19.2.3`, React Native a `0.86.3`, `babel-preset-expo` à linha `57.0.0` e TypeScript a `6.0.3`. Atualizei também este README para indicar SDK 57.
- **Resultado:** O Expo resolveu a configuração pública do aplicativo como `sdkVersion: 57.0.0`. Passaram `npx expo install --check`, `npm run typecheck` e `npx expo export --platform web`; o bundle web foi gerado sem erros.
- **Problemas / Erros:** O projeto declarava Expo SDK 54, incompatível com o Expo Go SDK 57 informado. O processo de atualização do npm emitiu um aviso de resolução de dependência peer e a auditoria agora reporta 22 vulnerabilidades (7 moderadas e 15 altas).
- **Correções tentadas:** Atualizei o Expo e sincronizei as dependências usando o comando recomendado pela CLI. A configuração resolvida e as verificações confirmam a atualização para SDK 57. Não executei `npm audit fix`, pois essas vulnerabilidades não são parte da incompatibilidade SDK/Expo Go e a correção automática pode introduzir alterações incompatíveis.

## Entrada 5 — Tela somente com a chuva e renderizador GPU

- **Prompt / Solicitação:** Manter a tela apenas com o efeito Matrix Rain e acrescentar uma implementação GPU para medir e comparar desempenho com a implementação inicial em CPU.
- **Resumo da decisão:** Preservar o renderizador CPU e acrescentar um caminho alternativo WebGL com `expo-gl`, selecionado por scripts de inicialização. Usar um atlas bitmap pequeno de glifos ASCII criado em CPU uma vez e deixar o fragment shader renderizar posições, caracteres, cores e caudas dos fluxos. Registrar a cadência dos loops no console, sem introduzir HUD ou controles visíveis na tela.
- **Ações Realizadas:** Instalei `expo-gl` usando `expo install` para manter compatibilidade com SDK 57 e `cross-env` para definir o renderizador de maneira portável entre Windows, macOS e Linux. Removi os elementos de marca, textos de apresentação e controles, mantendo somente a chuva e ocultando a barra de status. Adicionei scripts separados de CPU e GPU, um shader de tela cheia, textura tipográfica, seleção aleatória de glifos/cores/velocidades e amostragem periódica de FPS do loop. Atualizei o README com execução e protocolo de comparação.
- **Resultado:** A interface foi simplificada para efeito em tela cheia e existem caminhos de código distintos para CPU (texto nativo) e GPU (WebGL/shader). O bundle web compilou nos dois modos, a checagem Expo passou, e a verificação visual no navegador confirmou a renderização da chuva em GPU.
- **Problemas / Erros:** A primeira consulta de leitura da implementação foi limitada pelo tamanho do arquivo, então li os trechos em intervalos menores. Na primeira compilação, faltou a declaração de função `GpuRain`, causando `return outside of function` e TS1128. Depois da correção sintática, o TypeScript não encontrou a tipagem global `process` embora Metro tenha empacotado os dois modos corretamente.
- **Correções tentadas:** Instalei `expo-gl` e `cross-env`; não apliquei atualizações gerais de dependências. Recoloquei a declaração `function GpuRain()` e adicionei uma declaração tipada, mínima, para a variável de ambiente pública que Metro substitui no bundle, sem adicionar `@types/node`. As verificações subsequentes passaram.

### Medição exploratória do loop

- **Ações Realizadas:** Rodei os renderizadores CPU e GPU em sequência no mesmo navegador integrado e viewport, com o servidor Expo em modo de desenvolvimento. O código registrou três amostras de cinco segundos por modo.
- **Resultado:** CPU: 6,9, 6,7 e 5,3 loop-FPS (média 6,3). GPU: 177,2, 180,0 e 180,0 loop-FPS (média 179,1). A inspeção visual do modo GPU mostrou a chuva ocupando a tela inteira; a página e o bundle carregaram.
- **Problemas / Erros:** Esta medição não caracteriza o hardware móvel nem mede o tempo isolado de GPU; o limite de 180 loop-FPS observado na GPU pode ser da cadência do navegador. O modo de desenvolvimento também afeta o resultado. A verificação em Expo Go nativo depende de executar os comandos no dispositivo do usuário.
- **Correções tentadas:** Não alterei o efeito para perseguir os números do navegador. Registrei a medição como observação exploratória no README, incluindo limitações e instruções para repetir em condições controladas.

## Entrada 6 — Corrigir variedade dos glifos e cores GPU

- **Prompt / Solicitação:** O modo GPU exibia apenas zeros; garantir que a chuva GPU varie entre símbolos, letras, números e cores aleatórias.
- **Resumo da decisão:** Substituir o hash baseado em `sin()` e numa constante grande por uma função pseudoaleatória modular com valores pequenos, mais adequada à precisão `mediump` de shaders móveis. Ampliar o atlas para sinais ASCII e escolher uma paleta colorida por célula e instante.
- **Ações Realizadas:** O diagnóstico apontou que o shader dependia de `sin` e de aritmética grande em `mediump`, cuja precisão varia por GPU móvel. Atualizei a seleção pseudoaleatória de glifo para usar hash modular, e aumentei o atlas de glifos com `! # $ % & * + - / = ? @`, além de letras e números. A cor agora é escolhida de uma paleta verde, ciano, azul, violeta, rosa e lima.
- **Resultado:** A implementação GPU solicita uma seleção pseudoaleatória de 49 glifos diferentes por célula e altera glifo e cor cinco vezes por segundo. A verificação TypeScript, a compatibilidade Expo e o bundle GPU passaram. A inspeção visual do navegador exibiu letras (por exemplo, A, B, C), números, símbolos (por exemplo, !, +, $, %) e cores diversas (verde, ciano, azul, violeta, rosa e lima), em vez de zeros repetidos.
- **Problemas / Erros:** O problema foi relatado no Expo Go em dispositivo; uma validação anterior somente no navegador não reproduziu o comportamento, então a precisão e o suporte da GPU do dispositivo tornam-se a hipótese central, ainda não confirmada diretamente no aparelho.
- **Correções tentadas:** Removi `sin()`/constante de grande magnitude do hash, mantive os cálculos do shader em uma escala pequena, tornei o tamanho do atlas dinâmico e expandi caracteres e paleta. Validei no navegador o bundle e o resultado visual. O aparelho que apresentou zeros não está conectado a este ambiente; caso persista após reiniciar o servidor Expo Go com `npm run start:gpu`, será necessário conferir o log/driver específico desse dispositivo.