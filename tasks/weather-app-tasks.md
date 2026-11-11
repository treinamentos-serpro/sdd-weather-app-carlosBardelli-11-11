# Backlog de Implementação — Weather App

Este backlog deriva de [`specs/weather-app-spec.md`](../specs/weather-app-spec.md) e [`plans/weather-app-plan.md`](../plans/weather-app-plan.md). Os critérios abaixo são verificáveis por teste, inspeção da UI ou validação de build.

## Entrega 1 — Contratos e funções de domínio

### T-01 — Definir os contratos normalizados do clima
- **Tipo:** Data
- **Descrição:** Criar os tipos compartilhados para cidade, condições, clima atual, dia de previsão, unidade e dados meteorológicos.
- **Referências:** RF01–RF04; US02–US05.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Dependências:** Nenhuma.
- **Critérios de aceite:**
	- Os tipos incluem os campos previstos no plano e representam campos potencialmente ausentes como `null`.
	- As temperaturas canônicas são Celsius e `Unit` representa Celsius e Fahrenheit.
	- O arquivo passa no typecheck sem depender de formatos brutos da Open-Meteo.

### T-02 — Mapear códigos WMO para condições legíveis
- **Tipo:** Data
- **Descrição:** Implementar função pura para converter códigos de condição conhecidos em rótulos e tratar códigos desconhecidos com rótulo neutro.
- **Referências:** RF02–RF03; US03–US04.
- **Arquivos prováveis:** `src/lib/weather-code.ts`
- **Dependências:** T-01.
- **Critérios de aceite:**
	- Cada código WMO suportado retorna seu rótulo esperado.
	- Código desconhecido ou ausente não é apresentado como uma condição presumida.

### T-03 — Testar o mapeamento de condições
- **Tipo:** Test
- **Descrição:** Cobrir códigos conhecidos, desconhecidos e ausentes da função de mapeamento.
- **Referências:** RF02–RF03; US03–US04.
- **Arquivos prováveis:** `tests/unit/lib/weather-code.test.ts`
- **Dependências:** T-02.
- **Critérios de aceite:**
	- Vitest verifica ao menos um caso de cada categoria de código implementada e o fallback neutro.

### T-04 — Implementar conversão local de temperatura
- **Tipo:** Data
- **Descrição:** Criar conversão pura de Celsius para Celsius/Fahrenheit, preservando campos indisponíveis.
- **Referências:** RF04; US05.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Dependências:** T-01.
- **Critérios de aceite:**
	- Celsius permanece inalterado e Fahrenheit usa `C × 9/5 + 32`.
	- Entrada `null` continua indisponível e não gera valor numérico inventado.

### T-05 — Testar conversão de temperatura
- **Tipo:** Test
- **Descrição:** Verificar conversões, retorno para Celsius e valores-limite relevantes.
- **Referências:** RF04; US05.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Dependências:** T-04.
- **Critérios de aceite:**
	- Vitest cobre congelamento da água, conversão inversa por seleção da unidade e entrada nula.

## Entrega 2 — Acesso a dados

### T-06 — Implementar serviço de geocoding
- **Tipo:** Data
- **Descrição:** Consultar a Open-Meteo, normalizar resultados para `City` e diferenciar lista vazia de falha.
- **Referências:** RF01, RF05; US01–US02, US06.
- **Arquivos prováveis:** `src/services/geocoding.ts`
- **Dependências:** T-01.
- **Critérios de aceite:**
	- A URL é construída com `URL`/`URLSearchParams`, preservando acentos e caracteres especiais.
	- A consulta envia o nome aparado e os parâmetros propostos no plano.
	- Resultados incluem os dados de localização disponíveis; ausência de `results` normaliza para lista vazia.
	- Resposta HTTP inválida ou payload malformado resulta em erro, não em estado vazio.

### T-07 — Testar serviço de geocoding
- **Tipo:** Test
- **Descrição:** Testar contrato HTTP, normalização e falhas do serviço com `fetch` simulado.
- **Referências:** RF01, RF05; US01–US02, US06.
- **Arquivos prováveis:** `tests/unit/services/geocoding.test.ts`
- **Dependências:** T-06.
- **Critérios de aceite:**
	- Vitest verifica parâmetros e codificação de texto acentuado, resposta com resultados, resultado vazio, erro HTTP, falha de rede e payload inválido.

### T-08 — Implementar serviço de previsão
- **Tipo:** Data
- **Descrição:** Consultar a previsão por coordenadas e mapear clima atual e cinco dias para os contratos internos.
- **Referências:** RF02–RF03, RF05; US03–US04, US06.
- **Arquivos prováveis:** `src/services/forecast.ts`
- **Dependências:** T-01, T-02.
- **Critérios de aceite:**
	- A URL inclui coordenadas, métricas atuais e diárias, cinco dias, fuso `auto` e unidades canônicas do plano.
	- Listas diárias são associadas por data/índice e a previsão só é sucesso completo com cinco datas.
	- Campos parciais permanecem indisponíveis; resposta malformada ou com menos de cinco dias produz erro explícito.
	- Erros HTTP e de rede não retornam dados meteorológicos como válidos.

### T-09 — Testar serviço de previsão
- **Tipo:** Test
- **Descrição:** Cobrir normalização de payload, campos ausentes, falhas e previsão incompleta.
- **Referências:** RF02–RF03, RF05; US03–US04, US06.
- **Arquivos prováveis:** `tests/unit/services/forecast.test.ts`
- **Dependências:** T-08.
- **Critérios de aceite:**
	- Vitest valida URL/parâmetros, payload completo, campos ausentes, erro HTTP, falha de rede, payload inválido e resposta com menos de cinco datas.

## Entrega 3 — Orquestração do fluxo

### T-10 — Implementar hook `useWeather`
- **Tipo:** Data
- **Descrição:** Orquestrar busca, seleção, consulta meteorológica, unidade e estados independentes de geocoding e previsão.
- **Referências:** RF01–RF05; US01–US06.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Dependências:** T-01, T-04, T-06, T-08.
- **Critérios de aceite:**
	- O hook expõe estados `idle`, `loading`, `success`, `error` e `empty` sem confundir ausência de resultados com falha.
	- Busca vazia ou só com espaços não chama o serviço e expõe orientação para informar uma cidade.
	- Selecionar uma cidade consulta suas coordenadas; retry repete a mesma operação e os mesmos parâmetros.
	- Timeout encerra o carregamento e permite retry; resposta obsoleta não substitui os dados da cidade atualmente selecionada.
	- Trocar unidade deriva todas as temperaturas dos dados já carregados, sem nova chamada ao serviço de previsão.

### T-11 — Testar estados e concorrência do hook
- **Tipo:** Test
- **Descrição:** Validar os fluxos do hook com serviços simulados, incluindo falhas e respostas obsoletas.
- **Referências:** RF01–RF05; US01–US06.
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`
- **Dependências:** T-10.
- **Critérios de aceite:**
	- Vitest cobre estados inicial, loading, sucesso, vazio e erro, busca em branco, retry e timeout.
	- Testes verificam que resposta de cidade anterior não é associada à nova seleção.
	- Teste verifica que alternar unidade não invoca novamente o serviço de previsão.

## Entrega 4 — Interface por componentes

### T-12 — Criar formulário de busca acessível
- **Tipo:** UI
- **Descrição:** Implementar campo de cidade e ação de busca controlados por props, com orientação para entrada vazia.
- **Referências:** RF01, RF05; US01, US06.
- **Arquivos prováveis:** `src/components/SearchForm.tsx`
- **Dependências:** T-10.
- **Critérios de aceite:**
	- Campo e ação têm nomes acessíveis e funcionam por teclado.
	- Campo vazio ou composto por espaços mostra orientação e não dispara busca.
	- Submissão transmite o texto digitado sem corromper acentos.

### T-13 — Testar formulário de busca
- **Tipo:** Test
- **Descrição:** Verificar submissão por teclado, acessibilidade e entrada vazia.
- **Referências:** RF01, RF05; US01.
- **Arquivos prováveis:** `tests/unit/components/SearchForm.test.tsx`
- **Dependências:** T-12.
- **Critérios de aceite:**
	- Vitest/Testing Library confirma nome acessível, submissão do texto e ausência de callback para entrada vazia.

### T-14 — Criar lista de resultados de cidades
- **Tipo:** UI
- **Descrição:** Exibir resultados de geocoding com informação suficiente para distinguir homônimos.
- **Referências:** RF01; US01–US02.
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Dependências:** T-01, T-10.
- **Critérios de aceite:**
	- Cada resultado mostra nome e os dados disponíveis de país/subdivisão.
	- Cada resultado pode ser selecionado por teclado e comunica seu nome acessivelmente.
	- Lista vazia não é renderizada como erro nem exibe localização inventada.

### T-15 — Testar resultados e seleção de cidades
- **Tipo:** Test
- **Descrição:** Cobrir lista, homônimos e seleção acessível.
- **Referências:** RF01; US01–US02.
- **Arquivos prováveis:** `tests/unit/components/CityResults.test.tsx`
- **Dependências:** T-14.
- **Critérios de aceite:**
	- Vitest/Testing Library confirma distinção de cidades homônimas e callback da cidade correta por teclado.

### T-16 — Criar apresentação do clima atual
- **Tipo:** UI
- **Descrição:** Exibir cidade selecionada, observação atual e campos disponíveis/indisponíveis.
- **Referências:** RF02, RF05; US03.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Dependências:** T-01, T-02, T-04, T-10.
- **Critérios de aceite:**
	- A UI apresenta os dados atuais disponíveis na unidade selecionada.
	- Campo `null` é marcado como indisponível, sem substituir por zero ou outro valor presumido.

### T-17 — Testar apresentação do clima atual
- **Tipo:** Test
- **Descrição:** Verificar renderização de dados atuais, conversão e indisponibilidade.
- **Referências:** RF02, RF04; US03, US05.
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`
- **Dependências:** T-16.
- **Critérios de aceite:**
	- Vitest/Testing Library verifica temperaturas em Celsius/Fahrenheit e mensagem para campos ausentes.

### T-18 — Criar apresentação da previsão de cinco dias
- **Tipo:** UI
- **Descrição:** Exibir cinco entradas diárias identificadas por data, probabilidade de chuva e marcar valores ausentes.
- **Referências:** RF03, RF05; US04.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`
- **Dependências:** T-01, T-02, T-04, T-08, T-10.
- **Critérios de aceite:**
	- Cada um dos cinco dias é identificado pela data retornada no fuso local da consulta.
	- Temperaturas usam a unidade selecionada e campos ausentes aparecem como indisponíveis.
	- Cada dia exibe a probabilidade máxima de precipitação quando disponível, sem derivar probabilidade do volume em milímetros.
	- A UI não apresenta uma coleção menor que cinco dias como previsão completa.

### T-19 — Testar apresentação da previsão
- **Tipo:** Test
- **Descrição:** Cobrir datas, cinco entradas, unidade e campos parciais.
- **Referências:** RF03–RF04; US04–US05.
- **Arquivos prováveis:** `tests/unit/components/Forecast.test.tsx`
- **Dependências:** T-18.
- **Critérios de aceite:**
	- Vitest/Testing Library confirma cinco datas visíveis, conversão de unidade e indisponibilidade de campos ausentes.

### T-20 — Criar controle de unidade de temperatura
- **Tipo:** UI
- **Descrição:** Implementar controle acessível para alternar Celsius e Fahrenheit.
- **Referências:** RF04; US05.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Dependências:** T-01, T-10.
- **Critérios de aceite:**
	- O controle expõe claramente a unidade ativa e permite alternar entre as duas opções por teclado.
	- Alteração chama somente o callback de unidade, sem iniciar busca ou consulta meteorológica.

### T-21 — Testar controle de unidade
- **Tipo:** Test
- **Descrição:** Verificar estado selecionado, acessibilidade e callback do controle.
- **Referências:** RF04; US05.
- **Arquivos prováveis:** `tests/unit/components/UnitToggle.test.tsx`
- **Dependências:** T-20.
- **Critérios de aceite:**
	- Vitest/Testing Library confirma alternância por teclado e valor selecionado anunciado acessivelmente.

### T-22 — Compor os componentes no aplicativo
- **Tipo:** UI
- **Descrição:** Integrar `useWeather` com formulário, resultados, clima atual, previsão, unidade e estados da página.
- **Referências:** RF01–RF05; US01–US06.
- **Arquivos prováveis:** `src/App.tsx`
- **Dependências:** T-10, T-12, T-14, T-16, T-18, T-20.
- **Critérios de aceite:**
	- Busca, seleção e consulta meteorológica percorrem o fluxo completo usando props e callbacks.
	- Loading, vazio e erro são comunicados acessivelmente; o erro oferece retry da operação correspondente.
	- Dados meteorológicos só são exibidos para a cidade selecionada e previsão incompleta não é declarada completa.

### T-23 — Aplicar layout responsivo e estados visuais
- **Tipo:** UI
- **Descrição:** Estilizar a experiência composta para telas móveis e maiores sem ocultar dados ou controles.
- **Referências:** RF01–RF05; US01–US06.
- **Arquivos prováveis:** `src/index.css`
- **Dependências:** T-22.
- **Critérios de aceite:**
	- Busca, opções e cinco dias permanecem utilizáveis em viewport móvel e desktop.
	- Loading, erro, vazio e indisponibilidade são visualmente distinguíveis e não dependem apenas de cor.
	- Conteúdo e controles não transbordam nem se sobrepõem nos tamanhos validados.

## Entrega 5 — Validação ponta a ponta

### T-24 — Testar fluxo de busca e consulta no Playwright
- **Tipo:** Test
- **Descrição:** Validar o caminho feliz e estados de busca com API interceptada, sem dependência de rede externa.
- **Referências:** RF01–RF03, RF05; US01–US04, US06.
- **Arquivos prováveis:** `tests/e2e/weather-search.spec.ts`
- **Dependências:** T-22, T-23.
- **Critérios de aceite:**
	- Playwright cobre busca, seleção de cidade, clima atual e cinco dias identificados por data.
	- Cenários cobrem entrada vazia, nenhuma correspondência, homônimos, falha/timeout e retry.
	- Todas as chamadas à Open-Meteo são interceptadas e o retry repete a operação esperada.

### T-25 — Testar unidade, teclado e responsividade no Playwright
- **Tipo:** Test
- **Descrição:** Validar alternância C/F, navegação por teclado e usabilidade em viewports móveis e desktop.
- **Referências:** RF01–RF04; US01–US05.
- **Arquivos prováveis:** `tests/e2e/weather-accessibility.spec.ts`
- **Dependências:** T-22, T-23.
- **Critérios de aceite:**
	- Playwright confirma conversão de todas as temperaturas sem nova chamada de forecast.
	- Busca, seleção e controle de unidade funcionam por teclado e têm nomes acessíveis.
	- Viewports móvel e desktop não apresentam conteúdo ou controles sobrepostos/cortados.

### T-26 — Executar gates de qualidade do repositório
- **Tipo:** Infra
- **Descrição:** Validar lint, build e suítes unitária e E2E após a conclusão das tarefas.
- **Referências:** RF01–RF05; US01–US06.
- **Arquivos prováveis:** Nenhum; executar os comandos já definidos em `package.json`.
- **Dependências:** T-03, T-05, T-07, T-09, T-11, T-13, T-15, T-17, T-19, T-21, T-24, T-25.
- **Critérios de aceite:**
	- `pnpm lint`, `pnpm build` e `pnpm test` concluem sem falhas.
	- `pnpm test:e2e` conclui sem falhas usando os cenários e a configuração existentes.

## Rastreabilidade RF → tarefas

| Requisito | Tarefas |
| --- | --- |
| RF01 — Busca | T-01, T-06–T-07, T-10–T-15, T-22–T-26 |
| RF02 — Clima atual | T-01–T-03, T-08–T-09, T-10–T-11, T-16–T-17, T-22–T-24, T-26 |
| RF03 — Previsão | T-01–T-03, T-08–T-09, T-10–T-11, T-18–T-19, T-22, T-24, T-26 |
| RF04 — Unidade | T-01, T-04–T-05, T-10–T-11, T-16–T-21, T-22–T-23, T-25–T-26 |
| RF05 — Estados e retry | T-06–T-11, T-12–T-13, T-16, T-18, T-22–T-24, T-26 |

## Notas de execução

- A ordem dos IDs respeita dependências; tarefas de teste vêm depois da implementação que cobrem. Serviços e contratos antecedem o hook, e dados/hook antecedem os componentes consumidores.
- O plano assume provisoriamente unidade inicial Celsius, cinco dias incluindo hoje, `timezone=auto` e campos meteorológicos propostos. Confirmar essas decisões de produto e definir a duração do timeout antes de concluir a implementação/release; manter comportamento configurável se a decisão mudar.
- A spec permanece com questões abertas sobre persistência, estado inicial, idiomas, navegadores, metas de desempenho e funcionamento offline. Não ampliar o backlog para persistência/offline sem decisão de escopo.
