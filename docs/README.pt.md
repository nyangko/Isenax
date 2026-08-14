<div align="center">

<img src="../assets/banner.png" alt="Isenax - Ferramenta de Diagramas Isométricos" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Nota:

Este repositório (Isenax) é um derivado de [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), que por sua vez é um fork de stan-smith/FossFLOW (que por sua vez era um fork de [markmanx/isoflow](https://github.com/markmanx/isoflow)), originalmente criado com o propósito de contribuir para o repositório original através de PRs. No entanto, o nome de usuário do GitHub do autor parece ter sido alterado para [mug-book-droid](https://github.com/mug-book-droid) e sua atividade tornada privada (talvez conta suspensa?), tornando o repositório original inacessível.

Por enquanto, minha intenção é fazer deste repositório (agora chamado Isenax) uma continuação do desenvolvimento do FossFLOW, e qualquer contribuição através de PRs também é bem-vinda.

Você pode conferir o último estado do repositório original que obtive na branch `backup/stan-smith-FossFLOW`.

---

Isenax é um poderoso Progressive Web App (PWA) de código aberto para criar belos diagramas isométricos. Construído com React e a biblioteca <a href="https://github.com/markmanx/isoflow">Isoflow</a> (bifurcada e publicada no npm como fossflow, e como isenax neste fork), ele roda inteiramente no seu navegador com suporte offline.

---
<p align="center">
<b>Experimente online --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Implantação Rápida com Docker

```bash
# Usando Docker Compose (recomendado - inclui armazenamento persistente)
docker compose up

# Ou execute diretamente do Docker Hub com armazenamento persistente
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

O armazenamento no servidor está habilitado por padrão no Docker. Seus diagramas serão salvos (por padrão como root) em `./diagrams` no host. Para alterar o usuário ou ID de grupo usado ao salvar, defina as variáveis de ambiente `PUID` e `PGID`.

Para desabilitar o armazenamento no servidor, defina `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### Autenticação Básica HTTP (Opcional)

Proteja sua instância do Isenax com HTTP Basic Auth:

```bash
# Com Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Ou com docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Nota**: Ambas as variáveis devem ser definidas para habilitar a autenticação. Se qualquer uma delas estiver vazia, o aplicativo é acessível sem login.

## Início Rápido (Desenvolvimento Local)

```bash
# Clonar o repositório
git clone https://github.com/nyangko/Isenax
cd Isenax

# Instalar dependências
npm install

# Compilar a biblioteca (necessário na primeira vez)
npm run build:lib

# Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Estrutura do Monorepo

Este é um monorepo contendo quatro pacotes:

- `packages/isenax-lib` - Biblioteca de componentes React para desenhar diagramas de rede (construída com Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App que encapsula e apresenta a biblioteca (construído com RSBuild)
- `packages/isenax-backend` - Servidor Express que fornece armazenamento autogerenciado opcional para os diagramas (usado na implantação com Docker)
- `packages/isenax-mcp` - Servidor MCP (Model Context Protocol) que permite que um agente de IA externo leia, crie e edite seus diagramas diretamente (stdio ou Streamable HTTP)

### Comandos de Desenvolvimento

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor de desenvolvimento do aplicativo
npm run dev:lib      # Modo watch para desenvolvimento da biblioteca

# Build
npm run build        # Compilar biblioteca e aplicativo
npm run build:lib    # Compilar apenas biblioteca
npm run build:app    # Compilar apenas aplicativo

# Testes e Linting
npm test             # Executar testes unitários
npm run lint         # Verificar erros de linting

# Testes E2E (Selenium)
cd e2e-tests
./run-tests.sh       # Executar testes end-to-end (requer Docker e Python)

# Publicação
npm run publish:lib  # Publicar biblioteca no npm
```

## Como Usar

### Criar Diagramas

1. **Adicionar Itens**:
   - Pressione o botão "+" no menu superior direito, a biblioteca de componentes aparecerá à esquerda
   - Arraste e solte componentes da biblioteca na tela
   - Ou clique com o botão direito na grade e selecione "Adicionar nó"

2. **Conectar Itens**:
   - Selecione a ferramenta Conector (pressione 'C' ou clique no ícone do conector)
   - **Modo de clique** (padrão): Clique no primeiro nó, depois clique no segundo nó
   - **Modo de arrastar** (opcional): Clique e arraste do primeiro nó para o segundo
   - Alterne os modos em Configurações → aba Conectores

3. **Salvar Seu Trabalho**:
   - **Salvamento Rápido** - Salva na sessão do navegador
   - **Exportar** - Baixar como arquivo JSON
   - **Importar** - Carregar de arquivo JSON

4. **Organizar com o painel de Camadas**:
   - Abra Camadas na barra de ferramentas para ver todos os nós, conectores, áreas e caixas de texto em uma única lista
   - Selecione um item ali para editá-lo na aba "Editar" do mesmo painel
   - Em telas estreitas, ele abre como painel inferior pelo botão no canto inferior direito da tela de desenho

### Opções de Armazenamento

- **Armazenamento de Sessão**: Salvamentos temporários apagados quando o navegador fecha
- **Exportar/Importar**: Armazenamento permanente como arquivos JSON
- **Salvamento Automático**: Salva automaticamente as alterações a cada 5 segundos na sessão

### Integração MCP (Agentes de IA)

O Isenax vem com um servidor MCP para que um agente de IA externo (Claude, etc.) possa ler, criar e editar seus diagramas diretamente:

1. Abra **Configurações → MCP** e ative — uma URL de conexão e um token Bearer serão exibidos.
2. Conecte seu cliente MCP a essa URL/token (`packages/isenax-mcp` suporta transporte stdio e Streamable HTTP).
3. As alterações feitas pelo agente aparecem ao vivo em qualquer aba aberta mostrando esse diagrama, sem precisar recarregar — um indicador "MCP está escrevendo..." aparece durante o trabalho.

Os ícones integrados trafegam apenas por id (nenhum dado base64 é enviado ao agente), e o `update_diagram_patch` permite que um agente envie apenas os campos alterados em vez de reenviar todo o modelo.

## Adicionado recentemente

### Multiplexação de conectores
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Copiar e colar itens
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Contribuindo

Damos as boas-vindas a contribuições! Por favor veja [CONTRIBUTING.md](../CONTRIBUTING.md) para diretrizes.

## Documentação

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Guia abrangente para a base de código
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Diretrizes de contribuição

## Licença

MIT
