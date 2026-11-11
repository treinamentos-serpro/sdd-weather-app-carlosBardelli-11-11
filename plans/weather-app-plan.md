# Plano Técnico — Weather App

Este plano deriva de [`specs/weather-app-spec.md`](../specs/weather-app-spec.md) e define contratos e decisões de arquitetura para atender RF01–RF05 e US01–US06. Não define a implementação completa. Os campos pedidos neste plano são uma proposta técnica; questões de produto ainda abertas na spec continuam pendentes de validação.

## 1. Architecture Overview

A aplicação será uma SPA React. `App.tsx` monta a experiência e instancia `useWeather` no topo. O hook coordena busca, cidade selecionada, consulta meteorológica, unidade e estados de interface. Componentes recebem dados e callbacks por props. Services encapsulam chamadas HTTP à Open-Meteo e `lib/` transforma respostas externas em contratos internos e oferece funções puras de conversão/formatação.

Separar geocoding da previsão mantém as responsabilidades claras: a busca retorna opções de cidade; a seleção de uma opção inicia a consulta de clima para suas coordenadas. A camada de apresentação não conhece URLs nem o formato bruto da API.

## 2. Tech Stack

| Tecnologia | Uso e justificativa |
| --- | --- |
| TypeScript strict | Contratos explícitos entre serviços, hook e componentes; reduz confusão entre campos ausentes e valores válidos (RF02, RF03). |
| React 19 + Vite | SPA e ambiente de desenvolvimento/build já adotados pelo repositório. |
| Tailwind CSS | Estilização responsiva alinhada ao stack e ao tema dark glassmorphism documentado no projeto (requisito de responsividade). |
| Vitest + Testing Library | Testes unitários e de interação de funções, serviços e componentes. |
| Playwright | Verificação dos fluxos completos no navegador, incluindo responsividade e teclado. |
| Open-Meteo | Geocoding e previsão sem chave de API, conforme a spec. |

## 3. Project Structure

```text
src/
├── components/   # UI de apresentação; recebe dados e ações via props
├── hooks/        # estado e orquestração do fluxo (useWeather)
├── services/     # acesso HTTP e validação básica das respostas Open-Meteo
├── lib/          # funções puras: mapeamento, conversão e formatação
├── types/        # contratos compartilhados entre as camadas
└── App.tsx       # composição da página e ponto de integração do hook
```

Os nomes acima são a estrutura proposta; manter cada componente em seu próprio arquivo segue a convenção do projeto. Evitar estado global ou uma camada adicional de cache nesta versão.

## 4. Data Model

Os tipos abaixo representam dados normalizados da aplicação, não os payloads brutos da API. Campos que podem faltar são `null`; não se deve inventar valores para respostas parciais (edge case da spec). Temperaturas ficam internamente em Celsius, para que a troca de unidade não exija outra consulta (RF04).

```ts
export type Unit = 'celsius' | 'fahrenheit';

export interface City {
	id: number | null;
	name: string;
	country: string | null;
	countryCode: string | null;
	admin1: string | null;
	latitude: number;
	longitude: number;
	timezone: string | null;
}

export interface WeatherCondition {
	code: number | null;
	label: string;
}

export interface CurrentWeather {
	observedAt: string;
	temperatureC: number | null;
	condition: WeatherCondition;
	humidityPercent: number | null;
	windSpeedKmh: number | null;
	pressureHpa: number | null;
	precipitationMm: number | null;
}

export interface ForecastDay {
	date: string;
	minTemperatureC: number | null;
	maxTemperatureC: number | null;
	condition: WeatherCondition;
	precipitationMm: number | null;
	precipitationProbabilityPercent: number | null;
}

export interface WeatherData {
	city: City;
	current: CurrentWeather;
	forecast: ForecastDay[];
	fetchedAt: string;
}
```

`City` inclui país e subdivisão administrativa para distinguir homônimos (US02). `WeatherCondition.label` é produzido a partir do `weather_code` WMO; códigos não reconhecidos devem resultar em um rótulo neutro, nunca em uma condição presumida. `forecast` só é considerada completa quando tem cinco dias, conforme US04; uma resposta menor deve ser tratada conforme a estratégia de erro.

## 5. Data Flow

1. A pessoa informa uma cidade; a UI encaminha a busca ao hook.
2. O hook valida entrada vazia e chama o serviço de geocoding.
3. O serviço consulta a Open-Meteo e mapeia resultados para `City`; sem resultados, o hook expõe estado `empty`.
4. A pessoa seleciona uma `City`; o hook chama o serviço de previsão usando latitude e longitude.
5. O serviço valida e normaliza os dados em `WeatherData`; o hook atualiza o estado de sucesso ou erro.
6. A UI renderiza `WeatherData` e aplica a unidade selecionada na apresentação. Props fluem do `App` para os componentes; ações retornam via callbacks.

## 6. External APIs

Base URL e parâmetros devem ser construídos com `URL`/`URLSearchParams`, preservando corretamente acentos e caracteres especiais na busca (RF01).

### Geocoding

`GET https://geocoding-api.open-meteo.com/v1/search`

| Parâmetro | Valor proposto | Finalidade |
| --- | --- | --- |
| `name` | Nome informado, após remover espaços nas extremidades | Buscar cidades; obrigatório. |
| `count` | `5` | Limitar a cinco sugestões. |
| `language` | `pt` | Solicitar nomes/localização em português quando disponíveis. |
| `format` | `json` | Formato de resposta explícito. |

Exemplo de resposta de sucesso (campos relevantes):

```json
{
	"results": [
		{
			"id": 3452925,
			"name": "São Paulo",
			"latitude": -23.5475,
			"longitude": -46.63611,
			"country_code": "BR",
			"country": "Brasil",
			"admin1": "São Paulo",
			"timezone": "America/Sao_Paulo"
		}
	],
	"generationtime_ms": 0.2
}
```

`results` pode estar ausente quando não houver correspondências; normalize esse caso para lista vazia, não para erro (RF05).

### Forecast

`GET https://api.open-meteo.com/v1/forecast`

| Parâmetro | Valor proposto | Finalidade |
| --- | --- | --- |
| `latitude`, `longitude` | Coordenadas da `City` selecionada | Local da previsão. |
| `current` | `temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure` | Clima atual (RF02). |
| `daily` | `temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max` | Máxima, mínima, condição, precipitação acumulada e probabilidade máxima diária (RF03). |
| `forecast_days` | `5` | Solicitar cinco dias (US04). |
| `timezone` | `auto` | Receber datas e horários no fuso local da coordenada. |
| `temperature_unit` | `celsius` | Unidade canônica interna; conversão C/F é local (RF04). |
| `wind_speed_unit` | `kmh` | Unidade canônica para vento. |
| `precipitation_unit` | `mm` | Unidade canônica para precipitação. |

Exemplo representativo de resposta de sucesso (reduzido aos campos consumidos):

```json
{
	"timezone": "America/Sao_Paulo",
	"current": {
		"time": "2026-11-11T12:00",
		"temperature_2m": 24.3,
		"relative_humidity_2m": 61,
		"precipitation": 0.0,
		"weather_code": 2,
		"wind_speed_10m": 12.4,
		"surface_pressure": 1012.8
	},
	"daily": {
		"time": ["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"],
		"temperature_2m_max": [27.1, 26.4, 25.8, 24.9, 26.0],
		"temperature_2m_min": [18.2, 18.0, 17.6, 17.1, 18.1],
		"weather_code": [2, 3, 61, 2, 1],
		"precipitation_sum": [0.0, 0.0, 4.2, 0.0, 0.0],
		"precipitation_probability_max": [10, 15, 75, 5, 5]
	}
}
```

As listas `daily` são paralelas e devem ser associadas por índice ao mapear para `ForecastDay`. Validar presença e consistência dos campos antes de montar o modelo; uma previsão com menos de cinco datas não deve ser apresentada como completa (edge case da spec).

## 7. State Management

`useWeather` vive no topo, em `App.tsx`; componentes recebem estado e handlers por props. O hook controla texto de busca, resultados de cidades, cidade selecionada, dados meteorológicos, unidade e estados de requisição. Geocoding e previsão têm estados independentes para que a busca de cidades não apague indevidamente o clima já carregado.

Estados assíncronos explícitos: `idle | loading | success | error | empty`. `empty` representa uma busca válida sem resultados. `error` representa falha de rede/API, timeout, resposta inválida ou previsão incompleta; deve incluir mensagem adequada e contexto suficiente para repetir a operação. O estado de cada operação pode ser tipado como união discriminada, mantendo dados de sucesso separados de mensagens de erro.

A unidade é estado local do hook, inicialmente `celsius` como decisão provisória. Os valores de `WeatherData` permanecem em Celsius; ao renderizar, derivar Fahrenheit pela fórmula `F = C × 9/5 + 32` para todos os campos de temperatura atuais e previstos. A troca da unidade não chama services nem altera os dados armazenados. A unidade inicial e sua persistência permanecem decisões abertas da spec.

## 8. Error Handling Strategy

| Situação | Estado e comportamento |
| --- | --- |
| Inicial, sem busca | `idle`; exibir a interface de busca. |
| Consulta em andamento | `loading`; apresentar indicador acessível e encerrar também em timeout. |
| Geocoding sem resultados | `empty`; informar ausência e permitir nova busca. Entrada vazia não dispara request e recebe orientação de preenchimento. |
| Erro de rede, HTTP ou timeout | `error`; exibir mensagem clara e oferecer retry da mesma operação/consulta. |
| Payload inválido ou previsão com menos de cinco dias | `error` com mensagem de dados incompletos; não afirmar que a previsão é completa e permitir nova tentativa. |
| Campo individual ausente | Preservar os demais dados e representar o campo como `null`/indisponível na UI. |
| Busca/cidade muda durante request | Abortar ou ignorar resposta obsoleta; nunca associar dados da cidade anterior à seleção atual. |

Para timeout, usar cancelamento via `AbortController` com limite definido antes do release; a duração é uma decisão pendente da spec. Erros de API não devem ser confundidos com resultados vazios. Retentativas são iniciadas pela pessoa usuária, sem loop automático.

## 9. Testing Strategy

### Vitest

- Funções puras: conversão Celsius/Fahrenheit (inclusive limites e `null`), mapeamento de códigos WMO, formatação de datas/números e normalização de respostas parciais.
- Services: mock de `fetch` para URLs/parâmetros, payloads válidos, ausência de resultados, status HTTP de erro, falha de rede, timeout e payload malformado; verificar que texto de busca é codificado corretamente.
- Componentes/hook com Testing Library: estados `idle`, `loading`, `success`, `error` e `empty`; seleção entre cidades homônimas; retry; troca de unidade sem nova chamada de forecast; mensagens e controles acessíveis por teclado/role.
- Testar que forecast abaixo de cinco dias não é apresentado como previsão completa.

### Playwright

- Fluxo feliz: buscar cidade, escolher resultado e conferir clima atual e cinco dias.
- Busca sem resultados, entrada em branco, falha/timeout simulado e retry.
- Alternar Celsius/Fahrenheit e confirmar que a aplicação não refaz a consulta de forecast.
- Cidades homônimas, navegação por teclado e apresentação utilizável em viewport móvel e desktop.

E2E deve interceptar as chamadas à Open-Meteo para ser determinístico e não depender de rede ou disponibilidade externa. Critério de conclusão do repositório para mudanças de código: `pnpm lint`, `pnpm build` e `pnpm test`; executar também `pnpm test:e2e` quando o cenário E2E estiver configurado/alterado.

## 10. Risks & Trade-offs

| Risco ou trade-off | Decisão/mitigação |
| --- | --- |
| API externa pode falhar, ficar lenta ou limitar chamadas | Timeout, erro explícito, retry manual e testes com mocks; os limites de uso precisam ser confirmados. |
| Homônimos podem levar à seleção errada | Mostrar país e subdivisão administrativa retornados pelo geocoding (US02). |
| Fuso incorreto desloca datas da previsão | Solicitar `timezone=auto` e usar datas locais retornadas em `daily.time`; validar a apresentação (RF03). |
| Resposta parcial pode induzir informação falsa | Tipos nullable, validação na fronteira do service e rótulos de indisponibilidade; não preencher valores por inferência. |
| Previsão fixa de cinco dias pode ser incompleta na resposta | Exigir cinco entradas para declarar sucesso completo, conforme critério de aceite; comunicar incompletude e permitir retry. |
| Celsius como unidade base exige conversão de exibição | Conversão pura no `lib/`, sem novo request; evita duplicar estado e chamadas (RF04). |
| Estado apenas em memória é simples, mas perde seleção/preferência ao recarregar | Não adicionar persistência nesta versão; padrão e persistência devem ser decididos em produto. |
| Tipos internos diferem do schema externo | Manter mapeamento e tratamento de schema em `services/`/`lib/`; testar contratos sem acoplar UI à Open-Meteo. |

Trade-offs explícitos: o app consulta sob demanda em vez de atualizar automaticamente; mantém apenas a seleção atual, sem cache/offline; e não acrescenta biblioteca de estado ou de fetching. São escolhas de simplicidade para o escopo atual, revisáveis se requisitos de atualização, persistência ou offline forem aprovados.

## Diagrama do Fluxo de Dados

```mermaid
flowchart LR
		U[Pessoa usuária] -->|nome da cidade| UI[Componentes de busca]
		UI -->|buscar| H[useWeather / estado]
		H -->|geocoding| GS[Service de geocoding]
		GS -->|GET /v1/search| API[Open-Meteo]
		API -->|resultados| GS
		GS -->|City[]| H
		H -->|opções| UI
		U -->|seleciona City| UI
		UI -->|seleção| H
		H -->|coordenadas| FS[Service de forecast]
		FS -->|GET /v1/forecast| API
		API -->|payload atual + daily| FS
		FS -->|WeatherData ou erro| H
		H -->|estado + unidade| APP[App / renderização]
		APP -->|props| VIEW[Componentes de clima e previsão]
		VIEW -->|temperaturas derivadas em C/F| U
```

## Pendências da Spec que Afetam o Plano

- Confirmar quais métricas devem ser exibidas e se os campos propostos são suficientes.
- Confirmar se os cinco dias incluem hoje; este plano assume que sim, conforme o comportamento usual de `forecast_days=5`, sujeito à validação do produto.
- Definir unidade padrão, persistência da preferência, estado inicial e duração do timeout.
- Definir metas de atualização, desempenho, navegadores, idiomas e funcionamento offline.
