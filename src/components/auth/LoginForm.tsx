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
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            🎬 VFX Pulse
          </CardTitle>

          <p className="text-sm text-gray-500 mt-2">
            Production Management System
          </p>
        </CardHeader>

        <CardContent className="space-y-5">

          <div>
            <Label>Email</Label>

            <Input
              type="email"
              placeholder="mahesh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Password</Label>

            <Input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="w-full">
            Login
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}