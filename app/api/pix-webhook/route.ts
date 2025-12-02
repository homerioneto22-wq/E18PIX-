import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Extract payment information from webhook
    const {
      transactionId,
      transactionState,
      transactionAmount,
      status,
      amount,
      state,
      id
    } = body

    // Determine the final status and amount
    const paymentStatus = transactionState || status || state
    const paymentAmount = transactionAmount || amount
    const chargeId = transactionId || id

    // Check if payment is confirmed/completed
    const isConfirmed = 
      paymentStatus === "CONFIRMED" ||
      paymentStatus === "confirmed" ||
      paymentStatus === "COMPLETED" ||
      paymentStatus === "completed" ||
      paymentStatus === "PAID" ||
      paymentStatus === "paid"

    if (isConfirmed && paymentAmount) {
      return NextResponse.json({
        success: true,
        message: "Pagamento processado com sucesso",
        data: {
          chargeId,
          amount: paymentAmount,
          status: paymentStatus,
          confirmed: true
        }
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: true,
        message: "Webhook recebido, aguardando confirmação",
        data: {
          chargeId,
          amount: paymentAmount,
          status: paymentStatus,
          confirmed: false
        }
      }, { status: 200 })
    }

  } catch (error) {
    console.error("Erro ao processar webhook PIX:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao processar webhook",
        error: "WEBHOOK_ERROR",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chargeId = searchParams.get("chargeId")

    if (!chargeId) {
      return NextResponse.json(
        {
          success: false,
          message: "chargeId é obrigatório",
          error: "MISSING_CHARGE_ID",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Consulta de status não implementada. Use o webhook para receber notificações.",
      data: {
        chargeId,
        status: "PENDING"
      }
    })

  } catch (error) {
    console.error("Erro ao consultar status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao consultar status do pagamento",
        error: "STATUS_CHECK_ERROR",
      },
      { status: 500 },
    )
  }
}
