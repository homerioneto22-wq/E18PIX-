import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { transactionId, clientId, clientSecret, endpoint } = body

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: "Credenciais da API não configuradas", error: "MISSING_CREDENTIALS" },
        { status: 400 }
      )
    }

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: "ID da transação não fornecido", error: "MISSING_TRANSACTION_ID" },
        { status: 400 }
      )
    }

    const apiEndpoint = endpoint || "https://api.misticpay.com"
    const checkUrl = `${apiEndpoint}/api/transactions/check`

    const response = await fetch(checkUrl, {
      method: "POST",
      headers: {
        "ci": clientId,
        "cs": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId: transactionId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao verificar status: ${response.status}`,
          error: "API_ERROR",
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    const transaction = data.transaction || data
    const isPaid = transaction.transactionState === "COMPLETO" || 
                   transaction.transactionState === "PAID" || 
                   transaction.status === "COMPLETO" || 
                   transaction.status === "PAID" || 
                   transaction.paid === true

    return NextResponse.json({
      success: true,
      status: transaction.transactionState || transaction.status,
      paid: isPaid,
      message: isPaid ? "Pagamento confirmado" : "Aguardando pagamento",
      data: transaction,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    )
  }
}
