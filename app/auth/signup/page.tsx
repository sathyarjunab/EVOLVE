"use client"

import signup from '@/app/serverAction/signupAction';
import { SignupSchema, signupSchema } from '@/util/validator';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      email: "",
      password: "",
    }
  })
  const router = useRouter()


    async function onSubmit(data: SignupSchema) {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await signup(data.name, data.email, data.password, timezone)
      if (res?.success) {
        toast.success(res.message)
        router.push("/")
      } else {
        toast.error(res?.message)
      }
    } catch (err) {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple opacity-20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-lime opacity-10 blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 sm:p-10 relative z-10 mx-4 shadow-2xl transition-transform duration-500 ease-out hover:scale-[1.01]">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#0D0D10] text-purple rounded-2xl flex items-center justify-center p-3 shadow-inner border border-s2">
            <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" opacity=".5" />
              <path d="M7 3.5v4l2.5 1.5" stroke="var(--lime)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="font-outfit text-3xl font-extrabold text-t1 tracking-tighter text-center mb-2">
          Create Account
        </h1>
        <p className="text-t2 text-sm text-center mb-8">
          Join HabitFlow and upgrade your daily routine.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-[0.7rem] font-bold text-t2 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              className="input-field w-full h-[46px] px-4 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
              placeholder="John Doe"
              required
              {...register('name')}
            />
            {errors.name && (
              <p className='text-[0.7rem] mt-1 text-red-500' >{errors.name?.message}</p>
            )}
          </div>
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
            <label className="block text-[0.7rem] font-bold text-t2 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field w-full h-[46px] px-4 pr-10 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
                placeholder="Create a password"
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
            Get Started
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>

        <p className="mt-8 text-center text-[0.85rem] text-t2 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-lime hover:text-white hover:underline transition-colors font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}