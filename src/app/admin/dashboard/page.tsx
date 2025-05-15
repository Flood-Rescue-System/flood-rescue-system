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
  FiSearch,
  FiMenu,
  FiX,
  FiAlertCircle,
  FiMapPin,
  FiPackage,
  FiMessageSquare,
  FiGift,
  FiCamera,
  FiDroplet,
  FiHeart,
  FiUser,
  FiPhone,
  FiUserPlus,
  FiTrash2,
} from "react-icons/fi";
import CameraFeed from "@/components/CameraFeed";
import AddCameraModal from "@/components/AddCameraModal";
import CameraFeedManager from "@/components/CameraFeedManager";
import TeamDetailsModal from "@/components/TeamDetailsModal";
import DeleteTeamDialog from "@/components/DeleteTeamDialog";
import TeamsSection from "@/components/TeamsSection";
import AssignEmergencyModal from "@/components/AssignEmergencyModal";
import WaterLevelFeed from "@/components/WaterLevelFeed";
import WaterLevelCameraModal from "@/components/WaterLevelCameraModal";
import type { WaterLevelCamera } from "@/types/water-level";

type DashboardSummary = {
  totalSOS: number;
  activeRescueTeams: number;
  activeCamps: number;
  pendingRequests: number;
  currentUser?: {
    email: string;
    fullName?: string;
    lastLogin?: string;
    subdivision?: string;
  };
};

type SOSRequest = {
  id: string;
  name: string;
  phone: string;
  affected_people: number;
  water_level: string;
  medical_assistance: string | null;
  latitude: string;
  longitude: string;
  status: "pending" | "assigned" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  forwarded: boolean;
  forwarded_at: string | null;
  created_at: string;
  updated_at: string;
};

type Donation = {
  id: string;
  donor_name: string;
  email: string;
  phone: string;
  amount: number;
  payment_status: "pending" | "completed" | "failed";
  payment_id: string | null;
  payment_method: string;
  message: string | null;
  anonymous: boolean;
  created_at: string;
  updated_at: string;
};

type DamLevel = {
  damName: string;
  district: string;
  currentLevel: number;
  fullReservoirLevel: number;
  storagePercentage: number;
  lastUpdated: string;
};

type CameraFeed = {
  id: string;
  location: string;
  streamUrl: string;
  currentLevel?: number | null;
  status: "normal" | "warning" | "critical";
  lastUpdated: string;
  feed_type: "rtsp" | "webcam" | "phone";
  config: any;
};

type TeamLead = {
  id: string;
  full_name: string;
  phone_number: string;
  alternate_phone?: string;
  designation: string;
  subdivision_id: number;
  created_at: string;
};

type TeamMember = {
  id: string;
  team_lead_id: string;
  full_name: string;
  phone_number: string;
  pin: string;
  created_at: string;
};

type Team = TeamLead & {
  members: TeamMember[];
  subdivisions: {
    name: string;
    districts: {
      name: string;
    };
  };
};

type Camp = {
  id: string;
  team_lead_id: string;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  status: "active" | "full" | "closed";
  contact_number: string;
  facilities: string[];
  address: string;
  subdivision_id: number;
  created_at: string;
  updated_at: string;
  subdivisions?: {
    name: string;
    districts: {
      name: string;
    };
  };
};

type Resource = {
  id: string;
  team_lead_id: string;
  name: string;
  type: "food" | "clothing" | "transport" | "medical" | "shelter" | "other";
  quantity: number;
  unit: string;
  provider_name: string;
  provider_type: "shop" | "industry" | "company" | "individual" | "other";
  contact_number: string;
  location: string;
  notes?: string;
  status: "available" | "low" | "unavailable";
  subdivision_id: number;
  created_at: string;
  updated_at: string;
  subdivisions?: {
    name: string;
    districts: {
      name: string;
    };
  };
};

type RescueCamera = {
  id: string;
  team_lead_id: string;
  location_name: string;
  feed_type: "rtsp" | "webcam" | "phone";
  config: any;
  status: "online" | "offline";
  subdivision_id: number;
  created_at: string;
  updated_at: string;
  subdivisions?: {
    name: string;
    districts: {
      name: string;
    };
  };
};

// Add after the type definitions and before the navigationItems array
const getStatusColor = (status: SOSRequest["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "assigned":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-purple-100 text-purple-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getWaterLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "high":
      return "text-red-500";
    case "medium":
      return "text-orange-500";
    case "low":
      return "text-yellow-500";
    default:
      return "text-blue-500";
  }
};

// Update navigationItems array - remove the old water entry
const navigationItems = [
  { id: "sos", label: "Emergency SOS", icon: FiAlertCircle },
  { id: "teams", label: "Rescue Teams", icon: FiUsers },
  { id: "camps", label: "Camps", icon: FiMapPin },
  { id: "resources", label: "Resources", icon: FiPackage },
  { id: "messages", label: "Messages", icon: FiMessageSquare },
  { id: "donations", label: "Donations", icon: FiGift },
  { id: "cameras", label: "Victim Detection", icon: FiCamera },
  { id: "water-levels", label: "Water Levels", icon: FiDroplet },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "sos"
    | "messages"
    | "donations"
    | "water-levels"
    | "teams"
    | "camps"
    | "resources"
    | "cameras"
  >("sos");
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSOS: 0,
    activeRescueTeams: 0,
    activeCamps: 0,
    pendingRequests: 0,
  });
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [sosFilter, setSOSFilter] = useState<
    "all" | "pending" | "assigned" | "in_progress" | "resolved"
  >("all");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageFilter, setMessageFilter] = useState<
    "all" | "unread" | "read" | "replied" | "archived"
  >("all");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [donationFilter, setDonationFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("all");
  const [damLevels, setDamLevels] = useState<DamLevel[]>([]);
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [isLoadingCameraFeeds, setIsLoadingCameraFeeds] = useState(true);
  const [editingFeed, setEditingFeed] = useState<CameraFeed | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [teamTab, setTeamTab] = useState<"leads" | "members">("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoadingCamps, setIsLoadingCamps] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<
    Resource["type"] | "all"
  >("all");
  const [rescueCameras, setRescueCameras] = useState<RescueCamera[]>([]);
  const [isLoadingRescueCameras, setIsLoadingRescueCameras] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<SOSRequest | null>(
    null
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [waterLevelCameras, setWaterLevelCameras] = useState<any[]>([]);
  const [isLoadingWaterLevels, setIsLoadingWaterLevels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<WaterLevelCamera[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSummary();
    if (activeTab === "sos") {
      fetchSOSRequests();
      // Set up real-time subscription
      const subscription = supabase
        .channel("emergency_sos_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "emergency_sos",
          },
          () => fetchSOSRequests()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
    if (activeTab === "messages") {
      fetchMessages();
      const subscription = supabase
        .channel("contact_messages_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contact_messages",
          },
          () => fetchMessages()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
    if (activeTab === "donations") {
      fetchDonations();
      const subscription = supabase
        .channel("donations_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "donations",
          },
          () => fetchDonations()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
    if (activeTab === "water-levels") {
      fetchWaterLevelCameras();
    }
    if (activeTab === "teams") {
      fetchTeams();
    }
    if (activeTab === "camps") {
      fetchCamps();
    }
    if (activeTab === "resources") {
      fetchResources();
    }
    if (activeTab === "cameras") {
      fetchRescueCameras();
    }
  }, [activeTab, teamTab]);

  const fetchSummary = async () => {
    try {
      // Fetch current user's profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Fetch summary data (to be implemented with actual tables)
        const [sos, teams, camps, requests] = await Promise.all([
          supabase
            .from("sos_requests")
            .select("id", { count: "exact" })
            .eq("subdivision", profile?.subdivision),
          supabase
            .from("rescue_teams")
            .select("id", { count: "exact" })
            .eq("subdivision", profile?.subdivision),
          supabase
            .from("camps")
            .select("id", { count: "exact" })
            .eq("subdivision", profile?.subdivision),
          supabase
            .from("resource_requests")
            .select("id", { count: "exact" })
            .eq("subdivision", profile?.subdivision),
        ]);

        setSummary({
          totalSOS: sos.count || 0,
          activeRescueTeams: teams.count || 0,
          activeCamps: camps.count || 0,
          pendingRequests: requests.count || 0,
          currentUser: {
            email: user.email!,
            fullName: profile?.full_name,
            lastLogin: user.last_sign_in_at,
            subdivision: profile?.subdivision,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSOSRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("emergency_sos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSOSRequests(data || []);
    } catch (error) {
      console.error("Error fetching SOS requests:", error);
      toast.error("Failed to load SOS requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchDonations = async () => {
    setIsLoadingDonations(true);
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donations");
    } finally {
      setIsLoadingDonations(false);
    }
  };

  const fetchWaterLevelCameras = async () => {
    try {
      setIsLoadingWaterLevels(true);
      setError(null);

      // Get only active cameras
      const { data, error } = await supabase
        .from("water_level_cameras")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out any invalid cameras
      const validCameras = (data || []).filter(
        (camera) =>
          camera &&
          camera.id &&
          camera.name &&
          camera.roi_coords &&
          typeof camera.min_value === "number" &&
          typeof camera.max_value === "number" &&
          typeof camera.threshold === "number"
      );

      console.log("Valid cameras:", validCameras);
      setCameras(validCameras);
    } catch (err: any) {
      console.error("Error fetching water level cameras:", err);
      setError(err.message || "Failed to load water level cameras");
      setCameras([]); // Clear cameras on error
    } finally {
      setIsLoadingWaterLevels(false);
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: SOSRequest["status"]
  ) => {
    try {
      if (newStatus === "assigned") {
        // Find the emergency and open the assign modal
        const emergency = sosRequests.find((req) => req.id === requestId);
        if (emergency) {
          setSelectedEmergency(emergency);
          setShowAssignModal(true);
        }
        return;
      }

      const { error } = await supabase
        .from("emergency_sos")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Status updated successfully");
      fetchSOSRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleMessageStatus = async (
    messageId: string,
    updates: Partial<ContactMessage>
  ) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update(updates)
        .eq("id", messageId);

      if (error) throw error;
      toast.success("Message updated successfully");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const updateCameraFeedLevel = (data: {
    location_id: string;
    level: number;
    status: "normal" | "warning" | "critical";
  }) => {
    setCameraFeeds((prev) =>
      prev.map((feed) =>
        feed.id === data.location_id
          ? {
              ...feed,
              currentLevel: data.level,
              status: data.status,
              lastUpdated: new Date().toISOString(),
            }
          : feed
      )
    );
  };

  const fetchTeams = async () => {
    try {
      if (teamTab === "leads") {
        // Existing team leads fetch
        const { data: teamLeads, error: teamLeadsError } = await supabase
          .from("team_leads")
          .select(
            `
            *,
            subdivisions (
              name,
              districts (
                name
              )
            )
          `
          )
          .order("created_at", { ascending: false });

        if (teamLeadsError) throw teamLeadsError;
        if (!teamLeads) throw new Error("No team leads found");

        setTeams(teamLeads);
      } else {
        // Fetch team members directly - no need for complex joins
        const { data, error } = await supabase
          .from("team_members")
          .select("*")
          .order("created_at", { ascending: false });

        console.log("Team members query:", {
          data,
          error,
          count: data?.length || 0,
        });

        if (error) throw error;

        // If we have data, fetch the team lead information for each member
        if (data && data.length > 0) {
          // Get unique team lead IDs
          const teamLeadIds = [
            ...new Set(data.map((member) => member.team_lead_id)),
          ];

          if (teamLeadIds.length > 0) {
            // Fetch team lead information
            const { data: teamLeads, error: teamLeadsError } = await supabase
              .from("team_leads")
              .select(
                `
                *,
                subdivisions (
                  name,
                  districts (
                    name
                  )
                )
              `
              )
              .in("id", teamLeadIds);

            if (teamLeadsError) throw teamLeadsError;

            // Attach team lead information to team members
            const enrichedMembers = data.map((member) => {
              const teamLead = teamLeads?.find(
                (lead) => lead.id === member.team_lead_id
              );
              if (teamLead) {
                return {
                  ...member,
                  team_lead: teamLead,
                };
              }
              return member;
            });

            setTeamMembers(enrichedMembers);
          } else {
            setTeamMembers(data);
          }
        } else {
          setTeamMembers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load rescue teams");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      // First delete all team members
      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_lead_id", teamId);

      if (membersError) throw membersError;

      // Then delete the team lead
      const { error: leadError } = await supabase
        .from("team_leads")
        .delete()
        .eq("id", teamId);

      if (leadError) throw leadError;

      toast.success("Team deleted successfully");
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    } finally {
      setTeamToDelete(null); // Close the dialog
    }
  };

  const fetchCamps = async () => {
    try {
      setIsLoadingCamps(true);
      const { data: campData, error } = await supabase
        .from("camps")
        .select(
          `
          *,
          subdivisions (
            name,
            districts (
              name
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCamps(campData || []);
    } catch (error) {
      console.error("Error fetching camps:", error);
      toast.error("Failed to load camps");
    } finally {
      setIsLoadingCamps(false);
    }
  };

  const fetchResources = async () => {
    try {
      setIsLoadingResources(true);
      const { data, error } = await supabase
        .from("resources")
        .select(
          `
          *,
          subdivisions (
            name,
            districts (
              name
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchRescueCameras = async () => {
    try {
      setIsLoadingRescueCameras(true);
      const { data, error } = await supabase
        .from("rescue_cameras")
        .select(
          `
          *,
          subdivisions (
            name,
            districts (
              name
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRescueCameras(data || []);
    } catch (error) {
      console.error("Error fetching rescue cameras:", error);
      toast.error("Failed to load camera feeds");
    } finally {
      setIsLoadingRescueCameras(false);
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    try {
      const { error } = await supabase
        .from("water_level_cameras")
        .delete()
        .eq("id", cameraId);

      if (error) throw error;

      toast.success("Camera deleted successfully");
      fetchWaterLevelCameras();
    } catch (error: any) {
      console.error("Error deleting camera:", error);
      toast.error(error.message || "Failed to delete camera");
    }
  };

  const renderWaterLevel = (camera: WaterLevelCamera) => {
    const level = camera.current_level ?? 0;
    const percentage =
      ((level - camera.min_value) / (camera.max_value - camera.min_value)) *
      100;

    return (
      <div className="flex items-center space-x-2">
        <div className="w-24 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
        <span className="text-sm font-medium">{level}mm</span>
      </div>
    );
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sos":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency SOS Requests
                </h1>
                <div className="flex flex-wrap gap-2">
                  {[
                    "all",
                    "pending",
                    "assigned",
                    "in_progress",
                    "resolved",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSOSFilter(status as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                        sosFilter === status
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingRequests ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading requests...</p>
                </div>
              ) : sosRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No SOS requests found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sosRequests
                    .filter(
                      (request) =>
                        sosFilter === "all" || request.status === sosFilter
                    )
                    .map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <FiUser className="w-5 h-5 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              {request.name}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        </div>

                        <div className="space-y-2.5 mb-4">
                          <div className="flex items-center gap-2">
                            <FiPhone className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600">
                              {request.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiMapPin className="w-5 h-5 text-gray-400" />
                            <a
                              href={`https://maps.google.com/?q=${request.latitude},${request.longitude}`}
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
                                request.water_level
                              )}`}
                            />
                            <span className="text-gray-600">
                              Water Level: {request.water_level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiUser className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600">
                              {request.affected_people} people affected
                            </span>
                          </div>
                          {request.medical_assistance && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <FiHeart className="w-5 h-5 text-red-500" />
                                <span className="font-medium text-red-700">
                                  Medical Assistance Required
                                </span>
                              </div>
                              <p className="text-sm text-red-600 ml-7">
                                {request.medical_assistance}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {request.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(request.id, "assigned")
                              }
                              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Assign Request
                            </button>
                          )}
                          {request.status === "assigned" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(request.id, "in_progress")
                              }
                              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Mark In Progress
                            </button>
                          )}
                          {request.status === "in_progress" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(request.id, "resolved")
                              }
                              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Mark as Resolved
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      case "messages":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Contact Messages
                </h1>
                <div className="flex flex-wrap gap-2">
                  {["all", "unread", "read", "replied", "archived"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setMessageFilter(status as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                          messageFilter === status
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {isLoadingMessages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {messages
                    .filter(
                      (msg) =>
                        messageFilter === "all" || msg.status === messageFilter
                    )
                    .map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {message.name}
                            </h3>
                            <a
                              href={`mailto:${message.email}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {message.email}
                            </a>
                            <p className="text-sm text-gray-500 mt-1">
                              {message.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {new Date(
                                message.created_at
                              ).toLocaleDateString()}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                message.status === "unread"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : message.status === "read"
                                  ? "bg-blue-100 text-blue-800"
                                  : message.status === "replied"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {message.status.charAt(0).toUpperCase() +
                                message.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                          {message.message}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {message.status === "unread" && (
                            <button
                              onClick={() =>
                                handleMessageStatus(message.id, {
                                  status: "read",
                                })
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Mark as Read
                            </button>
                          )}
                          {!message.forwarded && (
                            <button
                              onClick={() =>
                                handleMessageStatus(message.id, {
                                  forwarded: true,
                                  forwarded_at: new Date().toISOString(),
                                  status: "replied",
                                })
                              }
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Forward & Mark Replied
                            </button>
                          )}
                          <a
                            href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Reply via Email
                          </a>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      case "donations":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Donations
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Total: ₹
                    {donations
                      .reduce(
                        (sum, d) =>
                          sum +
                          (d.payment_status === "completed" ? d.amount : 0),
                        0
                      )
                      .toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["all", "pending", "completed", "failed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setDonationFilter(status as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                        donationFilter === status
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingDonations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading donations...</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiGift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No donations found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {donations
                    .filter(
                      (d) =>
                        donationFilter === "all" ||
                        d.payment_status === donationFilter
                    )
                    .map((donation) => (
                      <motion.div
                        key={donation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {donation.anonymous
                                ? "Anonymous Donor"
                                : donation.donor_name}
                            </h3>
                            {!donation.anonymous && (
                              <>
                                <a
                                  href={`mailto:${donation.email}`}
                                  className="text-blue-600 hover:text-blue-800 block"
                                >
                                  {donation.email}
                                </a>
                                <p className="text-sm text-gray-500">
                                  {donation.phone}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">
                              ₹{donation.amount.toLocaleString()}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                donation.payment_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : donation.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {donation.payment_status.charAt(0).toUpperCase() +
                                donation.payment_status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {donation.message && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 italic">
                              "{donation.message}"
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                          <div>
                            <span>
                              Payment Method: {donation.payment_method}
                            </span>
                            {donation.payment_id && (
                              <span className="ml-4">
                                ID: {donation.payment_id}
                              </span>
                            )}
                          </div>
                          <span>
                            {new Date(donation.created_at).toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      case "water-levels":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Water Level Monitoring
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitor water levels in real-time
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Water Level Camera
                </button>
              </div>

              {isLoadingWaterLevels ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading camera feeds...</p>
                </div>
              ) : cameras.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiCamera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No water level cameras configured
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Add a camera to start monitoring water levels
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cameras.map((camera) => (
                    <div
                      key={camera.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="aspect-video bg-black relative">
                        <WaterLevelFeed
                          camera={camera}
                          onDelete={handleDeleteCamera}
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">
                            {camera.name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              (camera.current_level ?? 0) > camera.threshold
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {(camera.current_level ?? 0) > camera.threshold
                              ? "Above Threshold"
                              : "Normal"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Current Level:
                            </span>
                            <span className="font-medium">
                              {renderWaterLevel(camera)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Threshold:</span>
                            <span className="font-medium">
                              {camera.threshold} cm
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                (camera.current_level ?? 0) > camera.threshold
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (((camera.current_level ?? 0) -
                                    camera.min_value) /
                                    (camera.max_value - camera.min_value)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{camera.min_value} cm</span>
                            <span>{camera.max_value} cm</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Last updated:{" "}
                          {new Date(camera.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <WaterLevelCameraModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                setIsModalOpen(false);
                fetchWaterLevelCameras();
              }}
            />
          </div>
        );
      case "teams":
        return (
          <TeamsSection
            teams={teams}
            teamMembers={teamMembers}
            loading={loading}
            teamTab={teamTab}
            searchQuery={searchQuery}
            setTeamTab={setTeamTab}
            setSearchQuery={setSearchQuery}
            setShowAddTeamModal={setShowAddTeamModal}
            setSelectedTeam={setSelectedTeam}
            setShowTeamDetailsModal={setShowTeamDetailsModal}
            setTeamToDelete={setTeamToDelete}
          />
        );
      case "camps":
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Relief Camps
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitor active relief camps and their status
                  </p>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search camps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Camps Grid */}
              {isLoadingCamps ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full mx-auto" />
                </div>
              ) : camps.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No camps found</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {camps
                    .filter(
                      (camp) =>
                        camp.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        camp.location
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                    .map((camp) => (
                      <div
                        key={camp.id}
                        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {camp.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {camp.location}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              camp.status === "active"
                                ? "bg-green-100 text-green-800"
                                : camp.status === "full"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiUsers className="w-4 h-4" />
                            <span>
                              {camp.current_occupancy} / {camp.capacity}{" "}
                              occupants
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiPhone className="w-4 h-4" />
                            <span>{camp.contact_number}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMapPin className="w-4 h-4" />
                            <span>
                              {camp.subdivisions?.districts.name} District,{" "}
                              {camp.subdivisions?.name}
                            </span>
                          </div>
                          {camp.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {camp.facilities.map((facility, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full"
                                >
                                  {facility}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      case "resources": {
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Available Resources
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitor and track rescue resources
                  </p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={resourceTypeFilter}
                  onChange={(e) =>
                    setResourceTypeFilter(
                      e.target.value as Resource["type"] | "all"
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="food">Food</option>
                  <option value="clothing">Clothing</option>
                  <option value="transport">Transport</option>
                  <option value="medical">Medical</option>
                  <option value="shelter">Shelter</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Resources Grid */}
              {isLoadingResources ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full mx-auto" />
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No resources found</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {resources
                    .filter(
                      (resource) =>
                        (resourceTypeFilter === "all" ||
                          resource.type === resourceTypeFilter) &&
                        (resource.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                          resource.provider_name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()))
                    )
                    .map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {resource.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {resource.type}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              resource.status === "available"
                                ? "bg-green-100 text-green-800"
                                : resource.status === "low"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {resource.status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiPackage className="w-4 h-4" />
                            <span>
                              {resource.quantity} {resource.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiUser className="w-4 h-4" />
                            <span>
                              {resource.provider_name} ({resource.provider_type}
                              )
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiPhone className="w-4 h-4" />
                            <span>{resource.contact_number}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMapPin className="w-4 h-4" />
                            <span>
                              {resource.subdivisions?.districts.name} District,{" "}
                              {resource.subdivisions?.name}
                            </span>
                          </div>
                          {resource.notes && (
                            <p className="text-sm text-gray-500 mt-2">
                              {resource.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      case "cameras": {
        return (
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Victim Detection Cameras
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitor rescue team camera statuses
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Camera Grid */}
              {isLoadingRescueCameras ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full mx-auto" />
                </div>
              ) : rescueCameras.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FiCamera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No camera feeds found</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rescueCameras
                    .filter((camera) =>
                      camera.location_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((camera) => (
                      <div
                        key={camera.id}
                        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {camera.location_name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {camera.feed_type} camera
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              camera.status === "online"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {camera.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            {camera.subdivisions?.districts.name} District,{" "}
                            {camera.subdivisions?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      default: {
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
            <span className="font-semibold text-gray-900">Admin Dashboard</span>
          </div>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-white border-b shadow-lg"
          >
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
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
                  href="/admin/dashboard/settings"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 bg-white border-r w-64">
        <div className="p-4 flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="w-8 h-8"
          />
          <span className="font-semibold text-gray-900">Admin Dashboard</span>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
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
            href="/admin/dashboard/settings"
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

      {selectedTeam && (
        <TeamDetailsModal
          isOpen={showTeamDetailsModal}
          onClose={() => {
            setShowTeamDetailsModal(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
        />
      )}

      {teamToDelete && (
        <DeleteTeamDialog
          isOpen={!!teamToDelete}
          onClose={() => setTeamToDelete(null)}
          onConfirm={() => handleDeleteTeam(teamToDelete.id)}
          teamName={teamToDelete.full_name}
        />
      )}

      {/* Add the AssignEmergencyModal */}
      <AssignEmergencyModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        emergency={selectedEmergency}
        onAssigned={() => {
          fetchSOSRequests();
          setShowAssignModal(false);
          setSelectedEmergency(null);
        }}
      />
    </div>
  );
}
