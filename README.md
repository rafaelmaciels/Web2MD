# Web2MD - Web Page to Markdown Browser Extension

> Modern Chrome & Microsoft Edge extension (Manifest V3) that converts web pages into clean, well-formatted Markdown (`.md`) files. Perfect for documentation, note-taking apps (Obsidian, Notion), knowledge bases, and AI prompt engineering.

---

## 🌟 Key Features

- **⚡ Fast Local Conversion**: 100% browser-based conversion using Mozilla Readability and Turndown with zero backend/cloud dependencies.
- **🧹 Intelligent DOM Cleaning**: Automatically strips out navigation bars, footers, advertisements, sidebars, cookie banners, tracking scripts, and popups.
- **📝 Live Editor & Preview**: Edit raw Markdown directly inside the extension popup or toggle to live preview before downloading.
- **📊 Real-time Content Metrics**: Displays word count, character count, estimated reading time, image count, and link count.
- **📋 Copy to Clipboard**: One-click instant copy to clipboard.
- **🏷️ Customizable Frontmatter**: Option to generate YAML Frontmatter headers containing title, URL, date, author, domain, and excerpt.
- **🖱️ Context Menu Integration**: Right-click any web page or text selection to convert instantly.
- **⌨️ Hotkey Shortcut**: Press `Alt+Shift+M` to launch Web2MD instantly on any active browser tab.
- **📁 Custom Filename**: Uses page title sanitized for OS compatibility (Windows, macOS, Linux) with editing capabilities.
- **🔒 Privacy First**: All processing occurs locally on your machine. No telemetry or external server tracking.

---

## 🚀 Installation Guide

### Building from Source

1. Clone or download this repository:
   ```bash
   git clone https://github.com/rafaelmaciels/Web2MD.git
   cd Web2MD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production package:
   ```bash
   npm run build
   ```
   The compiled extension will be output to the `dist/` folder.

---

### Loading into Google Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click **Load unpacked**.
4. Select the `dist/` folder inside the `Web2MD` directory.
5. Web2MD is now installed and ready to use!

---

### Loading into Microsoft Edge

1. Open Edge and navigate to `edge://extensions/`.
2. Enable **Developer mode** in the left sidebar.
3. Click **Load unpacked**.
4. Select the `dist/` folder inside the `Web2MD` directory.

---

## 🛠️ Project Architecture

```text
Web2MD/
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Manifest V3 service worker & context menu listener
│   ├── content/
│   │   └── index.ts            # Content script for active DOM extraction
│   ├── popup/
│   │   ├── App.tsx             # Main popup React application
│   │   ├── index.html          # Popup HTML entry point
│   │   ├── main.tsx            # React mounting entry
│   │   └── popup.css           # Premium dark theme stylesheet
│   ├── options/
│   │   ├── Options.tsx         # Options page React component
│   │   ├── index.html          # Options HTML entry point
│   │   ├── main.tsx            # React mounting entry
│   │   └── options.css         # Options stylesheet
│   ├── core/
│   │   ├── cleaner.ts          # DOM pruning utility (scripts, ads, nav, sidebars)
│   │   ├── extractor.ts        # Article content extractor via Mozilla Readability
│   │   ├── markdown.ts         # Turndown HTML to Markdown engine with GFM plugins
│   │   ├── filename.ts         # OS-safe filename sanitizer
│   │   └── storage.ts          # Wrapper over chrome.storage.sync
│   └── shared/
│       └── types.ts            # TypeScript interfaces & default configurations
├── public/
│   ├── manifest.json           # Chrome & Edge Manifest V3 configuration
│   └── icons/                  # 16, 32, 48, 128 icon assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⌨️ Shortcuts

| Platform | Shortcut | Action |
| --- | --- | --- |
| Windows / Linux | `Alt + Shift + M` | Open Web2MD popup on active tab |
| macOS | `Option + Shift + M` | Open Web2MD popup on active tab |

---

## 📄 License

[MIT License](LICENSE) © 2026 Web2MD Project

---
---

# Web2MD - Extensão de Navegador: Página Web para Markdown

> Extensão moderna para Google Chrome e Microsoft Edge (Manifest V3) que converte páginas da web em arquivos Markdown (`.md`) limpos e bem formatados. Ideal para documentação, aplicativos de anotações (Obsidian, Notion), bases de conhecimento e engenharia de prompts para IA.

---

## 🌟 Funcionalidades Principais

- **⚡ Conversão Local Rápida**: Conversão 100% no navegador usando Mozilla Readability e Turndown, sem dependência de backend ou serviços na nuvem.
- **🧹 Limpeza Inteligente do DOM**: Remove automaticamente barras de navegação, rodapés, anúncios, barras laterais, banners de cookies, scripts de rastreamento e popups.
- **📝 Editor e Visualização ao Vivo**: Edite o Markdown diretamente no popup da extensão ou alterne para a visualização prévia antes de baixar.
- **📊 Métricas de Conteúdo em Tempo Real**: Exibe contagem de palavras, caracteres, tempo estimado de leitura, quantidade de imagens e links.
- **📋 Copiar para a Área de Transferência**: Cópia instantânea com um clique.
- **🏷️ Frontmatter Personalizável**: Opção para gerar cabeçalhos YAML Frontmatter com título, URL, data, autor, domínio e resumo.
- **🖱️ Integração com Menu de Contexto**: Clique com o botão direito em qualquer página ou texto selecionado para converter instantaneamente.
- **⌨️ Atalho de Teclado**: Pressione `Alt+Shift+M` para abrir o Web2MD em qualquer aba ativa.
- **📁 Nome de Arquivo Personalizável**: Usa o título da página, adaptado para compatibilidade com Windows, macOS e Linux, com possibilidade de edição.
- **🔒 Privacidade em Primeiro Lugar**: Todo o processamento ocorre localmente na sua máquina. Sem telemetria ou rastreamento externo.

---

## 🚀 Guia de Instalação

### Compilando a partir do Código-Fonte

1. Clone ou baixe este repositório:
   ```bash
   git clone https://github.com/rafaelmaciels/Web2MD.git
   cd Web2MD
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o pacote de produção:
   ```bash
   npm run build
   ```
   A extensão compilada será gerada na pasta `dist/`.

---

### Carregando no Google Chrome

1. Abra o Chrome e acesse `chrome://extensions/`.
2. Ative o **Modo do desenvolvedor** usando o botão de alternância no canto superior direito.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `dist/` dentro do diretório `Web2MD`.
5. O Web2MD está instalado e pronto para uso!

---

### Carregando no Microsoft Edge

1. Abra o Edge e acesse `edge://extensions/`.
2. Ative o **Modo do desenvolvedor** na barra lateral esquerda.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `dist/` dentro do diretório `Web2MD`.

---

## 🛠️ Arquitetura do Projeto

```text
Web2MD/
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Service worker Manifest V3 e listener do menu de contexto
│   ├── content/
│   │   └── index.ts            # Script de conteúdo para extração do DOM ativo
│   ├── popup/
│   │   ├── App.tsx             # Aplicação React principal do popup
│   │   ├── index.html          # Ponto de entrada HTML do popup
│   │   ├── main.tsx            # Entrada de montagem do React
│   │   └── popup.css           # Folha de estilos com tema escuro premium
│   ├── options/
│   │   ├── Options.tsx         # Componente React da página de opções
│   │   ├── index.html          # Ponto de entrada HTML das opções
│   │   ├── main.tsx            # Entrada de montagem do React
│   │   └── options.css         # Folha de estilos das opções
│   ├── core/
│   │   ├── cleaner.ts          # Utilitário de limpeza do DOM (scripts, anúncios, nav, sidebars)
│   │   ├── extractor.ts        # Extrator de conteúdo via Mozilla Readability
│   │   ├── markdown.ts         # Motor de conversão HTML → Markdown com plugins GFM
│   │   ├── filename.ts         # Sanitizador de nomes de arquivo compatível com sistemas operacionais
│   │   └── storage.ts          # Wrapper sobre chrome.storage.sync
│   └── shared/
│       └── types.ts            # Interfaces TypeScript e configurações padrão
├── public/
│   ├── manifest.json           # Configuração Manifest V3 para Chrome e Edge
│   └── icons/                  # Ícones em 16, 32, 48 e 128 pixels
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⌨️ Atalhos de Teclado

| Plataforma | Atalho | Ação |
| --- | --- | --- |
| Windows / Linux | `Alt + Shift + M` | Abre o popup do Web2MD na aba ativa |
| macOS | `Option + Shift + M` | Abre o popup do Web2MD na aba ativa |

---

## 📄 Licença

[Licença MIT](LICENSE) © 2026 Web2MD Project
