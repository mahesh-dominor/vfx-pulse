"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl">

        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            🎬 VFX Pulse
          </CardTitle>

          <p className="text-sm text-slate-500">
            Production Management System
          </p>
        </CardHeader>

        <CardContent className="space-y-5">

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="mahesh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="w-full">
            Login
          </Button>

          <p className="text-center text-xs text-slate-400">
            Version 0.2
          </p>

        </CardContent>
      </Card>
    </div>
  );
}