# Deploy no Netlify - PixFácil

Guia completo para fazer deploy da aplicação PixFácil no Netlify.

## Pré-requisitos

- Conta no GitHub
- Conta no Netlify
- Credenciais da API MisticPay (Client ID e Client Secret)

## Passo 1: Enviar Código para GitHub

### Opção A: Via v0 (Recomendado)
1. Clique no ícone do GitHub no canto superior direito
2. Autorize sua conta GitHub
3. Digite um nome para o repositório (ex: `pixfacil-app`)
4. Confirme o push

### Opção B: Manual
1. Baixe o projeto como ZIP
2. Extraia em uma pasta local
3. Execute no terminal:
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/pixfacil-app.git
git push -u origin main
\`\`\`

## Passo 2: Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Faça login com sua conta
3. Clique em **"Add new site"** → **"Import an existing project"**
4. Selecione **"GitHub"** como fonte
5. Autorize o Netlify a acessar seu GitHub
6. Selecione o repositório `pixfacil-app`
7. Configure o deploy:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Branch**: `main`
8. Clique em **"Deploy site"**

## Passo 3: Aguardar Deploy

O Netlify irá:
- Instalar dependências automaticamente
- Executar o build do Next.js
- Configurar serverless functions
- Disponibilizar a URL do site (ex: `https://seu-app.netlify.app`)

Tempo estimado: 2-5 minutos

## Passo 4: Configurar API MisticPay

Após o deploy bem-sucedido:

1. Acesse a URL do seu site no Netlify
2. Clique no botão **"Administrador"**
3. Digite a senha: **243025**
4. No painel administrativo:
   - Insira o **Client ID** da MisticPay
   - Insira o **Client Secret** da MisticPay
   - Clique em **"Salvar Configuração da API"**
5. Clique em **"Detectar IP do Servidor"** para ver o IP atual
6. Copie o IP detectado

## Passo 5: Autorizar IP no Painel MisticPay

1. Acesse o painel da MisticPay
2. Vá até configurações de segurança/IPs autorizados
3. Adicione o IP detectado no passo anterior
4. Salve as alterações

## Passo 6: Testar a Aplicação

1. Faça uma transferência Pix de teste
2. Gere um QR code clicando em "Receber" no histórico (taxa de 12% será aplicada automaticamente)
3. Verifique se as transações aparecem corretamente

## Funcionalidades da Aplicação

- **Transferência Pix**: Envie Pix usando CPF, Email, Telefone ou Chave Aleatória
- **Geração de QR Code**: Gere QR codes para receber valores com 12% de taxa adicional
- **Histórico**: Visualize todas as transações realizadas
- **Painel Admin**: Gerencie configurações e saldo (senha: 243025)

## Atualizações Futuras

Para atualizar a aplicação:

1. Faça alterações no código localmente
2. Commit e push para o GitHub:
\`\`\`bash
git add .
git commit -m "Descrição das alterações"
git push origin main
\`\`\`
3. O Netlify fará o deploy automaticamente

## Domínio Personalizado (Opcional)

1. No dashboard do Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar seu domínio

## Problemas Comuns

### Build falha com erro de memória
Solução: Aumente o limite no `netlify.toml`:
\`\`\`toml
[build.environment]
  NODE_OPTIONS = "--max_old_space_size=4096"
\`\`\`

### API retorna erro 401
Solução: Verifique se:
- Credenciais estão corretas no painel admin
- IP do servidor está autorizado na MisticPay

### QR Code não é gerado
Solução: 
- Verifique as credenciais da API
- Confirme que o IP está autorizado
- Verifique os logs no console do navegador (F12)

## Suporte

- Documentação Netlify: https://docs.netlify.com
- Documentação MisticPay: https://api.misticpay.com
