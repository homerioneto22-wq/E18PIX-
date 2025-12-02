"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Printer, Share2, X } from "lucide-react"
import type { Transaction } from "@/app/page"

interface ReceiptModalProps {
  receipt: Transaction
  onClose: () => void
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const shareText = `Recibo de Transferência PIX\n\nData/Hora: ${receipt.date}\nChave Pix: ${receipt.pixKey}\nValor: R$ ${receipt.amount.toFixed(2).replace(".", ",")}\nStatus: ${receipt.status}\n\nE18PIX+`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Recibo de Transferência",
          text: shareText,
        })
      } catch (err) {
        console.error("Erro ao compartilhar:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      alert("Recibo copiado para a área de transferência!")
    }
  }

  const isFee = receipt.fee && receipt.fee > 0
  const totalAmount = receipt.amount

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] w-full p-3 sm:p-6 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="relative pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">E18</span>
              </div>
              <span className="font-bold text-base sm:text-lg text-green-600">E18PIX+</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span>Recibo de Transferência</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3 sm:py-4 space-y-2 sm:space-y-3">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Data/Hora:</span>
              <span className="font-medium text-right">{receipt.date}</span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Tipo de Chave:</span>
              <span className="font-medium">{receipt.pixType}</span>
            </div>

            <div className="flex justify-between gap-2 items-start">
              <span className="text-muted-foreground flex-shrink-0">Chave Pix:</span>
              <span className="font-medium text-right break-all">{receipt.pixKey}</span>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-muted-foreground">Valor Transferido:</span>
              <span className="font-medium">R$ {receipt.amount.toFixed(2).replace(".", ",")}</span>
            </div>

            {isFee && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Taxa (10%):</span>
                <span className="font-medium text-orange-600">R$ {receipt.fee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm sm:text-base font-bold">
              <span>Total Debitado:</span>
              <span className="text-red-600">R$ {totalAmount.toFixed(2).replace(".", ",")}</span>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600 capitalize">{receipt.status}</span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-2.5 sm:p-3 rounded text-[11px] sm:text-xs text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Informações:</p>
            <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
              <li>Transferência realizada via Pix</li>
              <li>Taxa de 10% é informativa</li>
              <li>Guarde este recibo para referência</li>
              {receipt.type === "deposit" && <li>Bônus de 25% será creditado no valor pago</li>}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-4">
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full sm:flex-1 text-xs sm:text-sm h-10 sm:h-9 bg-transparent touch-manipulation"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full sm:flex-1 text-xs sm:text-sm h-10 sm:h-9 bg-transparent touch-manipulation"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={onClose} className="w-full sm:flex-1 text-xs sm:text-sm h-10 sm:h-9 touch-manipulation">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
