import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { amount, clientId, clientSecret, endpoint } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais da API não configuradas",
          error: "MISSING_CREDENTIALS",
        },
        { status: 400 },
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valor inválido",
          error: "INVALID_AMOUNT",
        },
        { status: 400 },
      )
    }

    const misticPayUrl = `${endpoint || "https://api.misticpay.com"}/api/transactions/create`
    const transactionId = `CHG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const formattedAmount = Number(amount).toFixed(2)
    const descriptionText = `Recebimento via PixFácil - R$ ${formattedAmount}`

    const requestBody = {
      amount: amount,
      payerName: "Cliente PixFácil",
      payerDocument: "000.000.000-00",
      transactionId: transactionId,
      description: descriptionText,
    }

    const response = await fetch(misticPayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ci: clientId,
        cs: clientSecret,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Erro ao gerar cobrança Pix",
          error: data.error || "API_ERROR",
        },
        { status: response.status },
      )
    }

    const qrCodeUrl = data.qrcodeUrl || data.qrCodeUrl || data.qrcode || data.qrCode || data.data?.qrcodeUrl || data.data?.qrCode
    const copyPaste = data.copyPaste || data.copy_paste || data.pixCopyPaste || data.data?.copyPaste || data.data?.pixCopyPaste

    if (!qrCodeUrl || !copyPaste) {
      return NextResponse.json(
        {
          success: false,
          message: "API retornou dados incompletos (faltam QR Code ou código Pix)",
          error: "INCOMPLETE_RESPONSE",
          debug: { receivedFields: Object.keys(data) }
        },
        { status: 500 },
      )
    }

    const finalChargeId = data.transactionId || data.data?.transactionId || transactionId

    return NextResponse.json({
      success: true,
      qrCode: qrCodeUrl,
      pixCopyPaste: copyPaste,
      chargeId: finalChargeId,
      transactionFee: data.transactionFee || data.data?.transactionFee,
      transactionAmount: data.transactionAmount || data.data?.transactionAmount,
      transactionState: data.transactionState || data.data?.transactionState,
      message: "QR Code gerado com sucesso",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno do servidor",
        error: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
