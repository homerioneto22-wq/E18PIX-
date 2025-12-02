"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginUser, registerUser } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Shield } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (isAdminLogin) {
      if (!loginPassword) {
        setError("Por favor, informe a senha de administrador")
        return
      }

      const user = loginUser("", loginPassword)

      if (user && user.role === "admin") {
        setSuccess("Login administrativo realizado com sucesso!")
        setTimeout(() => {
          router.push("/admin")
        }, 1000)
      } else {
        setError("Senha de administrador incorreta. Use a senha de um usuário admin cadastrado.")
      }
      return
    }

    if (!loginEmail || !loginPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    const user = loginUser(loginEmail, loginPassword)

    if (user) {
      setSuccess("Login realizado com sucesso!")
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } else {
      setError("Email ou senha incorretos")
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (registerPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerEmail)) {
      setError("Email inválido")
      return
    }

    const success = registerUser(registerName, registerEmail, registerPassword, "user")

    if (success) {
      setSuccess("Cadastro realizado com sucesso! Faça login para continuar.")
      setRegisterName("")
      setRegisterEmail("")
      setRegisterPassword("")
      setRegisterConfirmPassword("")
    } else {
      setError("Este email já está cadastrado")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            E18PIX+
          </h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{isAdminLogin ? "Acesso Administrativo" : "Bem-vindo de volta"}</CardTitle>
                <CardDescription>
                  {isAdminLogin
                    ? "Digite a senha de administrador para acessar o painel"
                    : "Entre com suas credenciais para acessar sua conta"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-500 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  {!isAdminLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{isAdminLogin ? "Senha de Administrador" : "Senha"}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>

                  <Button
                    type="button"
                    variant={isAdminLogin ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setIsAdminLogin(!isAdminLogin)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isAdminLogin ? "Modo Administrador Ativo" : "Entrar como Administrador"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar conta</CardTitle>
                <CardDescription>Preencha os dados abaixo para criar sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-500 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Seu nome"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Criar conta
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
