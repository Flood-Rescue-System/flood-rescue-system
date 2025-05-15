"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiAlertTriangle } from "react-icons/fi";

interface DeleteTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName: string;
}

export default function DeleteTeamDialog({
  isOpen,
  onClose,
  onConfirm,
  teamName,
}: DeleteTeamDialogProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <FiAlertTriangle className="w-6 h-6" />
                <Dialog.Title className="text-lg font-semibold">
                  Delete Team
                </Dialog.Title>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the team led by{" "}
                <span className="font-medium text-gray-900">{teamName}</span>?
                This action will also remove all team members and cannot be
                undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Team
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
