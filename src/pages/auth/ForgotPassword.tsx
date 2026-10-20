import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Lock, Mail, Loader2, CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@hooks/useAuth'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPassword() {
  const { resetPassword, isLoading } = useAuth()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email)
      setSubmittedEmail(data.email)
      toast.success('Password reset instructions sent!')
    } catch {
      toast.error('Failed to send reset link. Please try again.')
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased text-slate-900">
      {/* Top Bar with Back Link */}
      <div className="w-full max-w-4xl mx-auto py-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Centered Card Container */}
      <div className="w-full max-w-[420px] mx-auto my-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 sm:p-10 transition-all duration-300">
          {!submittedEmail ? (
            /* =========================================================================
               FORM STATE: Enter Email
            ========================================================================= */
            <div>
              {/* Lock Icon at Top */}
              <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm">
                <Lock className="h-7 w-7" />
              </div>

              {/* Title & Description */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                  Reset Password
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter your registered email and we'll send you a secure link to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      disabled={isLoading}
                      placeholder="you@company.com"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border text-sm text-slate-900 rounded-xl transition duration-150 ease-in-out focus:outline-none focus:bg-white ${
                        errors.email
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold tracking-wide transition duration-150 ease-in-out shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* =========================================================================
               SUCCESS STATE: Link Sent
            ========================================================================= */
            <div className="text-center animate-in fade-in zoom-in-95 duration-200">
              {/* Green Checkmark */}
              <div className="h-16 w-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm ring-8 ring-green-50/50">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Check your email!
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-slate-900 break-all">{submittedEmail}</span>.
                Follow the instructions in the email to set a new password.
              </p>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-md shadow-blue-600/20"
                >
                  Back to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmittedEmail(null)}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
                >
                  Didn't receive email? Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="w-full text-center text-xs text-slate-400 py-4">
        &copy; 2026 Inventory Manager. All rights reserved.
      </footer>
    </div>
  )
}

export default ForgotPassword
