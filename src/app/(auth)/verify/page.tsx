"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Verifying...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-3xl">&#10003;</span>
        </div>
        <p className="text-green-600 font-semibold">{message}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 text-3xl">&#10007;</span>
      </div>
      <p className="text-red-600 font-semibold">{message}</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-red-600">
        Home Stock
      </h1>
      <Suspense
        fallback={
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto" />
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}