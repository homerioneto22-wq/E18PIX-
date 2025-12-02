export async function GET() {
  try {
    const fixedIp = process.env.FIXED_IP || process.env.NEXT_PUBLIC_FIXED_IP
    
    if (!fixedIp) {
      return Response.json({
        ip: null,
        message: "IP não configurado. Configure via variáveis de ambiente.",
        isFixed: false,
        isPublic: false,
      })
    }
    
    return Response.json({
      ip: fixedIp,
      message: "IP fixo configurado",
      isFixed: true,
      isPublic: false,
    })
  } catch (error) {
    console.error("Erro ao obter IP:", error)
    return Response.json({ error: "Erro ao obter IP do servidor" }, { status: 500 })
  }
}
