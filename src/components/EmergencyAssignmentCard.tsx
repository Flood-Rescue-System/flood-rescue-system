"use client";

import { useState } from "react";
import {
  FiUser,
  FiMapPin,
  FiDroplet,
  FiPhone,
  FiCheck,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type EmergencyAssignment = {
  id: string;
  emergency_id: string;
  team_lead_id: string;
  status: string;
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
  notes?: string;
  emergency: {
    id: string;
    name: string;
    phone: string;
    affected_people: number;
    water_level: string;
    medical_assistance: string | null;
    latitude: string;
    longitude: string;
    status: string;
    assignment_status: string;
    created_at: string;
  };
};

type EmergencyAssignmentCardProps = {
  assignment: EmergencyAssignment;
  onStatusChange: () => void;
};

export default function EmergencyAssignmentCard({
  assignment,
  onStatusChange,
}: EmergencyAssignmentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getWaterLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "ankle deep":
        return "text-yellow-500";
      case "knee deep":
        return "text-orange-500";
      case "waist deep":
        return "text-red-500";
      case "chest deep":
        return "text-red-600";
      case "above head":
        return "text-red-700";
      default:
        return "text-blue-500";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending_acceptance":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from("rescue_assignments")
        .update({ status: "accepted" })
        .eq("id", assignment.id);

      if (assignmentError) throw assignmentError;

      // Update emergency status
      const { error: emergencyError } = await supabase
        .from("emergency_sos")
        .update({
          status: "in_progress",
          assignment_status: "accepted",
        })
        .eq("id", assignment.emergency_id);

      if (emergencyError) throw emergencyError;

      toast.success("Emergency assignment accepted");
      onStatusChange();
    } catch (error) {
      console.error("Error accepting assignment:", error);
      toast.error("Failed to accept assignment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from("rescue_assignments")
        .update({ status: "rejected" })
        .eq("id", assignment.id);

      if (assignmentError) throw assignmentError;

      // Update emergency status back to pending
      const { error: emergencyError } = await supabase
        .from("emergency_sos")
        .update({
          status: "pending",
          assignment_status: "rejected",
          team_lead_id: null,
        })
        .eq("id", assignment.emergency_id);

      if (emergencyError) throw emergencyError;

      toast.success("Emergency assignment rejected");
      onStatusChange();
    } catch (error) {
      console.error("Error rejecting assignment:", error);
      toast.error("Failed to reject assignment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from("rescue_assignments")
        .update({ status: "completed" })
        .eq("id", assignment.id);

      if (assignmentError) throw assignmentError;

      // Update emergency status
      const { error: emergencyError } = await supabase
        .from("emergency_sos")
        .update({
          status: "resolved",
          assignment_status: "completed",
        })
        .eq("id", assignment.emergency_id);

      if (emergencyError) throw emergencyError;

      toast.success("Emergency marked as resolved");
      onStatusChange();
    } catch (error) {
      console.error("Error completing assignment:", error);
      toast.error("Failed to complete assignment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <FiUser className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-900">
            {assignment.emergency.name}
          </span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
            assignment.status
          )}`}
        >
          {formatStatus(assignment.status)}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2">
          <FiPhone className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">{assignment.emergency.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiMapPin className="w-5 h-5 text-gray-400" />
          <a
            href={`https://maps.google.com/?q=${assignment.emergency.latitude},${assignment.emergency.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View Location
          </a>
        </div>
        <div className="flex items-center gap-2">
          <FiDroplet
            className={`w-5 h-5 ${getWaterLevelColor(
              assignment.emergency.water_level
            )}`}
          />
          <span className="text-gray-600">
            Water Level: {assignment.emergency.water_level}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiUser className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">
            {assignment.emergency.affected_people} people affected
          </span>
        </div>
        {assignment.emergency.medical_assistance && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiAlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-700">
                Medical Assistance Required
              </span>
            </div>
            <p className="text-sm text-red-600 ml-7">
              {assignment.emergency.medical_assistance}
            </p>
          </div>
        )}
      </div>

      {assignment.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes: </span>
            {assignment.notes}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {assignment.status === "pending_acceptance" && (
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiCheck className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiX className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
        {assignment.status === "accepted" && (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Mark as Resolved
          </button>
        )}
      </div>
    </div>
  );
}
