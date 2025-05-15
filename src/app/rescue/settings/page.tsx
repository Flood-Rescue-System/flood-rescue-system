"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { FiUser, FiUsers, FiLock, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

type TeamMember = {
  id: string;
  full_name: string;
  phone_number: string;
  pin: string;
};

type TeamLead = {
  full_name: string;
  phone_number: string;
  alternate_phone: string;
  designation: string;
  department: string;
  team_type: "camp" | "rescue" | "resource";
  station_name: string;
  station_address: string;
  subdivision_id: number;
  years_of_experience: number;
  specializations: string[];
  available_24x7: boolean;
  is_profile_completed: boolean;
};

export default function RescueSettings() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "members" | "security"
  >("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Team Lead Profile State
  const [teamLead, setTeamLead] = useState<TeamLead>({
    full_name: "",
    phone_number: "",
    alternate_phone: "",
    designation: "",
    department: "",
    team_type: "rescue",
    station_name: "",
    station_address: "",
    subdivision_id: 0,
    years_of_experience: 0,
    specializations: [],
    available_24x7: true,
    is_profile_completed: false,
  });

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Security State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's subdivision_id from user_accounts
      const { data: userData, error: userError } = await supabase
        .from("user_accounts")
        .select("subdivision_id")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Load or create team lead profile
      let { data: profile, error: profileError } = await supabase
        .from("team_leads")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create a new one
        const { data: newProfile, error: createError } = await supabase
          .from("team_leads")
          .insert({
            id: user.id,
            full_name: "",
            phone_number: "",
            designation: "",
            department: "",
            team_type: "rescue",
            station_name: "",
            station_address: "",
            subdivision_id: userData.subdivision_id,
            is_profile_completed: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      setTeamLead({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        alternate_phone: profile.alternate_phone || "",
        designation: profile.designation || "",
        department: profile.department || "",
        team_type: profile.team_type || "rescue",
        station_name: profile.station_name || "",
        station_address: profile.station_address || "",
        subdivision_id: profile.subdivision_id,
        years_of_experience: profile.years_of_experience || 0,
        specializations: profile.specializations || [],
        available_24x7: profile.available_24x7 ?? true,
        is_profile_completed: profile.is_profile_completed || false,
      });

      // Load team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_lead_id", user.id);

      if (membersError) throw membersError;

      setTeamMembers(members || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("team_leads").upsert({
        id: user.id,
        ...teamLead,
        is_profile_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = () => {
    setTeamMembers([
      ...teamMembers,
      {
        id: `temp-${Date.now()}`,
        full_name: "",
        phone_number: "",
        pin: "",
      },
    ]);
  };

  const handleSaveMembers = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Filter out empty entries and validate PIN format
      const validMembers = teamMembers.filter(
        (m) =>
          m.full_name &&
          m.phone_number &&
          m.pin &&
          m.pin.length === 4 &&
          /^\d{4}$/.test(m.pin)
      );

      if (validMembers.length === 0) {
        toast.error("No valid members to save");
        return;
      }

      // Delete all existing members first
      const { error: deleteError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_lead_id", user.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw new Error("Failed to update team members");
      }

      // Insert all members as new entries
      const { error: insertError } = await supabase.from("team_members").insert(
        validMembers.map((member) => ({
          team_lead_id: user.id,
          full_name: member.full_name,
          phone_number: member.phone_number,
          pin: member.pin,
        }))
      );

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // Fetch the updated list
      const { data: updatedMembers, error: fetchError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_lead_id", user.id);

      if (fetchError) throw fetchError;

      setTeamMembers(updatedMembers || []);
      toast.success("Team members updated successfully");
    } catch (error: any) {
      console.error("Error details:", error);
      toast.error(error.message || "Failed to update team members");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/rescue/dashboard"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Settings
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b overflow-x-auto">
            <nav className="flex whitespace-nowrap min-w-full">
              {[
                { id: "profile", label: "Team Lead Profile", icon: FiUser },
                { id: "members", label: "Team Members", icon: FiUsers },
                { id: "security", label: "Security", icon: FiLock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 md:px-6 py-4 flex items-center gap-2 border-b-2 transition-colors flex-1 justify-center ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "profile" && (
            <div className="p-6">
              {!teamLead.is_profile_completed && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    Please complete your profile to access all features.
                  </p>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProfile();
                  }}
                >
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={teamLead.full_name}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={teamLead.phone_number}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alternate Phone Number
                      </label>
                      <input
                        type="tel"
                        value={teamLead.alternate_phone}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            alternate_phone: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Fire Force Officer"
                        value={teamLead.designation}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            designation: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Fire and Rescue Services"
                        value={teamLead.department}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            department: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Type
                      </label>
                      <select
                        required
                        value={teamLead.team_type}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            team_type: e.target.value as TeamLead["team_type"],
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="rescue">Rescue Operations</option>
                        <option value="camp">Camp Management</option>
                        <option value="resource">Resource Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Station Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Central Fire Station"
                        value={teamLead.station_name}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            station_name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Station Address
                      </label>
                      <textarea
                        required
                        value={teamLead.station_address}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            station_address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={teamLead.years_of_experience}
                          onChange={(e) =>
                            setTeamLead({
                              ...teamLead,
                              years_of_experience:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specializations (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={teamLead.specializations.join(", ")}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            specializations: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          })
                        }
                        placeholder="e.g., Water Rescue, First Aid, Firefighting"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="available24x7"
                        checked={teamLead.available_24x7}
                        onChange={(e) =>
                          setTeamLead({
                            ...teamLead,
                            available_24x7: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="available24x7"
                        className="text-sm text-gray-700"
                      >
                        Available for 24x7 Emergency Response
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Complete Profile"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Team Members
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Member
                    </button>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">
                        No team members added yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                required
                                value={member.full_name}
                                onChange={(e) => {
                                  const updatedMembers = [...teamMembers];
                                  updatedMembers[index] = {
                                    ...member,
                                    full_name: e.target.value,
                                  };
                                  setTeamMembers(updatedMembers);
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                required
                                value={member.phone_number}
                                onChange={(e) => {
                                  const updatedMembers = [...teamMembers];
                                  updatedMembers[index] = {
                                    ...member,
                                    phone_number: e.target.value,
                                  };
                                  setTeamMembers(updatedMembers);
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                PIN (4 digits)
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={4}
                                pattern="\d{4}"
                                value={member.pin}
                                onChange={(e) => {
                                  const pin = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 4);
                                  const updatedMembers = [...teamMembers];
                                  updatedMembers[index] = {
                                    ...member,
                                    pin,
                                  };
                                  setTeamMembers(updatedMembers);
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updatedMembers = teamMembers.filter(
                                (_, i) => i !== index
                              );
                              setTeamMembers(updatedMembers);
                            }}
                            className="mt-4 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove Member
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {teamMembers.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveMembers}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save Team Members"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="p-6">
              <div className="max-w-full">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Security Settings
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your team lead account password. Make sure to use a
                    strong password that you haven't used before.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleChangePassword();
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4 md:pr-6 md:border-r border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwords.current}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              current: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords({ ...passwords, new: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              confirm: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 md:pl-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          Password Requirements
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Minimum 6 characters long</li>
                          <li>• Include numbers and letters</li>
                          <li>• Avoid using personal information</li>
                          <li>• Don't reuse old passwords</li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving
                            ? "Updating..."
                            : "Update Team Lead Password"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
