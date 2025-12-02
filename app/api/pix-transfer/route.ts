import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pixKey, pixType, amount, clientId, clientSecret, endpoint } = body

    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        success: false, 
        message: "Configure Client ID e Client Secret no painel admin (senha: 243025)",
        error: "MISSING_CREDENTIALS"
      }, { status: 400 })
    }

    if (
      clientId.includes("seu-client") || 
      clientId.includes("aqui") || 
      clientSecret.includes("seu-client") || 
      clientSecret.includes("aqui") ||
      clientId.length < 10 ||
      clientSecret.length < 10
    ) {
      return NextResponse.json({ 
        success: false, 
        message: "Configure credenciais reais da MisticPay no painel admin (senha: 243025). As credenciais padrão são apenas placeholders.",
        error: "INVALID_CREDENTIALS"
      }, { status: 400 })
    }

    if (!endpoint) {
      return NextResponse.json({ 
        success: false, 
        message: "Endpoint não configurado",
        error: "MISSING_ENDPOINT"
      }, { status: 400 })
    }

    if (!pixKey || !pixType || !amount) {
      return NextResponse.json({ 
        success: false, 
        message: "Preencha todos os campos obrigatórios",
        error: "INVALID_REQUEST"
      }, { status: 400 })
    }

    const cleanPixKey = pixKey.trim().replace(/\D/g, '')
    
    if (pixType === 'cpf') {
      if (cleanPixKey.length !== 11) {
        return NextResponse.json({ 
          success: false, 
          message: "CPF inválido. Deve conter 11 dígitos.",
          error: "INVALID_PIX_KEY"
        }, { status: 400 })
      }
      
      const invalidCpfs = ['00000000000', '11111111111', '22222222222', '33333333333', 
                           '44444444444', '55555555555', '66666666666', '77777777777',
                           '88888888888', '99999999999']
      if (invalidCpfs.includes(cleanPixKey)) {
        return NextResponse.json({ 
          success: false, 
          message: "CPF inválido. Use um CPF real.",
          error: "INVALID_PIX_KEY"
        }, { status: 400 })
      }
    }
    
    if (pixType === 'cnpj' && cleanPixKey.length !== 14) {
      return NextResponse.json({ 
        success: false, 
        message: "CNPJ inválido. Deve conter 14 dígitos.",
        error: "INVALID_PIX_KEY"
      }, { status: 400 })
    }
    
    if (pixType === 'phone') {
      if (cleanPixKey.length < 10 || cleanPixKey.length > 11) {
        return NextResponse.json({ 
          success: false, 
          message: "Telefone inválido. Deve conter 10 ou 11 dígitos.",
          error: "INVALID_PIX_KEY"
        }, { status: 400 })
      }
    }
    
    if (pixType === 'email' && !pixKey.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        message: "Email inválido.",
        error: "INVALID_PIX_KEY"
      }, { status: 400 })
    }
    
    if (pixType === 'random' && pixKey.length !== 32) {
      return NextResponse.json({ 
        success: false, 
        message: "Chave aleatória inválida. Deve conter 32 caracteres.",
        error: "INVALID_PIX_KEY"
      }, { status: 400 })
    }

    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Valor inválido",
        error: "INVALID_AMOUNT"
      }, { status: 400 })
    }

    const transactionId = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const formattedAmount = numericAmount.toFixed(2)
    const descriptionText = `Transferência Pix - R$ ${formattedAmount}`
    
    const requestBody = {
      amount: numericAmount,
      pixKey: pixKey.trim(),
      pixKeyType: pixType.toLowerCase(),
      transactionId: transactionId,
      description: descriptionText
    }

    const apiUrl = `${endpoint}/api/transactions/withdraw`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ci": clientId.trim(),
          "cs": clientSecret.trim(),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: "A API demorou muito para responder",
          error: "TIMEOUT",
        }, { status: 504 })
      }
      return NextResponse.json({
        success: false,
        message: "Erro de conexão com a API",
        error: "NETWORK_ERROR",
        details: fetchError.message
      }, { status: 500 })
    }
    
    clearTimeout(timeoutId)

    const responseText = await response.text()
    
    let data
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Resposta inválida da API. Verifique as credenciais.",
        error: "INVALID_RESPONSE",
      }, { status: 500 })
    }

    if (!response.ok) {
      let errorMessage = "Erro ao processar transferência"
      
      if (response.status === 400 && data.message?.toLowerCase().includes("saldo insuficiente")) {
        const match = data.message.match(/faltam\s+([\d.,]+)\s+reais?/i)
        const faltando = match ? match[1] : ""
        
        errorMessage = `Saldo insuficiente na conta MisticPay${faltando ? `. Faltam R$ ${faltando}` : ""}. Adicione saldo na sua conta MisticPay.`
        
        return NextResponse.json({
          success: false,
          message: errorMessage,
          error: "INSUFFICIENT_BALANCE",
          statusCode: response.status,
        }, { status: 400 })
      }
      
      if ((response.status === 401 || response.status === 403) && data.message?.toLowerCase().includes("ip não autorizado")) {
        const ipMatch = data.message.match(/seu IP (\d+\.\d+\.\d+\.\d+)/i)
        const detectedIp = ipMatch ? ipMatch[1] : ""
        
        errorMessage = `IP não autorizado no painel MisticPay${detectedIp ? ` (${detectedIp})` : ""}. Vá até o painel MisticPay e adicione este IP à lista de IPs permitidos.`
        
        return NextResponse.json({
          success: false,
          message: errorMessage,
          error: "IP_NOT_AUTHORIZED",
          detectedIp: detectedIp,
          statusCode: response.status,
        }, { status: response.status })
      }
      
      if (response.status === 500) {
        if (data.message?.toLowerCase().includes("adquirente")) {
          errorMessage = "Erro no processamento do Pix. Possíveis causas: chave Pix inválida ou inexistente, conta MisticPay sem saldo/bloqueada, ou problema temporário no sistema. Verifique os dados e tente novamente."
        } else {
          errorMessage = data.message || "Erro no servidor MisticPay. Tente novamente mais tarde."
        }
        
        return NextResponse.json({
          success: false,
          message: errorMessage,
          error: "SERVER_ERROR",
          statusCode: response.status,
        }, { status: 500 })
      }
      
      switch (response.status) {
        case 401:
          errorMessage = "Credenciais inválidas. Verifique Client ID e Secret no painel admin (senha: 243025)"
          break
        case 403:
          errorMessage = "Acesso negado. Verifique as permissões e IPs autorizados no painel MisticPay"
          break
        case 400:
        case 422:
          errorMessage = data.message || "Dados inválidos. Verifique os campos preenchidos."
          break
        default:
          errorMessage = data.message || errorMessage
      }

      return NextResponse.json({
        success: false,
        message: errorMessage,
        error: data.error || "API_ERROR",
        statusCode: response.status,
      }, { status: response.status })
    }
    
    return NextResponse.json({
      success: true,
      transactionId: data.transactionId || data.id || transactionId,
      transactionFee: data.transactionFee || data.fee || 0,
      transactionAmount: data.transactionAmount || data.amount || numericAmount,
      message: "Transferência realizada com sucesso!",
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Erro ao processar transferência",
      error: "INTERNAL_ERROR",
      details: error?.message
    }, { status: 500 })
  }
}
