"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyCode = async () => {
    if (!signUp) return;

    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        router.push("/app");
      }
    } catch (err) {
      console.error("OTP verification error", err);
      alert("Invalid OTP. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2b0000] px-4">
      <div className="w-full max-w-md bg-[#3a0000] p-8 rounded-xl shadow-lg">

        <h1 className="text-3xl font-bold text-center text-white mb-2">
          MONiA
        </h1>

        <h2 className="text-xl text-center text-white mb-4">
          Verify your email
        </h2>

        <p className="text-gray-300 text-center mb-6">
          We sent a 6-digit verification code to your email address.
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 rounded-lg border border-pink-500 bg-transparent text-white mb-4"
        />

        <button
          onClick={verifyCode}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-lg"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          onClick={() => signUp?.prepareEmailAddressVerification()}
          className="w-full mt-4 text-pink-400"
        >
          Resend Code
        </button>

      </div>
    </div>
  );
}
