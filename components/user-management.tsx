"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Users, Pencil, Trash2, DollarSign, AlertCircle } from "lucide-react"
import { getUsers, updateUserBalance, deleteUser, updateUser, type User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [balanceAdjustment, setBalanceAdjustment] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getUsers()
    setUsers(allUsers)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setShowEditDialog(true)
  }

  const handleAdjustBalance = (user: User) => {
    setSelectedUser(user)
    setBalanceAdjustment("")
    setShowBalanceDialog(true)
  }

  const handleSaveEdit = () => {
    if (!selectedUser) return

    if (!editName || !editEmail) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    const success = updateUser(selectedUser.id, {
      name: editName,
      email: editEmail,
    })

    if (success) {
      toast({
        title: "Sucesso",
        description: "Dados do usuário atualizados",
      })
      loadUsers()
      setShowEditDialog(false)
      setSelectedUser(null)
    } else {
      toast({
        title: "Erro",
        description: "Falha ao atualizar usuário",
        variant: "destructive",
      })
    }
  }

  const handleSaveBalance = (operation: "set" | "add" | "remove") => {
    if (!selectedUser) return

    const amount = Number.parseFloat(balanceAdjustment)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      })
      return
    }

    let newBalance = selectedUser.balance

    if (operation === "set") {
      newBalance = amount
    } else if (operation === "add") {
      newBalance = selectedUser.balance + amount
    } else if (operation === "remove") {
      newBalance = selectedUser.balance - amount
      if (newBalance < 0) {
        toast({
          title: "Erro",
          description: "Saldo não pode ser negativo",
          variant: "destructive",
        })
        return
      }
    }

    const success = updateUserBalance(selectedUser.id, newBalance)

    if (success) {
      toast({
        title: "Sucesso",
        description: `Saldo ${operation === "set" ? "definido" : operation === "add" ? "adicionado" : "removido"} com sucesso`,
      })
      loadUsers()
      setShowBalanceDialog(false)
      setSelectedUser(null)
    } else {
      toast({
        title: "Erro",
        description: "Falha ao atualizar saldo",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = (user: User) => {
    if (user.role === "admin") {
      toast({
        title: "Erro",
        description: "Não é possível excluir usuários administradores",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
      const success = deleteUser(user.id)

      if (success) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        })
        loadUsers()
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir usuário",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <>
      <Card className="p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold">Gerenciar Clientes</h3>
        </div>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gerencie todos os clientes cadastrados no sistema. Você pode editar dados, ajustar saldos e excluir
            usuários.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado ainda</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-lg">{user.name}</p>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : "Cliente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                    Saldo: R$ {user.balance.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdjustBalance(user)}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Ajustar Saldo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                  {user.role !== "admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Dialog para editar usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente {selectedUser?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome completo"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ajustar saldo */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>Cliente: {selectedUser?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className="text-2xl font-bold">R$ {selectedUser?.balance.toFixed(2).replace(".", ",")}</p>
            </div>

            <div>
              <Label htmlFor="balance-amount">Valor</Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                value={balanceAdjustment}
                onChange={(e) => setBalanceAdjustment(e.target.value)}
                placeholder="0,00"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleSaveBalance("set")}>
              Definir Saldo
            </Button>
            <Button variant="default" onClick={() => handleSaveBalance("add")}>
              Adicionar
            </Button>
            <Button variant="destructive" onClick={() => handleSaveBalance("remove")}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
