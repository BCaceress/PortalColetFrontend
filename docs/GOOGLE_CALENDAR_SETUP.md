# Configuração do Google Calendar API

Este documento descreve como configurar e obter as credenciais necessárias para integrar o Google Calendar com o Portal Colet.

## Passo a Passo para Configuração

### 1. Crie um projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar um projeto" no cabeçalho e depois em "Novo projeto"
3. Dê um nome para o projeto (ex: "Portal Colet") e clique em "Criar"
4. Selecione o projeto recém-criado

### 2. Habilite a API do Google Calendar

1. No menu lateral, clique em "APIs e serviços" > "Biblioteca"
2. Pesquise por "Google Calendar API"
3. Clique no resultado "Google Calendar API"
4. Clique no botão "Habilitar"

### 3. Configure as credenciais OAuth 2.0

1. No menu lateral, clique em "APIs e serviços" > "Credenciais"
2. Clique no botão "Criar credenciais" e selecione "ID do cliente OAuth"
3. Selecione "Aplicativo da Web" como tipo de aplicativo
4. Dê um nome para o cliente OAuth (ex: "Portal Colet Web App")
5. Na seção "Origens JavaScript autorizadas", adicione:
   - `http://localhost:3000` (para desenvolvimento)
   - Seu domínio de produção quando estiver pronto
6. Na seção "URIs de redirecionamento autorizados", adicione:
   - `http://localhost:3000` (para desenvolvimento)
   - Seu domínio de produção quando estiver pronto
7. Clique em "Criar"
8. Anote o "ID do cliente" e o "Segredo do cliente" fornecidos

### 4. Crie uma chave de API

1. No menu lateral, clique em "APIs e serviços" > "Credenciais"
2. Clique no botão "Criar credenciais" e selecione "Chave de API"
3. Uma chave de API será criada. Clique em "Restringir chave" para configurar restrições
4. Em "Restrições de aplicativo", selecione "Referenciadores de HTTP (sites da Web)"
5. Adicione os domínios que podem usar esta chave:
   - `localhost:*` (para desenvolvimento)
   - Seu domínio de produção quando estiver pronto
6. Em "Restrições de API", selecione "Google Calendar API"
7. Clique em "Salvar"

### 5. Configure a tela de consentimento OAuth

1. No menu lateral, clique em "APIs e serviços" > "Tela de consentimento OAuth"
2. Selecione "Externo" como tipo de usuário e clique em "Criar"
3. Preencha as informações necessárias:
   - Nome do aplicativo: "Portal Colet"
   - Email de suporte ao usuário: seu email
   - Domínio do aplicativo: seu domínio
   - Informações de contato do desenvolvedor: seu email
4. Clique em "Salvar e continuar"
5. Na seção "Escopos", adicione os seguintes escopos:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly` (opcional, para leitura apenas)
6. Clique em "Salvar e continuar"
7. Na seção "Usuários de teste", adicione os emails dos usuários que terão acesso durante o desenvolvimento
8. Clique em "Salvar e continuar"
9. Revise as informações e clique em "Voltar para o painel"

### 6. Configure as variáveis de ambiente

1. Abra o arquivo `.env.local` na raiz do projeto (ou crie se não existir)
2. Adicione as seguintes variáveis com os valores das credenciais obtidas:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id-aqui
NEXT_PUBLIC_GOOGLE_API_KEY=sua-api-key-aqui
```

## Testando a integração

Após configurar as credenciais e variáveis de ambiente:

1. Inicie a aplicação com `npm run dev`
2. Navegue até a página de Agendas
3. Clique no botão "Conectar com Google Agenda"
4. Autorize o acesso quando solicitado
5. Você deverá ver as opções para sincronizar eventos entre o Portal Colet e o Google Calendar

## Solução de problemas comuns

### Erro: "Invalid client"
- Verifique se o ID do cliente está correto
- Confirme se as origens JavaScript autorizadas estão configuradas corretamente

### Erro: "Access not configured"
- Verifique se a API do Google Calendar está habilitada para o projeto

### Erro: "Redirect URI mismatch"
- Confirme se o URI de redirecionamento está configurado corretamente nas credenciais OAuth

### Erro: "API key not valid"
- Verifique se a chave de API está correta
- Confirme se as restrições da chave de API permitem seu domínio atual