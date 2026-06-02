import { authorizedFetch } from '@/lib/apiClient';



export async function getAllRide(page = null, limit = null, filter = {}) {
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

  return authorizedFetch(`/admin/get-all-ride?${query.toString()}`, {
    method: "GET",
  });
}

export async function getrideById(id) {
  return authorizedFetch(`/admin/get-ride-id?id=${id}`, {
    method: 'GET',
  });
}


export async function getticketById(id) {
  return authorizedFetch(`/admin/get-ticket-id?id=${id}`, {
    method: 'GET',
  });
}

export async function AssignBusDriver(Data) {
  return authorizedFetch(`/admin/assisgn-bus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Data),
  });
}


export async function ChangeStatus(id, status) {
  return authorizedFetch(`/admin/change-ticket-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
}


export async function SendReply(id , email , subject , message  ) {
  return authorizedFetch(`/admin/send-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id , email , subject , message  }),
  });
}
export async function GetAllBusRide(page = null, limit = null, filter = {}) {
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

  return authorizedFetch(`/admin/get-all-bus-ride?${query.toString()}`, {
    method: "GET",
  });
}



export async function GetAllTicket(page = null, limit = null, filter = {}) {
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

  return authorizedFetch(`/admin/get-all-ticket?${query.toString()}`, {
    method: "GET",
  });
}