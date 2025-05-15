"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { motion } from "framer-motion";

interface LoginChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginChoiceModal({
  isOpen,
  onClose,
}: LoginChoiceModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Login Options
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Demo Login Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">
                      Demo Login
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <motion.a
                        href="/auth/login?demo=admin"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md flex flex-col items-center justify-center gap-1 text-center"
                      >
                        <AdminIcon />
                        <span>Admin</span>
                        <span className="text-xs opacity-75">
                          admin@gmail.com
                        </span>
                      </motion.a>

                      <motion.a
                        href="/auth/login?demo=rescue"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md flex flex-col items-center justify-center gap-1 text-center"
                      >
                        <RescueIcon />
                        <span>Rescue</span>
                        <span className="text-xs opacity-75">
                          rescue@gmail.com
                        </span>
                      </motion.a>

                      <motion.a
                        href="/auth/login?demo=public"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md flex flex-col items-center justify-center gap-1 text-center"
                      >
                        <PublicIcon />
                        <span>Public</span>
                        <span className="text-xs opacity-75">
                          user@gmail.com
                        </span>
                      </motion.a>
                    </div>
                  </div>

                  {/* Normal Login Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">
                      Use Your Account
                    </h4>
                    <motion.a
                      href="/auth/login"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg shadow-md flex items-center justify-center gap-2"
                    >
                      <LoginIcon />
                      Login / Register
                      <span className="text-sm font-normal text-gray-600 ml-1">
                        (Use actual credentials)
                      </span>
                    </motion.a>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function RescueIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function PublicIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
  );
}
