"use client";

import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiSearch,
  FiPhone,
  FiMapPin,
  FiTrash2,
  FiUsers,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { Team } from "@/types/team"; // Create this type file if needed

interface TeamsSectionProps {
  teams: Team[];
  teamMembers: any[];
  loading: boolean;
  teamTab: "leads" | "members";
  searchQuery: string;
  setTeamTab: (tab: "leads" | "members") => void;
  setSearchQuery: (query: string) => void;
  setShowAddTeamModal: (show: boolean) => void;
  setSelectedTeam: (team: Team | null) => void;
  setShowTeamDetailsModal: (show: boolean) => void;
  setTeamToDelete: (team: Team | null) => void;
}

export default function TeamsSection({
  teams,
  teamMembers,
  loading,
  teamTab,
  searchQuery,
  setTeamTab,
  setSearchQuery,
  setShowAddTeamModal,
  setSelectedTeam,
  setShowTeamDetailsModal,
  setTeamToDelete,
}: TeamsSectionProps) {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rescue Teams</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage rescue teams and their members
            </p>
          </div>
          <button
            onClick={() => setShowAddTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiUserPlus className="w-4 h-4" />
            <span>Add Team</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setTeamTab("leads")}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                teamTab === "leads"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Team Leads
            </button>
            <button
              onClick={() => setTeamTab("members")}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                teamTab === "members"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Team Members
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${
                teamTab === "leads" ? "team leads" : "team members"
              }...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full mx-auto" />
          </div>
        ) : teamTab === "leads" ? (
          // Team Leads View
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams
              .filter((team) =>
                team.full_name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((team) => (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowTeamDetailsModal(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {team.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {team.designation}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamToDelete(team);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiPhone className="w-4 h-4" />
                      <span>{team.phone_number}</span>
                    </div>
                    {team.alternate_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiPhone className="w-4 h-4" />
                        <span>{team.alternate_phone}</span>
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
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          // Team Members View
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full mx-auto" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No team members found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers
                  .filter((member) =>
                    member.full_name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <FiUser className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">Team Member</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <FiPhone className="w-4 h-4" />
                          <span>{member.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4" />
                          <span>
                            Joined{" "}
                            {new Date(member.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {member.team_lead && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Team Lead:
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FiUser className="w-4 h-4 text-blue-500" />
                              <span>{member.team_lead.full_name}</span>
                            </div>
                            {member.team_lead.subdivisions && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <FiMapPin className="w-4 h-4 text-gray-400" />
                                <span>
                                  {
                                    member.team_lead.subdivisions.districts
                                      ?.name
                                  }
                                  , {member.team_lead.subdivisions.name}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
