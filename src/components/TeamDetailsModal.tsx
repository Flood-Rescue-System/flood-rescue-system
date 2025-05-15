"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  FiX,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiAward,
} from "react-icons/fi";

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    full_name: string;
    phone_number: string;
    alternate_phone?: string;
    designation: string;
    subdivision_id: number;
    created_at: string;
    subdivisions: {
      name: string;
      districts: {
        name: string;
      };
    };
  };
}

export default function TeamDetailsModal({
  isOpen,
  onClose,
  team,
}: TeamDetailsModalProps) {
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
            <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    Team Lead Details
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 mt-1">
                    Detailed information about the team lead
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiUser className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{team.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiAward className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-medium">{team.designation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiPhone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{team.phone_number}</p>
                  </div>
                </div>

                {team.alternate_phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Alternate Phone</p>
                      <p className="font-medium">{team.alternate_phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <FiMapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">
                      {team.subdivisions.districts.name} District,{" "}
                      {team.subdivisions.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Joined Date</p>
                    <p className="font-medium">
                      {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
