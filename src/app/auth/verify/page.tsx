"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong");
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div>
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-3xl">&#10003;</span>
        </div>
        <p className="text-lg font-semibold text-green-600 mb-4">{message}</p>
        <Link
          href="/shopping-list"
          className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
        >
          Go to Shopping List
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 text-3xl">&#10007;</span>
      </div>
      <p className="text-lg font-semibold text-red-600 mb-4">{message}</p>
      <Link
        href="/login"
        className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
      >
        Go to Login
      </Link>
    </>
  );
}

export default function AuthVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Home Stock</h1>
        <Suspense
          fallback={
            <div>
              <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading...</p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}