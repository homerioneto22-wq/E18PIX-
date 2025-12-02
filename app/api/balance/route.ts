import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Saldo gerenciado no cliente",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao consultar saldo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { balance } = await request.json()

    if (typeof balance !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "Saldo inválido",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      balance,
      message: "Saldo confirmado",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao atualizar saldo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 }
    )
  }
}
