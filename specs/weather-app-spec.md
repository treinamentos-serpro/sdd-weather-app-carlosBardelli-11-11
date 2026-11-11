# Especificação — Weather App

## Overview

O Weather App permite pesquisar cidades e consultar o clima atual e a previsão
de cinco dias. A experiência deve funcionar em dispositivos móveis e apoiar tanto
quem planeja o próprio dia quanto quem organiza uma viagem.

Esta versão registra os requisitos conhecidos. As questões listadas em **Open
Questions** precisam de decisão antes de concluir a especificação.

## Functional Requirements

- **RF01 — Busca:** permitir pesquisar cidades pelo nome e selecionar um resultado.
	Resultados homônimos devem apresentar informações que os distingam.
- **RF02 — Clima atual:** apresentar o clima atual da cidade selecionada.
- **RF03 — Previsão:** apresentar a previsão de cinco dias da cidade selecionada.
- **RF04 — Unidade:** permitir alternar as temperaturas exibidas entre Celsius e
	Fahrenheit, sem realizar nova consulta de clima.
- **RF05 — Estados:** indicar carregamento, ausência de resultados e erros de
	consulta; permitir uma nova tentativa após uma falha.

Os dados específicos de clima e o intervalo exato da previsão ainda dependem das
decisões registradas em **Open Questions**.

## User Stories

- **US01:** Como pessoa planejando o dia, quero buscar minha cidade para consultar
	as condições locais.
- **US02:** Como viajante, quero distinguir cidades de mesmo nome para selecionar
	o destino correto.
- **US03:** Como pessoa planejando o dia, quero ver o clima atual para decidir o
	que vestir ou levar.
- **US04:** Como viajante, quero ver a previsão de cinco dias para organizar minha
	viagem.
- **US05:** Como viajante, quero alternar entre Celsius e Fahrenheit para entender
	as temperaturas na unidade que conheço.
- **US06:** Como pessoa planejando o dia, quero saber quando uma consulta falha e
	poder tentar novamente para obter as informações de que preciso.

## Acceptance Criteria

- **US01 / RF01:** Dado um nome com resultados correspondentes, quando a pessoa
	pesquisar, então deve ver as cidades encontradas e poder selecionar uma delas.
- **US02 / RF01:** Dados resultados com nomes iguais, quando forem exibidos, então
	cada um deve apresentar informações de localização que permitam distingui-los.
- **US03 / RF02:** Dada uma cidade selecionada e uma resposta válida de clima atual,
	quando a consulta terminar, então o clima atual dessa cidade deve ser exibido.
- **US04 / RF03:** Dada uma cidade selecionada e uma resposta válida para cinco dias,
	quando a consulta terminar, então cinco entradas diárias identificadas por data
	devem ser exibidas para essa cidade.
- **US05 / RF04:** Dadas temperaturas em Celsius exibidas, quando a pessoa selecionar
	Fahrenheit, então todas as temperaturas exibidas devem usar Fahrenheit; ao
	selecionar Celsius novamente, devem voltar a Celsius, sem nova consulta de clima.
- **US06 / RF05:** Dada uma consulta que falhou, quando o erro ocorrer, então a
	pessoa deve ver uma mensagem de erro e poder tentar a mesma consulta novamente.
- **RF05:** Dada uma consulta em andamento, quando a pessoa aguardar, então deve
	ver um indicador de carregamento. Quando a busca terminar sem resultados, deve
	ver uma indicação de ausência de resultados e poder fazer outra busca.
- **RF01:** Dada uma busca vazia ou composta apenas por espaços, quando a pessoa
	tentar pesquisar, então nenhuma consulta deve ser enviada e uma orientação para
	informar o nome da cidade deve ser exibida.
- **RF05:** Dada uma consulta que excedeu o tempo limite, quando ela terminar por
	timeout, então o carregamento deve cessar e a pessoa deve poder tentar novamente.

## Non-Functional Requirements

- **Responsividade:** a busca, os resultados e a previsão devem ser utilizáveis em
	telas móveis e maiores, sem perda de conteúdo ou controles.
- **Acessibilidade:** controles devem ter nomes acessíveis e funcionar por teclado;
	estados de carregamento, erro e vazio devem ser comunicados de forma acessível.
- **Usabilidade:** informações devem ser legíveis e permitir distinguir cidades
	homônimas.
- **Confiabilidade:** falhas de rede ou do serviço devem ser comunicadas sem
	apresentar dados ausentes como válidos.
- **Desempenho e compatibilidade:** metas de resposta e navegadores suportados
	ainda precisam ser definidos.

## Edge Cases

| Caso | Comportamento esperado |
| --- | --- |
| Busca vazia ou apenas com espaços | Não realizar a busca e solicitar um nome de cidade. |
| Cidade inexistente | Exibir "Nenhuma cidade encontrada" e permitir outra busca. |
| Geocodificação sem resultados | Exibir o mesmo estado vazio, sem tratar a ausência de resultados como erro. |
| Nome com acentos, espaços ou caracteres especiais | Aceitar e enviar o texto sem corrompê-lo; apresentar os resultados retornados ou o estado vazio. |
| Cidades homônimas | Mostrar informações de localização disponíveis para distinguir os resultados. |
| Falha de rede ou API indisponível | Encerrar o carregamento, exibir erro e oferecer nova tentativa da consulta que falhou. |
| Consulta excede o tempo limite | Encerrar o carregamento, exibir erro e oferecer nova tentativa; o limite precisa ser definido. |
| Resposta parcial ou com campos ausentes | Exibir os dados disponíveis e marcar cada campo ausente como indisponível, sem inventar valores. |
| Previsão com menos de cinco dias | Não apresentar a previsão como completa; informar que está incompleta e permitir nova tentativa. |
| Troca de cidade durante uma consulta | Não apresentar a resposta anterior como se pertencesse à cidade selecionada. |

## Assumptions

- A busca é iniciada pela pessoa usuária; geolocalização automática não foi definida.
- A Open-Meteo fornece geocodificação e previsão sem exigir chave de API, conforme
	o contexto do projeto.
- As personas e avaliações de risco do discovery são hipóteses iniciais.

## Risks

| Risco | Impacto | Mitigação proposta |
| --- | --- | --- |
| Indisponibilidade, latência ou limite de uso da API | Consultas podem falhar ou demorar. | Informar falhas, permitir nova tentativa e evitar consultas desnecessárias. |
| Cidades homônimas ou localização incorreta | A pessoa pode consultar a cidade errada. | Exibir informações que distingam os resultados. |
| Datas ou horários interpretados no fuso errado | A previsão pode ser atribuída ao dia errado. | Definir o fuso aplicável e validar as datas apresentadas. |
| Dados desatualizados ou ausentes | A pessoa pode tomar decisões com informação incompleta. | Identificar dados indisponíveis e decidir como informar sua atualização. |
| Interface inadequada em telas pequenas | O aplicativo pode ficar difícil de usar. | Validar os fluxos em tamanhos de tela diferentes e por teclado. |

## Out of Scope

Para esta versão, propõe-se excluir funcionalidades não previstas no briefing:
alertas meteorológicos, mapas interativos, previsão horária e comparação simultânea
de cidades. A inclusão futura depende de decisão de produto.

## Open Questions

- Quais dados específicos devem compor o clima atual e cada dia da previsão?
- Os cinco dias incluem hoje? Qual fuso horário determina as datas?
- Qual unidade é padrão e a preferência deve persistir entre visitas?
- Qual é o estado inicial: cidade predefinida, busca vazia ou geolocalização?
- Quais idiomas, navegadores e metas de acessibilidade devem ser suportados?
- Quais são as metas de resposta, o tempo limite e a frequência de atualização?
- O aplicativo deve funcionar offline ou manter dados anteriores após uma falha?
- Há requisitos de autenticação ou persistência no servidor?

## Revisão Crítica e Prontidão

Melhorias incorporadas após a revisão:

- A busca vazia e o timeout têm critérios de aceite que descrevem o resultado
	observável e evitam consultas ou carregamentos indefinidos.
- Cidade inexistente e ausência de resultados de geocodificação têm um estado
	vazio explícito, distinto de uma falha da API.
- Respostas parciais e previsões com menos de cinco dias têm tratamento explícito,
	sem apresentar valores inventados nem uma previsão incompleta como completa.
- Os critérios de aceite identificam as histórias e os requisitos correspondentes.

**Esta spec é suficiente para desenvolver sem novas perguntas?** Não. Os campos
de clima, as datas da previsão, a unidade padrão, o estado inicial e os limites
de tempo ainda não foram definidos. As demais decisões em **Open Questions**
também precisam ser resolvidas para validar requisitos não funcionais e escopo.
