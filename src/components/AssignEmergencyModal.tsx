"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiX, FiUsers, FiAlertTriangle, FiCheck } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type Team = {
  id: string;
  full_name: string;
  phone_number: string;
  subdivision_id: number;
  subdivision_name?: string;
  district_name?: string;
};

type EmergencySOS = {
  id: string;
  name: string;
  phone: string;
  affected_people: number;
  water_level: string;
  medical_assistance: string | null;
  latitude: string;
  longitude: string;
  status: "pending" | "assigned" | "in_progress" | "resolved";
  assignment_status?: string;
  team_lead_id?: string;
  created_at: string;
  updated_at: string;
};

type AssignEmergencyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  emergency: EmergencySOS | null;
  onAssigned: () => void;
};

export default function AssignEmergencyModal({
  isOpen,
  onClose,
  emergency,
  onAssigned,
}: AssignEmergencyModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notes, setNotes] = useState("");
  const [resolveDirectly, setResolveDirectly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("team_leads")
        .select(
          `
          *,
          subdivisions:subdivision_id (
            name,
            districts (
              name
            )
          )
        `
        )
        .order("full_name");

      if (error) throw error;

      const formattedTeams = data.map((team) => ({
        id: team.id,
        full_name: team.full_name,
        phone_number: team.phone_number,
        subdivision_id: team.subdivision_id,
        subdivision_name: team.subdivisions?.name,
        district_name: team.subdivisions?.districts?.name,
      }));

      setTeams(formattedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAssign = async () => {
    if (!emergency) return;

    if (resolveDirectly) {
      await handleResolveDirectly();
      return;
    }

    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setIsLoading(true);
    try {
      // Get current user (admin)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // Get admin profile
      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from("rescue_assignments")
        .insert({
          emergency_id: emergency.id,
          team_lead_id: selectedTeamId,
          status: "pending_acceptance",
          assigned_by: adminProfile?.user_id,
          notes: notes,
        });

      if (assignmentError) throw assignmentError;

      // Update emergency status
      const { error: updateError } = await supabase
        .from("emergency_sos")
        .update({
          status: "assigned",
          assignment_status: "pending_acceptance",
          team_lead_id: selectedTeamId,
        })
        .eq("id", emergency.id);

      if (updateError) throw updateError;

      toast.success("Emergency assigned successfully");
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Error assigning emergency:", error);
      toast.error("Failed to assign emergency");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDirectly = async () => {
    if (!emergency) return;

    setIsLoading(true);
    try {
      // Update emergency status to resolved
      const { error: updateError } = await supabase
        .from("emergency_sos")
        .update({
          status: "resolved",
          assignment_status: "completed",
        })
        .eq("id", emergency.id);

      if (updateError) throw updateError;

      toast.success("Emergency marked as resolved");
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Error resolving emergency:", error);
      toast.error("Failed to resolve emergency");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Assign Emergency
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                {emergency && (
                  <div className="mb-6">
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <FiAlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Emergency Details
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p className="font-medium">{emergency.name}</p>
                            <p>Phone: {emergency.phone}</p>
                            <p>Affected People: {emergency.affected_people}</p>
                            <p>Water Level: {emergency.water_level}</p>
                            {emergency.medical_assistance && (
                              <p className="text-red-600">
                                Medical: {emergency.medical_assistance}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={resolveDirectly}
                          onChange={(e) => setResolveDirectly(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          Resolve directly (no team assignment needed)
                        </span>
                      </label>
                    </div>

                    {!resolveDirectly && (
                      <>
                        <div className="mb-4">
                          <label
                            htmlFor="team"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Select Rescue Team
                          </label>
                          {isFetching ? (
                            <div className="py-2 text-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                          ) : teams.length === 0 ? (
                            <div className="text-center py-2 text-sm text-gray-500">
                              No rescue teams available
                            </div>
                          ) : (
                            <select
                              id="team"
                              value={selectedTeamId}
                              onChange={(e) =>
                                setSelectedTeamId(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select a team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.full_name} - {team.subdivision_name},{" "}
                                  {team.district_name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="mb-4">
                          <label
                            htmlFor="notes"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Notes (Optional)
                          </label>
                          <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Add any additional information for the rescue team"
                          />
                        </div>
                      </>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAssign}
                        disabled={isLoading || (isFetching && !resolveDirectly)}
                        className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          resolveDirectly
                            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                        } ${
                          (isLoading || (isFetching && !resolveDirectly)) &&
                          "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? (
                          <span className="inline-flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </span>
                        ) : resolveDirectly ? (
                          <span className="inline-flex items-center">
                            <FiCheck className="mr-2 h-4 w-4" />
                            Resolve Emergency
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <FiUsers className="mr-2 h-4 w-4" />
                            Assign Team
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
