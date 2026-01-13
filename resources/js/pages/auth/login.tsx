import InputError from '@/components/input-error'
import TextLink from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import AuthLayout from '@/layouts/auth-layout'
import { appRoutes } from '@/lib/app-routes'
import { Head, useForm } from '@inertiajs/react'

interface LoginProps {
  status?: string
  canResetPassword: boolean
  canRegister: boolean
}

export default function Login({
  status,
  canResetPassword,
  canRegister,
}: LoginProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    user_name: '',
    password: '',
    remember: false,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(appRoutes.login(), {
      onSuccess: () => reset('password'),
    })
  }

  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your username and password below to log in"
    >
      <Head title="Log in" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="user_name">Username</Label>
            <Input
              id="user_name"
              value={data.user_name}
              onChange={(e) => setData('user_name', e.target.value)}
              required
              autoFocus
            />
            <InputError message={errors.user_name} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              {canResetPassword && (
                <TextLink
                  href={appRoutes.password.request()}
                  className="ml-auto text-sm"
                >
                  Forgot password?
                </TextLink>
              )}
            </div>

            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            <InputError message={errors.password} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              checked={data.remember}
              onCheckedChange={(v) => setData('remember', !!v)}
            />
            <Label>Remember me</Label>
          </div>

          <Button type="submit" disabled={processing}>
            {processing && <Spinner />}
            Log in
          </Button>
        </div>

        {canRegister && (
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <TextLink href={appRoutes.register()}>
              Sign up
            </TextLink>
          </div>
        )}
      </form>

      {status && (
        <div className="text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}
    </AuthLayout>
  )
}
