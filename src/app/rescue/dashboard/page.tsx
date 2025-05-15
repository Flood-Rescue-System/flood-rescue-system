"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiMapPin,
  FiPackage,
  FiCamera,
  FiUserCheck,
  FiEdit2,
  FiToggleLeft,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import TeamLoginModal from "@/components/TeamLoginModal";
import { UserSession } from "@/types/session";
import { Camp } from "@/types/camp";
import AddCampModal from "@/components/AddCampModal";
import BulkOccupancyModal from "@/components/BulkOccupancyModal";
import { Resource } from "@/types/resource";
import AddResourceModal from "@/components/AddResourceModal";
import { TeamMember } from "@/types/team";
import RescueCameraFeed from "@/components/RescueCameraFeed";
import AddRescueCameraModal from "@/components/AddRescueCameraModal";
import EmergencyAssignmentCard from "@/components/EmergencyAssignmentCard";

const navigationItems = [
  { id: "team", label: "Team Members", icon: FiUsers },
  { id: "assignments", label: "SOS Assignments", icon: FiAlertTriangle },
  { id: "camps", label: "Camp Management", icon: FiMapPin },
  { id: "resources", label: "Resources", icon: FiPackage },
  { id: "camera", label: "Victim Detection", icon: FiCamera },
];

const resourceTypes: Resource["type"][] = [
  "food",
  "clothing",
  "transport",
  "medical",
  "shelter",
  "other",
];

export default function RescueDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("team");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | undefined>(undefined);
  const [bulkUpdateCamp, setBulkUpdateCamp] = useState<Camp | undefined>(
    undefined
  );
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>(
    undefined
  );
  const [selectedResourceType, setSelectedResourceType] = useState<
    Resource["type"] | "all"
  >("all");
  const [cameras, setCameras] = useState<RescueCamera[]>([]);
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<RescueCamera | undefined>(
    undefined
  );
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "pending_acceptance" | "accepted" | "rejected" | "completed"
  >("all");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check if profile is completed
    const { data: profile } = await supabase
      .from("team_leads")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile?.is_profile_completed) {
      router.push("/rescue/settings");
      return;
    }

    // Load team members
    const { data: members } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_lead_id", user.id);

    setTeamMembers(members || []);

    // Check if we have an active session
    const savedSession = localStorage.getItem("rescue_session");
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = async ({
    type,
    memberId,
  }: {
    type: "lead" | "member";
    memberId?: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get team lead profile
      const { data: profile } = await supabase
        .from("team_leads")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      const sessionData: UserSession = {
        type,
        userId: type === "lead" ? user.id : memberId!,
        teamLeadId: user.id,
        fullName:
          type === "lead"
            ? profile.full_name
            : teamMembers.find((m) => m.id === memberId)?.full_name || "",
      };

      setSession(sessionData);
      localStorage.setItem("rescue_session", JSON.stringify(sessionData));
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login");
    }
  };

  const handleLogout = async () => {
    try {
      // Clear the rescue session first
      localStorage.removeItem("rescue_session");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("rescue_session");
    setShowLoginModal(true);
    setShowUserMenu(false);
  };

  const fetchCamps = async () => {
    try {
      const { data: camps, error } = await supabase
        .from("camps")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCamps(camps || []);
    } catch (error) {
      console.error("Error fetching camps:", error);
      toast.error("Failed to load camps");
    }
  };

  const fetchResources = async () => {
    try {
      let query = supabase.from("resources").select("*");

      if (selectedResourceType !== "all") {
        query = query.eq("type", selectedResourceType);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    }
  };

  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase
        .from("rescue_cameras")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCameras(data || []);
    } catch (error) {
      console.error("Error fetching cameras:", error);
      toast.error("Failed to load cameras");
    }
  };

  const fetchAssignments = async () => {
    if (!session) return;

    setIsLoadingAssignments(true);
    try {
      const { data, error } = await supabase
        .from("rescue_assignments")
        .select(
          `
          *,
          emergency:emergency_id (
            id,
            name,
            phone,
            affected_people,
            water_level,
            medical_assistance,
            latitude,
            longitude,
            status,
            assignment_status,
            created_at
          )
        `
        )
        .eq("team_lead_id", session.teamLeadId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (activeTab === "camps") {
      fetchCamps();
    }
    if (activeTab === "resources") {
      fetchResources();
    }
    if (activeTab === "camera") {
      fetchCameras();
    }
    if (activeTab === "assignments") {
      fetchAssignments();
    }
  }, [activeTab]);

  const handleEditCamp = (camp: Camp) => {
    setEditingCamp(camp);
    setShowAddCampModal(true);
  };

  const handleUpdateStatus = async (camp: Camp) => {
    try {
      // Only allow manual closure/reopening
      const newStatus = camp.status === "closed" ? "active" : "closed";

      const { error } = await supabase
        .from("camps")
        .update({ status: newStatus })
        .eq("id", camp.id);

      if (error) throw error;

      fetchCamps();
      toast.success(`Camp ${newStatus === "closed" ? "closed" : "reopened"}`);
    } catch (error) {
      console.error("Error updating camp status:", error);
      toast.error("Failed to update camp status");
    }
  };

  const handleUpdateOccupancy = async (camp: Camp, change: number) => {
    try {
      const newOccupancy = camp.current_occupancy + change;

      // Validate occupancy limits
      if (newOccupancy < 0) {
        toast.error("Occupancy cannot be negative");
        return;
      }
      if (newOccupancy > camp.capacity) {
        toast.error("Cannot exceed maximum capacity");
        return;
      }

      // Automatically update status based on occupancy
      let status = camp.status;
      if (camp.status !== "closed") {
        // Don't change status if camp is manually closed
        if (newOccupancy === 0) status = "active";
        else if (newOccupancy === camp.capacity) status = "full";
        else if (newOccupancy < camp.capacity) status = "active";
      }

      const { error } = await supabase
        .from("camps")
        .update({
          current_occupancy: newOccupancy,
          status,
        })
        .eq("id", camp.id);

      if (error) throw error;

      fetchCamps();
      toast.success("Occupancy updated");
    } catch (error) {
      console.error("Error updating occupancy:", error);
      toast.error("Failed to update occupancy");
    }
  };

  const handleUpdateResourceStatus = async (resource: Resource) => {
    try {
      const newStatus =
        resource.status === "unavailable" ? "available" : "unavailable";

      const { error } = await supabase
        .from("resources")
        .update({ status: newStatus })
        .eq("id", resource.id);

      if (error) throw error;

      fetchResources();
      toast.success(`Resource marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating resource status:", error);
      toast.error("Failed to update resource status");
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    try {
      const { error } = await supabase
        .from("rescue_cameras")
        .delete()
        .eq("id", cameraId);

      if (error) throw error;

      toast.success("Camera feed deleted successfully");
      fetchCameras(); // Refresh the camera list
    } catch (error) {
      console.error("Error deleting camera:", error);
      toast.error("Failed to delete camera feed");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "team":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Team Members
                </h2>
                <Link
                  href="/rescue/settings"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <FiSettings className="w-4 h-4" />
                  <span>Manage in Settings</span>
                </Link>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No team members added yet</p>
                  <Link
                    href="/rescue/settings"
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                  >
                    Add members in Settings
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {member.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {member.phone_number}
                          </p>
                        </div>
                        {session?.type === "lead" && (
                          <Link
                            href="/rescue/settings"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiSettings className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "assignments":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency Assignments
                </h1>
                <div className="flex flex-wrap gap-2">
                  {[
                    "all",
                    "pending_acceptance",
                    "accepted",
                    "rejected",
                    "completed",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => setAssignmentFilter(status as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                        assignmentFilter === status
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all"
                        ? "All"
                        : status
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingAssignments ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiAlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No emergency assignments found
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assignments
                    .filter(
                      (assignment) =>
                        assignmentFilter === "all" ||
                        assignment.status === assignmentFilter
                    )
                    .map((assignment) => (
                      <EmergencyAssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onStatusChange={fetchAssignments}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      case "camps":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Camp Management
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage evacuation camps and monitor their status
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCampModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add New Camp
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                </div>
              ) : camps.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No camps added yet</p>
                  <button
                    onClick={() => setShowAddCampModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Add your first camp
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full group hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {camp.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {camp.address}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              camp.status === "active"
                                ? "bg-green-100 text-green-800"
                                : camp.status === "full"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {camp.status.charAt(0).toUpperCase() +
                              camp.status.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMapPin className="w-4 h-4" />
                            {camp.location}
                          </p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <p>Occupancy:</p>
                              <div className="flex items-center gap-2">
                                {session?.type === "lead" &&
                                camp.status !== "closed" ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        handleUpdateOccupancy(camp, -1)
                                      }
                                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
                                      disabled={camp.current_occupancy <= 0}
                                      title="Decrease occupancy"
                                    >
                                      <FiMinus className="w-4 h-4" />
                                    </button>
                                    <span className="w-12 text-center font-medium">
                                      {camp.current_occupancy}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateOccupancy(camp, 1)
                                      }
                                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:hover:bg-transparent"
                                      disabled={
                                        camp.current_occupancy >= camp.capacity
                                      }
                                      title="Increase occupancy"
                                    >
                                      <FiPlus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span>{camp.current_occupancy}</span>
                                )}
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  camp.status === "closed"
                                    ? "bg-gray-400"
                                    : camp.current_occupancy === camp.capacity
                                    ? "bg-yellow-500"
                                    : camp.current_occupancy >
                                      camp.capacity * 0.8
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (camp.current_occupancy / camp.capacity) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-right text-gray-500">
                              Capacity: {camp.capacity}
                            </p>
                          </div>

                          <p className="text-sm text-gray-600">
                            Contact: {camp.contact_number}
                          </p>
                        </div>
                      </div>

                      {session?.type === "lead" && (
                        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                          <button
                            onClick={() => setBulkUpdateCamp(camp)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                            title="Bulk Update Occupancy"
                          >
                            <FiUsers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCamp(camp)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                            title="Edit Camp Details"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(camp)}
                            className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                              camp.status === "closed"
                                ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            }`}
                            title={
                              camp.status === "closed"
                                ? "Reopen Camp"
                                : "Close Camp"
                            }
                          >
                            <FiToggleLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "resources":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Resource Management
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage available resources and their providers
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={selectedResourceType}
                    onChange={(e) =>
                      setSelectedResourceType(
                        e.target.value as Resource["type"] | "all"
                      )
                    }
                    className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  {session?.type === "lead" && (
                    <button
                      onClick={() => setShowAddResourceModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                      Add Resource
                    </button>
                  )}
                </div>
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No resources added yet</p>
                  {session?.type === "lead" && (
                    <button
                      onClick={() => setShowAddResourceModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Add your first resource
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full group hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {resource.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {resource.type}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              resource.status === "available"
                                ? "bg-green-100 text-green-800"
                                : resource.status === "low"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {resource.status.charAt(0).toUpperCase() +
                              resource.status.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="flex justify-between items-center">
                            <p>Quantity:</p>
                            <p className="font-medium">
                              {resource.quantity} {resource.unit}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              Provider Details
                            </p>
                            <p className="mt-1">
                              {resource.provider_name}{" "}
                              <span className="text-gray-500">
                                ({resource.provider_type})
                              </span>
                            </p>
                            <p>{resource.contact_number}</p>
                          </div>
                          <p className="flex items-center gap-2">
                            <FiMapPin className="w-4 h-4" />
                            {resource.location}
                          </p>
                          {resource.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500">
                                {resource.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {session?.type === "lead" && (
                        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingResource(resource);
                              setShowAddResourceModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                            title="Edit Resource"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateResourceStatus(resource)}
                            className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                              resource.status === "unavailable"
                                ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            }`}
                            title={
                              resource.status === "unavailable"
                                ? "Mark as Available"
                                : "Mark as Unavailable"
                            }
                          >
                            <FiToggleLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "camera":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Camera Feeds
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage camera feeds and monitor areas
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCameraModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Camera
                </button>
              </div>

              {cameras.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiCamera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No cameras added yet</p>
                  <button
                    onClick={() => setShowAddCameraModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Add your first camera
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cameras.map((camera) => (
                    <div key={camera.id} className="relative group">
                      <RescueCameraFeed camera={camera} />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => setEditingCamera(camera)}
                          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCamera(camera.id)}
                          className="p-2 bg-red-500/50 hover:bg-red-500/70 text-white rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">Coming Soon</h1>
              <p className="text-gray-600 mt-2">
                This feature is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white border-b z-30">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-6 h-6 text-gray-600" />
              ) : (
                <FiMenu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <span className="font-semibold text-gray-900">
              Rescue Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <FiUserCheck className="w-5 h-5 text-gray-600" />
            </button>
            {showUserMenu && (
              <div className="absolute right-2 top-14 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.type === "lead" ? "Team Lead" : "Team Member"}
                  </p>
                </div>
                <button
                  onClick={handleSwitchUser}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Switch User
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-white border-b shadow-lg"
          >
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-gray-100 pt-2">
                <Link
                  href="/rescue/settings"
                  className="w-full p-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full p-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 bg-white border-r w-64">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="w-8 h-8"
            />
            <span className="font-semibold text-gray-900">
              Rescue Dashboard
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FiUserCheck className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session?.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.type === "lead" ? "Team Lead" : "Team Member"}
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchUser}
              className="mt-2 w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Switch User
            </button>
          </div>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 border-t">
          <Link
            href="/rescue/settings"
            className="w-full p-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <FiSettings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full p-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="md:ml-64 pt-16 md:pt-0">{renderContent()}</div>

      {/* Modals */}
      <TeamLoginModal
        isOpen={showLoginModal}
        onClose={() => router.push("/auth/login")}
        onLogin={handleLogin}
        teamMembers={teamMembers}
      />

      <AddCampModal
        isOpen={showAddCampModal}
        onClose={() => {
          setShowAddCampModal(false);
          setEditingCamp(undefined);
        }}
        onSuccess={() => {
          fetchCamps();
          setEditingCamp(undefined);
        }}
        editingCamp={editingCamp}
      />

      <BulkOccupancyModal
        isOpen={!!bulkUpdateCamp}
        onClose={() => setBulkUpdateCamp(undefined)}
        onSuccess={() => {
          fetchCamps();
          setBulkUpdateCamp(undefined);
        }}
        camp={bulkUpdateCamp}
      />

      <AddResourceModal
        isOpen={showAddResourceModal}
        onClose={() => {
          setShowAddResourceModal(false);
          setEditingResource(undefined);
        }}
        onSuccess={() => {
          fetchResources();
          setEditingResource(undefined);
        }}
        editingResource={editingResource}
      />

      <AddRescueCameraModal
        isOpen={showAddCameraModal}
        onClose={() => {
          setShowAddCameraModal(false);
          setEditingCamera(undefined);
        }}
        onSuccess={() => {
          fetchCameras();
          setEditingCamera(undefined);
        }}
        editingCamera={editingCamera}
      />
    </div>
  );
}
