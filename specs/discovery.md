# Discovery — Weather App

## Contexto

O aplicativo deve permitir que pessoas consultem o clima de cidades e planejem
suas atividades usando informações atuais e uma previsão de cinco dias, inclusive
em dispositivos móveis.

Personas consideradas:

- Pessoa planejando o dia: consulta o clima atual para decidir o que vestir ou levar.
- Viajante: pesquisa outra cidade e consulta a previsão para organizar a viagem.

## Requisitos Funcionais

- **RF01:** Buscar cidades pelo nome e permitir selecionar a cidade desejada.
- **RF02:** Exibir o clima atual da cidade selecionada.
- **RF03:** Exibir a previsão para cinco dias da cidade selecionada.
- **RF04:** Permitir alternar a exibição das temperaturas entre Celsius e Fahrenheit.
- **RF05:** Informar quando uma consulta estiver em andamento, não retornar
	resultados ou falhar.

## Requisitos Não-Funcionais

- **Responsividade:** a interface deve ser utilizável em dispositivos móveis e
	adaptar-se a diferentes tamanhos de tela.
- **Acessibilidade:** os controles devem ter identificação semântica e permitir
	navegação por teclado.
- **Usabilidade:** os dados devem ser legíveis e as cidades homônimas devem ser
	distinguíveis.
- **Confiabilidade:** o aplicativo deve lidar com falhas de rede e indisponibilidade
	do serviço de dados sem apresentar informações enganosas.
- **Desempenho:** busca e consulta devem ter tempos de resposta adequados; as metas
	quantitativas ainda precisam ser definidas.
- **Compatibilidade:** os navegadores e versões suportados precisam ser definidos.

## Riscos

As probabilidades e os impactos abaixo são estimativas iniciais.

| Risco | Probabilidade | Impacto | Mitigação proposta |
| --- | --- | --- | --- |
| Serviço externo indisponível ou rede instável | Média | Alto | Exibir erro claro e permitir nova tentativa. |
| Limites de uso ou lentidão da API | Média | Médio | Evitar requisições desnecessárias e avaliar limites do provedor. |
| Seleção incorreta de cidades homônimas | Média | Alto | Exibir informações de localização que distingam os resultados. |
| Datas ou horários incorretos por fuso horário | Média | Alto | Usar o fuso da cidade e validar a apresentação das datas. |
| Interface difícil de usar em telas pequenas | Média | Médio | Validar os fluxos em diferentes tamanhos de tela e com teclado. |
| Dados desatualizados ou divergentes da realidade | Média | Médio | Avaliar a exibição do horário de atualização e identificar a fonte. |

## Perguntas em Aberto (Open Questions)

| Pergunta | Impacto se não for respondida |
| --- | --- |
| Quais informações devem aparecer no clima atual e em cada dia da previsão? | Não é possível definir conteúdo e critérios de aceite completos. |
| Os cinco dias incluem hoje e qual fuso horário determina cada dia? | A previsão pode apresentar datas diferentes das esperadas. |
| Qual unidade é padrão e a preferência deve persistir entre visitas? | A experiência inicial e o comportamento em visitas posteriores ficam indefinidos. |
| Qual cidade, se alguma, aparece ao abrir o aplicativo? Deve haver geolocalização? | O estado inicial, as permissões e possíveis implicações de privacidade ficam indefinidos. |
| Quais idiomas, navegadores e metas de acessibilidade devem ser suportados? | Não é possível delimitar a compatibilidade nem validar a experiência. |
| Quais são as metas de tempo de resposta e atualização dos dados? | Desempenho e atualidade não podem ser verificados objetivamente. |
| O aplicativo deve funcionar offline ou manter dados anteriores quando a consulta falhar? | O comportamento em falhas e a necessidade de cache ficam indefinidos. |
| Há requisitos de autenticação ou persistência de dados no servidor? | O escopo e as necessidades de privacidade e infraestrutura ficam indefinidos. |

## Suposições (Assumptions)

- A busca por cidade é iniciada pela pessoa usuária; geolocalização automática não
	está estabelecida pelo briefing.
- A Open-Meteo será usada para geocodificação e previsão, conforme o contexto do
	projeto; não é necessária chave de API.
- As temperaturas serão mantidas em Celsius internamente e convertidas na
	apresentação, sem nova requisição ao alternar a unidade, conforme o README.
- As personas e avaliações de risco são hipóteses iniciais, sujeitas a validação.
