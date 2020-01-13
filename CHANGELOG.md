# Change Log
All notable changes to the "advpl-switch-project" extension will be documented in this file.

<!-- ## [Unreleased]
### Changed
- Update and improvement of Polish translation from [@m-aciek](https://github.com/m-aciek). -->

## [0.X.x] - 2020-01-14 - New Year Release
### Removed

### Changed
- Alterado Lista de seleção de projetos para mostrar o ambiente ativo, a URI do projeto;
- Alterado lista de seleção de projetos para não mostrar o projeto que está conectado;
- Ajustado forma de recomendação da Extensão;
- Renomeado comando de desabilitar todos os ambientes, para ficar mais claro sua função;

### Added
- Criado configuração na lista de projetos para armazenar o ambiente Default;
- Adicionado no menu de contexto da View de Gerenciamento de servidores o comando para definir um ambiente como Default;
- Implementado comando para  definir um ambiente como Default de um projeto;
- [Implementado uso do Ambiente Default #20](https://github.com/AlencarGabriel/advpl-switch-project/issues/20);
    - Agora será considerado nas alternâncias de ambiente/projeto o ambiente default, não o primeiro da lista;
- [Implementado comando para Associar um ambiente ao Projeto Ativo #21](https://github.com/AlencarGabriel/advpl-switch-project/issues/21);
- Implementado configuração que permite ao usuário escolher se deseja mostrar o caminho dos projetos ou não;
- Adicionado ícones na view do gerenciador de ambientes para permitir habilitar/desabilitar todos os ambientes;

### Agradecimentos da Versão:
- Diogo Henrique;
- Vinicius Nascimento.

## [0.3.1] - 2019-07-12
### Removed
- Removido temporariamente box da Build do Travis que estava apontando como "Build Failing" nos testes no ambiente Linux, porem foi verificado e não havia problema na extensão, e sim algo relacionado à ultima versão do Framework de testes do VsCode para Linux.

## [0.3.0] - 2019-07-12
### Changed
- Renomeado Nome e Descrição da extensão para melhorar nos resultados de pesquisa.

## [0.2.7] - 2019-05-27
### Changed
- Atualizado ícones da extensão;
- Removido pacotes de dependências obsoletos.

## [0.2.5] - 2019-05-24
### Added
- [Habilitar/Desabilitar todos os Projetos](https://github.com/AlencarGabriel/advpl-switch-project/issues/16)
- [Alterar ambiente ativo ao trocar de Projeto](https://github.com/AlencarGabriel/advpl-switch-project/issues/14)
- [Mostrar todos os ambientes caso o Projeto não tenha ambientes relacionados](https://github.com/AlencarGabriel/advpl-switch-project/issues/13)

### Changed
- Milestone [May 2019](https://github.com/AlencarGabriel/advpl-switch-project/milestone/3?closed=1)
- [Desabilitar todos os ambientes manter os relacionados ao Projeto](https://github.com/AlencarGabriel/advpl-switch-project/issues/17)
- Corrigido BUGs e anomalias causadas pelas últimas atualizações do VsCode.
- Melhorado performance e consistência na atualização das configurações.
- Ao iniciar a extensão atualiza as configurações para o ambiente que está realmente configurado. Obs.: Em alguns casos a extensão é reiniciada, ou por algum erro o projeto não é trocado nas configurações, somente no Workspace Folders.

### Agradecimentos da Versão:
- [AugustoPontin](https://github.com/AugustoPontin) pelas issues baseadas na utilização e pela confiança para migrar do TDS para o VsCode;
- [PAULOCAMATA](https://github.com/PAULOCAMATA) pelas issues baseadas nas constantes utilizações em diversos projetos e para melhoria contínua;
- [vinidesouza7](https://github.com/vinidesouza7) pelo apoio diário na utilização e reports no trabalho, e ainda por usar a extensão ainda com Bugs.

## [0.1.6] - 2018-12-14
### Changed
- [Converter GIF do README em vídeo](https://github.com/AlencarGabriel/advpl-switch-project/issues/15)

## [0.1.5] - 2018-12-03
- Desatualizado pacote event-stream para versão 3.3.4.
- Removido pacote flatmap-stream.

>**Ajustes feitos conforme [Alerta do GitHub](https://github.com/dominictarr/event-stream/issues/116) para pacotes maliciosos nas dependências do event-stream.**

## [0.1.4] - 2018-11-28
- Alterado documentação da extensão.

## [0.1.3] - 2018-11-27
### Added
- [Relacionar ambientes do AdvPL com o Projeto aberto](https://github.com/AlencarGabriel/advpl-switch-project/issues/8)
- Habilitar/Desabilitar todos os ambientes AdvPL.

### Changed
- Milestone [November 2018](https://github.com/AlencarGabriel/advpl-switch-project/milestone/1?closed=1)
- Resolved Issue [killerall/advpl-vscode#291](https://github.com/killerall/advpl-vscode/issues/291)
- Padronizado descrição dos comandos.

## [0.0.6] - 2018-10-11
### Changed
- Resolved Issue [#6](https://github.com/AlencarGabriel/advpl-switch-project/issues/6)
- Resolved Issue [#5](https://github.com/AlencarGabriel/advpl-switch-project/issues/5)

## [0.0.5] - 2018-10-11
### Added
- Bloqueado uso da extensão quando a KillerAll.advpl-vscode não estiver instalada.

### Changed
- Alterado para tratar quando algumas configurações não e stiverem definidas.
- Corrigido pequenos BUGs.
- Ajustado documentação da extensão.

## [0.0.1] - 2018-10-08
### Added
- First extension release.


<!-- ### Changed

### Removed -->