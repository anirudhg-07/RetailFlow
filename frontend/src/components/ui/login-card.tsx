"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginCard() {
  return (
  <div className="relative flex w-full items-center justify-center overflow-hidden">
      {/* Login Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col gap-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sign In
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" className="mt-1" />
          </div>
        </div>

        <Button className="mt-2 w-full">Login</Button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-300">
          Don’t have an account?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
