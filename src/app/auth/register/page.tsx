"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import AdminRegistrationForm from "@/components/auth/AdminRegistrationForm";
import RescueRegistrationForm from "@/components/auth/RescueRegistrationForm";
import PublicRegistrationForm from "@/components/auth/PublicRegistrationForm";

type Role = "admin" | "rescue" | "public" | null;

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const roles = [
    {
      id: "admin",
      title: "Administrator",
      description: "Register as a district administrator",
      icon: AdminIcon,
    },
    {
      id: "rescue",
      title: "Rescue Team",
      description: "Register as a rescue team member",
      icon: RescueIcon,
    },
    {
      id: "public",
      title: "General Public",
      description: "Register as a general user",
      icon: PublicIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="p-4 flex justify-between items-center bg-white shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-xl font-bold text-gray-900">
            Flood Rescue System
          </span>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            {!selectedRole ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Create an Account
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Choose your role to get started
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <motion.button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as Role)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-500 text-left transition-colors"
                    >
                      <role.icon className="w-12 h-12 text-blue-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {role.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {role.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <BackIcon className="w-5 h-5" />
                  Choose different role
                </button>

                {selectedRole === "admin" && <AdminRegistrationForm />}
                {selectedRole === "rescue" && <RescueRegistrationForm />}
                {selectedRole === "public" && <PublicRegistrationForm />}
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function AdminIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function RescueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function PublicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}
