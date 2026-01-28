# Gerador de Propostas Comerciais

Aplicação Full Stack para automatizar o preenchimento de propostas comerciais com geração de PDF.

## 🚀 Tecnologias

### Frontend
- React 18 (Vite)
- Tailwind CSS
- Lucide React (ícones)
- Axios

### Backend
- Node.js
- Express
- Docxtemplater + PizZip
- LibreOffice Convert (PDF)

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Entry point
│   └── package.json
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores
│   │   ├── routes/         # Rotas Express
│   │   ├── services/       # Serviços (documentos)
│   │   └── index.js        # Entry point
│   └── package.json
├── templates/              # Arquivos de template (.odt, .docx)
├── Dockerfile              # Docker para produção
├── Dockerfile.dev          # Docker para desenvolvimento
├── docker-compose.yml      # Orquestração
└── package.json            # Scripts raiz
```

## 📋 Modelos Suportados

### RPBANK (modeloB.odt)
Placeholders:
- `{{DATA}}` - Data
- `{{PROPOSTA}}` - Número da Proposta
- `{{TOTAL}}` - Valor Total
- `{{VALORLIQUIDO}}` - Valor Líquido
- `{{VALORPROPOSTA}}` - Valor da Proposta
- `{{TAXAINTERMEDIACAO}}` - Taxa de Intermediação (%)
- `{{INTERMEDIACAO}}` - Valor Intermediação
- `{{PARCERIA}}` - Parceria
- `{{ESCRITORIO}}` - Escritório

### SD-RESOLV (Modelo para proposta.docx)
Placeholders:
- `{{NOME}}` - Nome Completo
- `{{NRPROCESSO}}` - Número do Processo
- `{{VALOR_LIQUIDO}}` - Valor Líquido

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+
- LibreOffice instalado (para conversão PDF)

### Passos

1. **Clone e instale as dependências:**
```bash
npm run install:all
```

2. **Coloque os templates na pasta `/templates`:**
   - `modeloB.odt`
   - `Modelo para proposta.docx`

3. **Execute em modo desenvolvimento:**
```bash
npm run dev
```

4. **Acesse:** http://localhost:5173

## 🐳 Docker

### Produção

```bash
# Build e execução
docker-compose up --build

# Apenas execução (se já fez build)
docker-compose up -d
```

Acesse: http://localhost:3001

### Desenvolvimento

```bash
docker-compose --profile dev up proposta-dev --build
```

## 📝 Checklist de Documentos

O sistema exibe visualmente a necessidade dos seguintes documentos:
- ✅ CPF
- ✅ Certidão de Nascimento
- ✅ RG / CNH
- ✅ Comprovante de Endereço

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente | `development` |

## 📖 API

### Endpoints

#### GET /api/health
Health check do servidor.

#### GET /api/proposals/templates
Lista templates disponíveis.

#### POST /api/proposals/generate
Gera proposta em PDF.

**Body:**
```json
{
  "templateId": "RPBANK",
  "formData": {
    "DATA": "28/01/2026",
    "PROPOSTA": "12345",
    "TOTAL": "R$ 10.000,00",
    ...
  }
}
```

**Response:** PDF (application/pdf)

## 🎨 Interface

1. **Tela Inicial:** Cards para seleção do modelo (RPBANK ou SD-RESOLV)
2. **Formulário Dinâmico:** Campos específicos do modelo selecionado
3. **Máscaras:** Formatação automática de valores monetários (R$) e datas
4. **Loading State:** Indicador visual durante geração do PDF
5. **Download Automático:** PDF baixado automaticamente após geração

## 📄 Licença

MIT
