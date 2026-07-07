"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function PasswordField({
  value,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        placeholder="Password"
        onChange={(e) => onChange(e.target.value)}
      />

      <button
        type="button"
        className="absolute right-3 top-3"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}