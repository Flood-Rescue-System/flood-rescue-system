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
  FiInfo,
} from "react-icons/fi";

type UserData = {
  id: string;
  email: string;
  role: "super-admin" | "admin" | "rescue" | "public";
  created_at: string;
  status: "active" | "inactive";
};

type DashboardSummary = {
  totalSuperAdmins: number;
  totalAdmins: number;
  totalRescueTeams: number;
  totalPublicUsers: number;
  currentUser?: {
    email: string;
    fullName?: string;
    lastLogin?: string;
  };
};

type SuperAdminProfile = {
  full_name: string;
  designation?: string;
  phone_number?: string;
  emergency_contact?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
};

type UserDetailsModalProps = {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  profile?: SuperAdminProfile;
};

function UserDetailsModal({
  user,
  isOpen,
  onClose,
  isSuperAdmin,
  profile,
}: UserDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<SuperAdminProfile | null>(
    null
  );

  useEffect(() => {
    if (isOpen && isSuperAdmin && user) {
      fetchSuperAdminProfile();
    }
  }, [isOpen, user?.id]);

  const fetchSuperAdminProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("super_admin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {isLoading && isSuperAdmin ? (
          <div className="text-center py-4 text-gray-400">
            Loading profile...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h4 className="text-lg font-medium text-white">
                Basic Information
              </h4>
              <div className="grid gap-4">
                <div>
                  <label className="text-gray-400 text-sm block">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block">Status</label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block">
                    Account Created
                  </label>
                  <p className="text-white">
                    {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Section - Only for Super Admin */}
            {isSuperAdmin && profileData && (
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
                <h4 className="text-lg font-medium text-white">
                  Profile Details
                </h4>
                <div className="grid gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block">
                      Full Name
                    </label>
                    <p className="text-white">{profileData.full_name}</p>
                  </div>
                  {profileData.designation && (
                    <div>
                      <label className="text-gray-400 text-sm block">
                        Designation
                      </label>
                      <p className="text-white">{profileData.designation}</p>
                    </div>
                  )}
                  {profileData.phone_number && (
                    <div>
                      <label className="text-gray-400 text-sm block">
                        Phone Number
                      </label>
                      <p className="text-white">{profileData.phone_number}</p>
                    </div>
                  )}
                  {profileData.emergency_contact && (
                    <div>
                      <label className="text-gray-400 text-sm block">
                        Emergency Contact
                      </label>
                      <p className="text-white">
                        {profileData.emergency_contact}
                      </p>
                    </div>
                  )}
                  {profileData.bio && (
                    <div>
                      <label className="text-gray-400 text-sm block">Bio</label>
                      <p className="text-white">{profileData.bio}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-400 text-sm block">
                      Last Updated
                    </label>
                    <p className="text-white">
                      {new Date(profileData.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "super-admin" | "admin" | "rescue" | "public"
  >("super-admin");
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSuperAdmins: 0,
    totalAdmins: 0,
    totalRescueTeams: 0,
    totalPublicUsers: 0,
  });

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSummary();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let data;
      if (activeTab === "super-admin") {
        const { data: superAdmins, error } = await supabase
          .from("super_admin_accounts")
          .select("*");
        if (error) throw error;
        data = superAdmins;
      } else {
        const { data: users, error } = await supabase
          .from("user_accounts")
          .select("*")
          .eq("role", activeTab);
        if (error) throw error;
        data = users;
      }
      setUsers(data);
    } catch (error: any) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      // Fetch counts
      const [superAdmins, admins, rescue, public_users] = await Promise.all([
        supabase.from("super_admin_accounts").select("id", { count: "exact" }),
        supabase
          .from("user_accounts")
          .select("id", { count: "exact" })
          .eq("role", "admin"),
        supabase
          .from("user_accounts")
          .select("id", { count: "exact" })
          .eq("role", "rescue"),
        supabase
          .from("user_accounts")
          .select("id", { count: "exact" })
          .eq("role", "public"),
      ]);

      // Fetch current user's profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("super_admin_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setSummary({
          totalSuperAdmins: superAdmins.count || 0,
          totalAdmins: admins.count || 0,
          totalRescueTeams: rescue.count || 0,
          totalPublicUsers: public_users.count || 0,
          currentUser: {
            email: user.email!,
            fullName: profile?.full_name,
            lastLogin: user.last_sign_in_at,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/super-admin/login");
    } catch (error: any) {
      toast.error("Failed to logout");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800 fixed w-full z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-white font-semibold">Super Admin</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2"
          >
            {isMobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-gray-800 border-t border-gray-700"
          >
            <div className="p-4 space-y-4">
              {["super-admin", "admin", "rescue", "public"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab as any)}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <FiUsers className="w-5 h-5" />
                  <span>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Users
                  </span>
                </button>
              ))}
              <Link
                href="/super-admin/dashboard/settings"
                className="w-full p-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                <FiSettings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full p-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 bg-gray-800 w-64">
        <div className="p-4 flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="w-8 h-8"
          />
          <span className="text-white font-semibold">Super Admin</span>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {["super-admin", "admin", "rescue", "public"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <FiUsers className="w-5 h-5" />
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)} Users</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <Link
            href="/super-admin/dashboard/settings"
            className="w-full p-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 rounded-lg"
          >
            <FiSettings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full p-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 rounded-lg"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pt-16 md:pt-0">
        {/* Persistent Header Section */}
        <div className="sticky top-16 md:top-0 z-30 bg-gray-900">
          {/* Search Bar */}
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
            <div className="max-w-4xl mx-auto p-4">
              {summary.currentUser?.fullName ? (
                <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                  <h2 className="text-white text-lg font-medium mb-2">
                    Welcome back, {summary.currentUser.fullName}!
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Last login:{" "}
                    {new Date(summary.currentUser.lastLogin!).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                  <p className="text-gray-400">
                    Complete your profile in{" "}
                    <Link
                      href="/super-admin/dashboard/settings"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      settings
                    </Link>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm">Super Admins</p>
                  <p className="text-white text-2xl font-semibold">
                    {summary.totalSuperAdmins}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm">Admins</p>
                  <p className="text-white text-2xl font-semibold">
                    {summary.totalAdmins}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm">Rescue Teams</p>
                  <p className="text-white text-2xl font-semibold">
                    {summary.totalRescueTeams}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm">Public Users</p>
                  <p className="text-white text-2xl font-semibold">
                    {summary.totalPublicUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h2 className="text-xl font-semibold text-white capitalize">
              {activeTab === "super-admin" ? "Super Admin" : activeTab} Users
            </h2>
          </div>
        </div>

        {/* User Cards */}
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center text-gray-300 py-8">
                  Loading...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="col-span-full text-center text-gray-300 py-8">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center">
                        <FiUsers className="w-5 h-5 text-blue-400" />
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-1 truncate">
                      {user.email}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add the modal */}
        <UserDetailsModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          isSuperAdmin={activeTab === "super-admin"}
        />
      </div>
    </div>
  );
}
