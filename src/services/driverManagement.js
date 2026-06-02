// services/driverManagement.js
import { authorizedFetch } from '@/lib/apiClient';

// Get All Drivers
export async function getAlldriver(page = null, limit = null, filter = {}) {
  const query = new URLSearchParams();

  // ✅ Only include page & limit if filter is empty
  if (Object.keys(filter).length === 0) {
    if (page) query.append("page", page);
    if (limit) query.append("limit", limit);
  }

  // ✅ Pass filters as JSON string
  if (Object.keys(filter).length > 0) {
    query.append("filter", JSON.stringify(filter));
  }

  return authorizedFetch(`/admin/get-all-driver?${query.toString()}`, {
    method: "GET",
  });
}




export async function getdriverById(id) {
  return authorizedFetch(`/admin/get-driver-id?id=${id}`, {
    method: 'GET',
  });
}
export async function getAllUserTripById(id ,page = null, limit = null, filter = {}) {
  const query = new URLSearchParams();
  if (Object.keys(filter).length === 0) {
    if (page) query.append("page", page);
    if (limit) query.append("limit", limit);
  }
  if (Object.keys(filter).length > 0) {
    query.append("filter", JSON.stringify(filter));
  }
  return authorizedFetch(`/admin/get-driver-trips?driverId=${id}&${query.toString()}`, {
    method: "GET",
  });
}


export async function changeStatus(id, action, reason) {

  let body = { id };

  // Handle delete
  if (action === "delete") {
    body.deleted = true;
    return authorizedFetch(`/admin/change-driver-status`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Handle block / unblock
  if (action === "block" || action === "unblock") {
    body.block = action === "block"; // true for block, false for unblock
    return authorizedFetch(`/admin/change-driver-status`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Handle verify / unverify
  if (action === "verify") {
    console.log("action==============================" , action)
    return authorizedFetch(`/admin/verify-by-admin`, {
      method: "POST",
      body: JSON.stringify({
        driverId: id,
        status: true,
      }),
    });
  }

  if (action === "unverify") {
    if (!Array.isArray(reason) || reason.length === 0) {
      throw new Error("Reason array required when unverifying documents");
    }
    return authorizedFetch(`/admin/verify-by-admin`, {
      method: "POST",
      body: JSON.stringify({
        driverId: id,
        status: false,
        reason, // e.g. ["license", "bank"]
      }),
    });
  }
}




export async function getdriverState(id) {
  return authorizedFetch(`/admin/get-driver-trip-state?driverId=${id}`, {
    method: 'GET',
  });
}