"use client"

import { LoginSchema, loginSchema } from '@/util/validator';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import loginAction from '@/app/serverAction/loginAction';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: "",
      password: "",
    }
  })

  const router = useRouter()

  async function onSubmit(data: LoginSchema) {
    try {
      const res = await loginAction(data.email, data.password)
      // The server action returns undefined on success, or {success: false, message:...} on error
      if (res && res.success === false) {
        toast.error(res.message)
      } else {
        toast.success("Welcome back!")
        window.location.href = "/landing?email=" + encodeURIComponent(data.email)
      }
    } catch (err) {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple opacity-20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-lime opacity-10 blur-[100px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 sm:p-10 relative z-10 mx-4 shadow-2xl transition-transform duration-500 ease-out hover:scale-[1.01]">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-[#0D0D10] text-lime rounded-2xl flex items-center justify-center p-3 shadow-inner border border-s2">
            <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
              <path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="font-outfit text-3xl font-extrabold text-t1 tracking-tighter text-center mb-2">
          Welcome back
        </h1>
        <p className="text-t2 text-sm text-center mb-8">
          Enter your details to access your dashboard.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-[0.7rem] font-bold text-t2 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              className="input-field w-full h-[46px] px-4 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
              placeholder="name@example.com"
              required
              {...register('email')}
            />
            {errors.email && (
              <p className='text-[0.7rem] mt-1 text-red-500'>{errors.email?.message}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-[0.7rem] font-bold text-t2 uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs text-purple hover:text-white transition-colors font-semibold">Forgot?</a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field w-full h-[46px] px-4 pr-10 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
                placeholder="••••••••"
                required
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-t2 hover:text-t1 transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='text-[0.7rem] mt-1 text-red-500'>{errors.password?.message}</p>
            )}
          </div>

          <button type="submit" className="auth-btn-primary w-full h-[46px] mt-6 text-[0.95rem] tracking-wide shadow-[0_4px_24px_rgba(200,255,77,0.15)] hover:shadow-[0_6px_30px_rgba(200,255,77,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 group">
            Sign In
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>

        <p className="mt-8 text-center text-[0.85rem] text-t2 font-medium">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-lime hover:text-white hover:underline transition-colors font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}