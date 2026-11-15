Etapa 2 — Plano de testes de caracterização do backend
Objetivo: definir os testes mínimos para comparar os contratos e fluxos atuais com os requisitos das histórias 4, 6 e 7 do README.md, preservando os comportamentos já válidos e tornando visíveis as lacunas encontradas no diagnóstico.

Este é um plano, não uma declaração de execução: não rodei os testes, não alterei arquivos e não fiz commit. Como não identifiquei um framework de testes existente nos arquivos consultados, descrevo os cenários sem impor uma biblioteca.

Princípios da suíte
Testar os endpoints PHP por HTTP, incluindo sessão de usuário, corpo JSON, resposta e estado persistido no banco de teste.
Usar uma base isolada e dados controlados por cenário; não executar operações de teste contra dados reais.
Para cada operação, observar conteúdo e efeitos: registros no banco, proprietário, categoria, unidade, status e dados retornados pela API — não apenas o código HTTP.
Separar o comportamento atual observado do requisito esperado. Se o código atual contrariar o README, o teste deve registrar a lacuna, não transformar o comportamento incorreto em regra aprovada.
Não pressupor rotas ou formatos de payload de associação que o README não especifica.
Preparação compartilhada
Componente: ambiente de integração da API PHP e MySQL.

Pré-condições

Banco de teste com o esquema da aplicação e categorias válidas.
Usuários de teste autenticáveis com perfis de doador, instituição e, se necessário, administrador.
Sessões HTTP separadas por usuário.
Dados de doação e solicitação identificáveis por seus IDs, com ao menos duas categorias diferentes.
Observações

Confirmar que as requisições passam pela API e que os dados são persistidos no banco.
Limpar os registros criados ao final de cada cenário, sem tocar em dados fora da base de teste.
O nome de tabela/campo usado para confirmar persistência deve seguir o esquema real em backend/db, a ser verificado ao implementar a suíte.
Cenários incrementais
1. ApiAuth_ExigeSessaoParaConsultarDoacoesESolicitacoes
Componente: autenticação dos endpoints donations.php e requests.php.

Pré-condições: sessão sem usuário autenticado.

Passos

Fazer GET em donations.php.
Fazer GET em requests.php.
Repetir com uma sessão autenticada para confirmar a diferença de comportamento.
Observar

Sem sessão, a API deve negar o acesso sem retornar dados protegidos.
A resposta deve manter o contrato JSON utilizado pela API (success, message, data), conforme config.php.
Com sessão, a consulta deve responder com a estrutura de dados esperada.
2. DonationsApi_GetMine_RetornaSomenteDoacoesDoUsuarioAutenticado
Componente: GET donations.php no modo padrão/mine.

Pré-condições: duas contas doadoras distintas e uma doação de cada uma, em categorias conhecidas.

Passos

Autenticar como doador A e consultar as próprias doações.
Autenticar como doador B e fazer a mesma consulta.
Conferir os dados retornados e confrontá-los com os registros persistidos.
Observar

Cada conta recebe apenas as doações vinculadas ao seu usuário.
Os campos requeridos para a tabela do README — categoria, descrição, quantidade, unidade e status — estão disponíveis na resposta.
A categoria retornada corresponde à categoria persistida.
Ponto de caracterização: o endpoint inspecionado não inclui category_id na consulta “mine”, embora a edição no frontend dependa dele. O teste deve registrar essa divergência; não deve mascará-la preenchendo o valor no teste.
3. DonationsApi_Post_CriaDoacaoDisponivelEPersisteResponsavelECategoria
Componente: POST donations.php.

Pré-condições: doador autenticado e categoria existente.

Passos

Enviar uma doação com categoria, título, descrição, quantidade e unidade, sem status informado.
Ler a resposta da API.
Consultar a doação persistida e comparar seus campos com o payload e o usuário autenticado.
Observar

A operação cria um registro associado ao doador e à categoria enviados.
Os dados persistidos — descrição, quantidade e unidade — correspondem ao payload.
O status inicial é disponivel, como exige o README.
A resposta JSON informa sucesso e expõe o resultado esperado pelo contrato existente.
A criação não deve depender de acesso direto do cliente ao banco.
4. DonationsApi_Post_RejeitaPayloadInvalidoSemPersistirDoacao
Componente: validação do POST donations.php.

Pré-condições: doador autenticado e contagem inicial de doações registrada.

Passos

Tentar cadastrar doação sem cada campo obrigatório, em casos separados.
Tentar quantidade inválida/não positiva.
Tentar categoria inexistente.
Conferir resposta e estado do banco após cada tentativa.
Observar

A API comunica erro pelo contrato JSON.
Nenhum registro parcial ou inválido é persistido.
A resposta distingue erro de dados inválidos de categoria inexistente quando aplicável.
5. DonationsApi_Post_RestringeCadastroAosPerfisPermitidos
Componente: autorização do POST donations.php.

Pré-condições: usuários autenticados de tipo instituição e doador.

Passos

Tentar cadastrar doação como instituição.
Tentar cadastrar a mesma doação como doador.
Conferir a resposta e a persistência em cada caso.
Observar

O perfil sem permissão não cria registro.
O doador autorizado consegue criar e fica como responsável pela doação.
Uma resposta de erro não basta: verificar que a contagem e os registros no banco não mudaram para a tentativa negada.
6. DonationsApi_Put_ProtegePropriedadeEAtualizaSomenteDoacaoPropria
Componente: PUT donations.php.

Pré-condições: dois doadores e uma doação pertencente a cada um.

Passos

Como doador A, atualizar descrição, quantidade e unidade de sua doação.
Ler novamente o registro persistido.
Como doador B, tentar atualizar a doação de A.
Conferir novamente a doação de A.
Observar

A atualização autorizada persiste os novos valores e preserva o vínculo com o proprietário.
A tentativa de outro doador não altera nenhum campo do registro.
O endpoint retorna resposta de erro coerente com a autorização negada.
Cenário adicional: alterar categoria e conferir se o ID e nome retornados pela consulta refletem a categoria persistida. Este cenário ajuda a detectar a lacuna entre category_id necessário à edição e o campo atualmente retornado por “mine”.
7. DonationsApi_Delete_ExcluiDoacaoPropriaENegaExclusaoDeTerceiro
Componente: DELETE donations.php.

Pré-condições: doadores A e B; doação pertencente a A.

Passos

Tentar excluir a doação de A como B.
Conferir que o registro continua persistido.
Excluir a mesma doação como A.
Conferir que a doação própria foi removida.
Observar

A propriedade é verificada no backend, não somente ocultada na interface.
A tentativa não autorizada não remove nem modifica o registro.
A exclusão autorizada produz o efeito esperado e uma resposta JSON coerente com o contrato.
8. RequestsApi_GetMine_RetornaSomenteSolicitacoesDaInstituicao
Componente: GET requests.php no modo padrão/mine.

Pré-condições: duas instituições e uma solicitação de cada uma.

Passos

Consultar como instituição A.
Consultar como instituição B.
Conferir o proprietário dos resultados na base.
Observar

Cada instituição consulta suas próprias solicitações.
Os campos exigidos no README — categoria, descrição, quantidade, unidade e status — estão disponíveis.
A solicitação continua vinculada à instituição que a criou.
Ponto de caracterização: a consulta inspecionada não retorna category_id, necessário ao formulário de edição; registrar isso como divergência observada.
9. RequestsApi_Post_CriaSolicitacaoAbertaEPersisteInstituicaoECategoria
Componente: POST requests.php.

Pré-condições: instituição autenticada e categoria existente.

Passos

Enviar categoria, título, descrição, quantidade e unidade.
Ler a resposta.
Consultar o registro persistido.
Observar

A solicitação fica vinculada à instituição autenticada e à categoria informada.
Quantidade, unidade e descrição persistidas correspondem ao payload.
O status inicial é aberta.
A resposta mantém o envelope JSON e indica a criação.
10. RequestsApi_Post_RejeitaPerfilNaoInstituicaoEEntradaInvalidaSemPersistir
Componente: validação e autorização do POST requests.php.

Pré-condições: doador autenticado, instituição autenticada e estado inicial do banco registrado.

Passos

Tentar cadastrar solicitação como doador.
Tentar cadastrar como instituição com campos obrigatórios ausentes, quantidade inválida e categoria inexistente.
Conferir resposta e persistência após cada tentativa.
Observar

Perfil não permitido não cria solicitação.
Entradas inválidas não geram registro parcial.
Categoria inexistente não é associada.
Os testes devem registrar separadamente as respostas de erro e o estado efetivo do banco.
11. RequestsApi_Put_CaracterizaEdicaoDeSolicitacaoEProtecaoDePropriedade
Componente: PUT requests.php, conforme chamado pelo frontend.

Pré-condições: duas instituições e solicitações próprias distintas.

Passos

Tentar editar solicitação própria enviando PUT.
Tentar editar solicitação de outra instituição.
Conferir resposta e comparar o estado persistido antes/depois.
Observar

Lacuna identificada no diagnóstico: o endpoint consultado não implementa tratamento PUT; termina respondendo método não permitido.
Para a suíte orientada aos critérios de aceite, o cenário de edição própria deve ser considerado pendente/falha esperada no estado atual, até que o endpoint suporte a operação.
A tentativa de edição cruzada não pode alterar o registro, independentemente do método suportado.
Não registrar o 405 como comportamento correto de produto: ele caracteriza a implementação atual, mas não satisfaz o critério de edição do README.
12. RequestsApi_Delete_ProtegeSolicitacoesDeOutraInstituicao
Componente: DELETE requests.php.

Pré-condições: instituições A e B; solicitação pertencente a A.

Passos

Tentar excluir como B.
Conferir que a solicitação permanece inalterada.
Excluir como A.
Conferir o resultado persistido.
Observar

A instituição não consegue excluir solicitação de outro perfil.
A exclusão própria segue o critério de permitir excluir solicitações.
A regra do README de manter solicitações encerradas para histórico precisa ser confrontada com o comportamento de exclusão: o plano não presume que “excluir” significa exclusão física ou lógica. Testar a retenção de encerradas como cenário separado abaixo.
13. RequestsApi_StatusEncerrada_PermaneceRegistradaParaHistorico
Componente: persistência de solicitações encerradas.

Pré-condições: solicitação persistida e mecanismo de alteração de status disponível no endpoint após confirmação do contrato real.

Passos

Registrar a solicitação como encerrada usando o fluxo efetivamente suportado.
Consultar a persistência e, se houver endpoint de histórico definido, consultá-lo também.
Observar

A solicitação encerrada permanece registrada para histórico, conforme o README.
Limite atual: não há no endpoint consultado tratamento PUT; por isso, o cenário de transição por API depende de a edição ser implementada. Não inventar endpoint de histórico ou uma semântica de exclusão lógica não documentada.
14. DonationsApi_OpenERequestsApi_Open_FiltramOportunidadesPorCategoria
Componente: consultas de oportunidades em donations.php e requests.php.

Pré-condições: dados de pelo menos duas categorias; doações disponíveis e solicitações abertas em categorias iguais e diferentes.

Passos

Consultar oportunidades no contexto do doador ou da instituição conforme o fluxo documentado.
Comparar os itens retornados com a categoria do item que origina a oportunidade.
Repetir com itens de categoria incompatível.
Observar

Não aparecem oportunidades de categoria incompatível.
Itens compatíveis aparecem e mantêm os dados de instituição/doador, categoria, descrição, quantidade e unidade exigidos pelo README.
A consulta requests.php?mode=open deve ser examinada em particular: o código consultado filtra solicitações abertas, mas o diagnóstico não encontrou filtro de categoria nesse caminho.
Se o contexto da categoria não for identificável no contrato público atual, registrar isso como lacuna, sem inventar parâmetro ou comportamento.
15. DonationRequestFlow_AssociaSomenteCategoriasIguaisEAtualizaEstados
Componente: fluxo backend de associação entre doação e solicitação, previsto na história 7.

Pré-condições: doação disponível e solicitação aberta na mesma categoria; par adicional com categorias diferentes.

Passos

Tentar a seleção/associação do par compatível por meio da operação pública de API existente.
Conferir associação persistida, status dos dois itens e dados de rastreabilidade.
Tentar associação do par incompatível.
Conferir que o par incompatível não foi associado e que seus estados não mudaram.
Observar

Associação permitida somente quando as categorias são iguais.
Doação passa de disponivel para solicitada quando ocorre seleção compatível.
A solicitação permanece aberta enquanto a demanda estiver ativa.
O relacionamento e a operação ficam registrados para rastreabilidade.
Uma tentativa incompatível não altera os registros.
Limite atual: nos endpoints inspecionados não foi identificado um fluxo de associação/seleção. Como o README não especifica rota nem payload, este cenário é um requisito de teste, mas fica bloqueado até existir um contrato público implementado; não se deve inventar uma rota para fazê-lo passar.

16. ApiContracts_RespostasJSONContemDadosConsistentesComPersistencia
Componente: contratos de resposta de donations.php e requests.php.

Pré-condições: sessão válida e registros criados nos cenários anteriores.

Passos

Executar consultas e operações bem-sucedidas.
Validar o envelope JSON e os campos de cada item.
Comparar os valores retornados com a persistência.
Observar

Presença de success, message e data, conforme json_response.
Consultas retornam listas sob as chaves esperadas pelo frontend (donations e requests).
Categoria, descrição, quantidade, unidade, status e proprietário correspondem ao registro consultado, quando exigidos pelo cenário.
Erros não anunciam sucesso nem deixam alterações parciais no banco.
Pontos que o README não detalha o suficiente para criar uma oracle precisa
Antes de fechar asserções mais específicas, manter explícitas estas limitações — sem preencher lacunas por suposição:

Unidades válidas por categoria: o README exige unidade conforme categoria, mas não lista os valores permitidos nem onde essa relação é definida. A suíte precisa obter a fonte real desses valores antes de testar entradas específicas.
Exclusão de solicitação encerrada: o README exige operações de exclusão e retenção de solicitações encerradas para histórico, mas não esclarece se a retenção se refere à exclusão pelo usuário ou apenas à transição para encerrada. O teste de retenção cobre a solicitação encerrada; a semântica de excluir uma encerrada requer decisão ou regra adicional na própria fonte de verdade.
Associação doação–solicitação: critérios, status e rastreabilidade estão descritos, mas rota e payload não. O teste deve usar o contrato efetivamente definido pela aplicação quando existir; não cabe inventá-lo nesta etapa.
Instituições validadas: a regra de aprovação está documentada no README, mas o endpoint de solicitação precisa ser testado com usuários aprovados e não aprovados quando o estado de validação e seu contrato forem confirmados no esquema e nos fluxos reais.
Resultado esperado da caracterização
Ao executar a suíte, cada cenário deve ser classificado como:

Preservado: comportamento observado atende ao README.
Parcialmente preservado: parte do fluxo funciona, mas faltam campos, validações ou efeitos persistidos.
Lacuna conhecida: requisito não implementado ou contrato inexistente; exemplo: PUT requests.php e associação.
Contraditório: comportamento atual permite resultado que o README proíbe, ou impede comportamento exigido.
Este plano mantém a prioridade do harness: primeiro caracterizar os contratos e efeitos reais, sem alterar o sistema nem transformar lacunas em requisitos.