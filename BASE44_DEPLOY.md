# Deploy no Base44

## Sobre Base44

Base44 é uma plataforma de criação de aplicações com IA que oferece hospedagem integrada e deploy automático. Não é necessário configurar servidores ou processos de deploy complexos.

## Opções de Deploy

### Opção 1: Importar Projeto Existente (Recomendado)

1. **Fazer login no Base44**
   - Acesse: https://app.base44.com
   - Faça login com sua conta Google

2. **Exportar código para GitHub**
   - No v0, clique no ícone do GitHub no canto superior direito
   - Conecte sua conta GitHub e crie um repositório
   - O código será enviado automaticamente

3. **Importar no Base44**
   - No Base44, clique em "Import from GitHub"
   - Selecione o repositório criado
   - O Base44 detectará automaticamente que é um projeto Next.js
   - O deploy será feito automaticamente

### Opção 2: Criar Nova App no Base44

Como o Base44 é uma plataforma de criação de apps com IA, você pode:

1. Criar uma nova app no Base44 do zero
2. Usar o código deste projeto como referência
3. Fazer upload dos componentes individualmente

## Configuração da API MisticPay

Após o deploy no Base44:

1. **Acessar o Painel Administrativo**
   - Clique no botão "Administrador"
   - Digite a senha: `243025`

2. **Configurar Credenciais**
   - Insira o Client ID da MisticPay
   - Insira o Client Secret da MisticPay
   - Endpoint da API já vem preenchido: `https://api.misticpay.com`
   - Clique em "Salvar Configuração da API"

3. **Autorizar IP no Painel MisticPay**
   - No painel administrativo, clique em "Detectar IP Atual"
   - Copie o IP exibido
   - Acesse o painel da MisticPay
   - Adicione o IP na lista de IPs permitidos

## Funcionalidades do App

- **Transferências Pix**: Envie dinheiro usando chave CPF, Email, Telefone ou Aleatória
- **Geração de QR Code**: Gere QR codes Pix para receber pagamentos
- **Histórico de Transações**: Visualize todas as transferências realizadas
- **Painel Administrativo**: Gerencie configurações e credenciais da API

## Suporte

- Documentação Base44: https://docs.base44.com
- Suporte Base44: https://app.base44.com/support/conversations
- Para problemas com a API MisticPay, contate o suporte da MisticPay

## Recursos do Base44

- ✅ Hospedagem integrada
- ✅ Deploy automático
- ✅ Domínio customizado disponível
- ✅ Autenticação integrada
- ✅ SSL/HTTPS automático
- ✅ Backups automáticos
