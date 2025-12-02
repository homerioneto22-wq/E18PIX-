# 🚀 Guia de Deploy - E18PIX+ no Netlify

Este guia te ajudará a fazer o deploy da aplicação E18PIX+ no Netlify sem perder nenhum dado.

## 📋 O que você precisa saber

### Sobre Persistência de Dados
A aplicação E18PIX+ usa **localStorage** do navegador para armazenar:
- Saldo da conta
- Histórico de transações
- Configurações da API MisticPay

**Importante:** Os dados ficam salvos no navegador do usuário, não no servidor. Isso significa que:
✅ Os dados NÃO são perdidos quando você faz deploy
✅ Cada usuário/navegador tem seus próprios dados
✅ Limpar cache do navegador apaga os dados

---

## 🎯 Passo a Passo

### 1️⃣ Preparar o Código

Seu código já está pronto para deploy! O arquivo `netlify.toml` já está configurado.

### 2️⃣ Enviar para o GitHub

**Opção A: Via v0 (Recomendado)**
1. Clique no ícone do GitHub no canto superior direito da v0
2. Autorize sua conta GitHub
3. Digite um nome para o repositório: `e18pix-plus-app`
4. Clique em "Push to GitHub"

**Opção B: Manual**
\`\`\`bash
git init
git add .
git commit -m "Initial commit - E18PIX+"
git branch -M main
git remote add origin https://github.com/seu-usuario/e18pix-plus-app.git
git push -u origin main
\`\`\`

### 3️⃣ Deploy no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Faça login
3. Clique em **"Add new site"** → **"Import an existing project"**
4. Escolha **"GitHub"** e autorize o acesso
5. Selecione o repositório `e18pix-plus-app`
6. Configurações do build (já detectadas automaticamente):
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Clique em **"Deploy site"**

⏱️ O deploy leva cerca de 2-4 minutos

### 4️⃣ Configurar a Aplicação

Após o deploy:

1. Acesse a URL do seu site (ex: `https://seu-app.netlify.app`)
2. Clique no ícone de **Settings** (engrenagem) no canto superior direito
3. Digite a senha: `243025`
4. No painel admin, configure:
   - **Client ID** da MisticPay
   - **Client Secret** da MisticPay
5. Clique em **"Salvar Configuração da API"**
6. Clique em **"Detectar IP do Servidor"**
7. Copie o IP mostrado

### 5️⃣ Autorizar IP na MisticPay

1. Acesse o painel da MisticPay
2. Vá em Configurações → IPs Autorizados
3. Adicione o IP copiado no passo anterior
4. Salve

---

## ✨ Funcionalidades Disponíveis

- **Enviar PIX**: Transferências usando CPF, Email, Telefone ou Chave Aleatória
- **Receber PIX**: Gere QR codes para receber pagamentos
- **Histórico**: Visualize todas as transações
- **Verificação Automática**: O sistema verifica automaticamente o recebimento pela API
- **Painel Admin**: Configure credenciais e gerencie o sistema

---

## 🔄 Atualizações Futuras

Para atualizar seu app já publicado:

1. Faça alterações no v0
2. Push para GitHub (mesmo processo do passo 2)
3. O Netlify fará deploy automático em ~2 minutos

---

## 🌐 Domínio Personalizado (Opcional)

1. No Netlify, vá em **Domain settings**
2. Clique em **"Add custom domain"**
3. Digite seu domínio
4. Configure os DNS conforme instruções

---

## ⚠️ Solução de Problemas

### Erro de Build
**Sintoma:** Deploy falha com erro de memória

**Solução:** O arquivo `netlify.toml` já está configurado para resolver isso.

### API retorna erro 401
**Sintoma:** Transferências/QR codes não funcionam

**Solução:**
1. Verifique se as credenciais estão corretas no painel admin
2. Confirme que o IP está autorizado na MisticPay
3. Teste com uma nova transferência

### Dados foram perdidos
**Sintoma:** Saldo zerou ou histórico sumiu

**Solução:**
- Os dados ficam no localStorage do navegador
- Verifique se você está usando o mesmo navegador e perfil
- Limpar cache/cookies apaga os dados permanentemente

### QR Code não gera
**Sintoma:** Botão não funciona ou dá erro

**Solução:**
1. Abra o Console (F12) e veja os erros
2. Verifique as credenciais da API no painel admin
3. Confirme que o IP está autorizado

---

## 📱 Acessar de Qualquer Lugar

Após o deploy, você pode acessar de:
- Computador (qualquer navegador)
- Celular (Chrome, Safari, etc)
- Tablet

**Lembre-se:** Cada dispositivo/navegador tem seus próprios dados salvos localmente.

---

## 🔒 Segurança

- Senha do admin: `243025` (você pode mudar no código)
- Credenciais da API são salvas localmente em cada navegador
- Use HTTPS sempre (Netlify fornece SSL grátis)
- Não compartilhe suas credenciais da MisticPay

---

## 📞 Suporte

- Documentação Netlify: https://docs.netlify.com
- Documentação Next.js: https://nextjs.org/docs
- API MisticPay: Consulte o painel da MisticPay

---

## ✅ Checklist Final

- [ ] Código enviado para GitHub
- [ ] Deploy realizado no Netlify
- [ ] Credenciais configuradas no painel admin
- [ ] IP autorizado na MisticPay
- [ ] Teste de transferência realizado
- [ ] Teste de QR Code realizado
- [ ] Verificação automática funcionando

🎉 Pronto! Seu E18PIX+ está no ar!
