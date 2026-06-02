'use client';
import { FiPlus, FiLoader, FiFrown, FiEye, FiRefreshCw } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import Link from "next/link";
import { GetAllTicket } from '@/services/rideManagementService ';
import { useUserStore } from '@/store/userStore';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { formatPhoneNumber } from "react-phone-input-2";

export default function UserManagementPage() {
  const { users, setUsers, currentPage, setCurrentPage } = useUserStore();
  const [isLoading, setIsLoading] = useState(users.length === 0);
  const [fetchError, setFetchError] = useState(null);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("us");
  const [selectedFilter, setSelectedFilter] = useState("");

  const filterMap = {
    complete: { status: "Completed" },
    pending: { status: "Pending" },
    inprogress: { status: "InProgress" },
    cancel: { status: "Cancelled" },
  };

  const timeoutRef = useRef(null);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFilter(value);
    if (value && filterMap[value]) {
      fetchUserList(1, filterMap[value]);
    } else {
      fetchUserList(1, {});
    }
  };

  const fetchUserList = async (page = currentPage, filter = {}) => {
    try {
      setIsLoading(true);
      setIsSearching(Object.keys(filter).length > 0);
      const response = await GetAllTicket(page, rowsPerPage, filter);
      setUsers(response?.data?.data || []);
      setTotalPages(response?.data?.totalPages || 1);
      if (Object.keys(filter).length > 0 && page !== 1) setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch user list:", err);
      setFetchError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = (searchValue) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (searchValue && searchValue.length >= 3) {
        fetchUserList(1, { phone: searchValue });
      } else if (searchValue === "") {
        fetchUserList(1, {});
        setIsSearching(false);
      }
    }, 800);
  };

  const handlePhoneChange = (value, country) => {
    setInputValue(value);
    setSelectedCountry(country.countryCode);
    if (value.length >= 3) debouncedSearch(value);
    else if (value.length === 0) debouncedSearch("");
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country.countryCode);
    if (inputValue.length >= 3) debouncedSearch(inputValue);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isSearching) fetchUserList(currentPage, {});
  }, [currentPage]);

  const handleRefresh = () => {
    setInputValue("");
    setIsSearching(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    fetchUserList(1, {});
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <style jsx>{`
        .react-tel-input input::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
      `}</style>

      <div className="bg-white shadow-lg border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ticket Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLoading
                ? "Loading..."
                : `Showing ${users.length} Tickets${isSearching ? ' (search results)' : ''}`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 bg-red-50 rounded-lg">
            <FiFrown className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Unable to load data</h3>
            <p className="text-gray-600 mb-4">{fetchError}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <FiPlus className="mx-auto h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isSearching ? "No tickets found for this search" : "No tickets available"}
            </h3>
            {isSearching && (
              <button
                onClick={handleRefresh}
                className="text-indigo-600 hover:text-indigo-800 mt-2 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-indigo-50 text-indigo-700 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left">S.No</th>
                    <th className="px-4 py-3 font-semibold text-left">Email</th>
                    <th className="px-4 py-3 font-semibold text-left">Title</th>
                    <th className="px-4 py-3 font-semibold text-center">Created By</th>
                    <th className="px-4 py-3 font-semibold text-center">Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Time</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                  {users.map((data, index) => (
                    <tr
                      key={data._id}
                      className="hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {isSearching ? index + 1 : (currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{data?.email}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">
                        {data?.title
                          ? data.title.split(" ").slice(0, 4).join(" ") +
                            (data.title.split(" ").length > 4 ? "..." : "")
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${data?.type === "USER"
                              ? "bg-blue-100 text-blue-600"
                              : data?.type === "DRIVER"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"}`}
                        >
                          {data?.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {data?.createdAt
                          ? new Date(data.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {data?.createdAt
                          ? new Date(data.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${data?.Status === "OPEN"
                              ? "bg-yellow-100 text-yellow-800"
                              : data?.Status === "CLOSE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"}`}
                        >
                          {data?.Status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/ticket/${data._id}`}
                          className="inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition"
                        >
                          <FiEye className="w-4 h-4" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
              <div className="flex justify-center items-center p-4 gap-3 bg-gray-50 border-t border-gray-100">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 border rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 border rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {isSearching && (
              <div className="text-center mt-4 text-sm text-gray-500">
                <p>Searching for phone numbers containing: {inputValue}</p>
                <button
                  onClick={handleRefresh}
                  className="text-indigo-600 hover:text-indigo-800 mt-2"
                >
                  Clear search and show all
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
