"use client";

import { Mail, Lock } from "lucide-react";

export default function LoginForm() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl">

      <h2 className="text-2xl font-bold text-white mb-2">
        Login
      </h2>

      <p className="text-slate-400 mb-8">
        Sign in to continue
      </p>

      <div className="space-y-5">

        <div>

          <label className="text-slate-300 text-sm">
            Email
          </label>

          <div className="mt-2 flex items-center bg-[#151F31] border border-slate-700 rounded-xl px-4 h-14">

            <Mail
              size={18}
              className="text-slate-500"
            />

            <input
              type="email"
              placeholder="name@company.com"
              className="ml-3 bg-transparent outline-none text-white w-full"
            />

          </div>

        </div>

        <div>

          <label className="text-slate-300 text-sm">
            Password
          </label>

          <div className="mt-2 flex items-center bg-[#151F31] border border-slate-700 rounded-xl px-4 h-14">

            <Lock
              size={18}
              className="text-slate-500"
            />

            <input
              type="password"
              placeholder="Password"
              className="ml-3 bg-transparent outline-none text-white w-full"
            />

          </div>

        </div>

        <button className="w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition text-black font-bold text-lg">

          Login

        </button>

        <button className="w-full text-slate-400 hover:text-white">

          Forgot Password?

        </button>

      </div>

    </div>
  );
}