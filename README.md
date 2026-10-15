# Matrix Rain

Efeito Matrix Rain em tela cheia, criado com Expo SDK 57. A tela exibe apenas a chuva; o renderizador CPU usa glifos de texto nativos, e o renderizador GPU desenha a cena com WebGL via `expo-gl`.

## Executar

```bash
npm install
npm run start:cpu
```

Abra no Expo Go compatível com SDK 57. Para iniciar a implementação GPU, encerre o servidor CPU e execute:

```bash
npm run start:gpu
```

O comando `npm run start` usa CPU por padrão. Os modos também podem ser escolhidos para web: `npm run web -- --port 8081` (CPU) ou `npm run start:gpu -- --web`.

## Implementações

- **CPU:** React Native renderiza cada coluna como texto e anima sua transformação no driver JavaScript (`useNativeDriver: false`). Símbolos, fontes, cores e velocidades são variados aleatoriamente.
- **GPU:** `expo-gl` cria um contexto WebGL. Um vertex shader cobre a tela com um quadrilátero e um fragment shader calcula em paralelo o caractere, a cor e a posição de cada glifo para cada pixel. Um pequeno atlas bitmap com letras, números e símbolos ASCII é criado uma vez em CPU e enviado para uma textura; os glifos variam pseudoaleatoriamente e recebem cores escolhidas entre verde, ciano, azul, violeta, rosa e lima. As trilhas animadas e a composição por pixel são renderizadas pelo shader. O modo GPU oferece uma fonte pixelada monoespaçada, enquanto o modo CPU mantém as fontes nativas aleatórias.

Ambos os modos registram a cadência do loop como `[matrix-rain] renderer=... loop-fps=...` no console, em intervalos de cinco segundos. Para comparar, use o mesmo dispositivo, resolução, orientação e condições de primeiro plano; rode um modo por vez, aguarde a inicialização e compare várias amostras. Faça a medição fora do modo de desenvolvimento, pois o servidor de desenvolvimento altera o desempenho. Esse valor mede a cadência do loop JavaScript (e as submissões de desenho no modo GPU), não o tempo isolado da GPU nem uma garantia de FPS apresentado. Para uma medição rigorosa do tempo de GPU, use um profiler nativo do dispositivo.

### Observação experimental

Na validação exploratória pelo navegador integrado, a CPU registrou **5,3–6,9 loop-FPS** (média de 6,3 em três amostras) e a GPU **177,2–180,0 loop-FPS** (média de 179,1 em três amostras). O teste usou o mesmo navegador e viewport, mas em modo de desenvolvimento e sem caracterização do hardware; a taxa GPU também parece limitada pela cadência máxima do navegador. Esses valores confirmam que ambos os caminhos executam e ajudam a identificar o custo do renderer CPU neste ambiente, mas não devem ser interpretados como comparação representativa de dispositivos móveis ou de tempo de execução isolado da GPU.

As decisões, etapas e problemas de desenvolvimento estão registrados em [BUILD_LOG.md](./BUILD_LOG.md).
