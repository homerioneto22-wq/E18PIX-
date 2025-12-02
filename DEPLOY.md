# Deploy no Netlify - PixFácil

## Passos Rápidos

### 1. Baixar o Projeto

No v0, clique nos **três pontos** no canto superior direito e selecione **"Download ZIP"**.

### 2. Extrair e Subir para GitHub

\`\`\`bash
# Extrair o ZIP
unzip pixfacil.zip
cd pixfacil

# Inicializar repositório Git
git init
git add .
git commit -m "Initial commit"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/pixfacil.git
git branch -M main
git push -u origin main
\`\`\`

### 3. Deploy no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Selecione **GitHub** e autorize o acesso
4. Escolha o repositório **pixfacil**
5. Configure o build:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Base directory**: (deixe em branco)
6. Clique em **"Deploy site"**

### 4. Configuração Pós-Deploy

Após o deploy concluir:

1. Acesse o site publicado (URL: `https://seu-site.netlify.app`)
2. Clique no botão **"Administrador"**
3. Digite a senha: **243025**
4. No painel administrativo:
   - Insira o **Client ID** da MisticPay
   - Insira o **Client Secret** da MisticPay
   - Clique em **"Detectar IP Atual"** para ver o IP do servidor
   - Clique em **"Salvar Configuração da API"**

### 5. Autorizar IP na MisticPay

1. Copie o IP detectado no painel administrativo
2. Acesse o painel da MisticPay
3. Adicione o IP na lista de IPs autorizados
4. Salve as alterações

## Pronto!

Sua aplicação PixFácil está rodando no Netlify. Teste fazendo uma transferência ou gerando um QR code Pix.

## Solução de Problemas

### Erro: "IP não autorizado"
- Verifique se o IP foi corretamente adicionado no painel da MisticPay
- Use o botão "Detectar IP Atual" para confirmar o IP correto

### Build Falha no Netlify
- Verifique se o arquivo `netlify.toml` está presente na raiz
- Confirme que o `package.json` tem todos os scripts necessários
- Verifique os logs de build no painel do Netlify

### Credenciais não salvam
- Limpe o cache do navegador
- Teste em modo anônimo
- As credenciais também ficam em memória durante a sessão

## Domínio Personalizado

Para usar um domínio próprio:

1. No painel do Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar o DNS
4. Após configurar, atualize o IP no painel da MisticPay se necessário
\`\`\`

\`\`\`json file="" isHidden
