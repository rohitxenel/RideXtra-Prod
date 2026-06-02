'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  FiPlus,
  FiLoader,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiX,
  FiSave,
  FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';
import { GetBankAccountType, AddBankAccountType, EditBankAccountType, DeleteBankAccountType, ChangeStatusAccountType } from '@/services/admincontrol';

function formatDateTime(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min} ${ampm}`;
}

// ----- API wrappers -----
async function apiGetAllBankTypes() {
  const res = await GetBankAccountType();
  if (res?.statusCode === 200 && res?.status) {
    return res?.data?.data || [];
  }
  return [];
}

async function apiCreateBankType(name) {
  return await AddBankAccountType({ bankaccountType: name });
}

async function apiUpdateBankType(id, name) {
  return await EditBankAccountType({ id, bankaccountType: name });
}
async function apiDeleteBankType(id) {
  return await DeleteBankAccountType(id);
}
async function apiToggleBankTypeStatus(id, status) {
  return await ChangeStatusAccountType(id, status);
}

async function runApi(fn, { onErrorMessage = 'Something went wrong.' } = {}) {
  try {
    return await fn();
  } catch (err) {
    console.error(onErrorMessage, err);
    const message = err?.response?.data?.message || err?.message || onErrorMessage;
    throw new Error(message);
  }
}

// ✅ Confirm Modal
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="p-4 text-gray-700">{message}</div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
            <FiX className="inline mr-1" /> Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <FiLoader className="inline mr-1 animate-spin" /> : <FiSave className="inline mr-1" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// 📝 Add/Edit Modal
function BankTypeFormModal({ open, mode, value, onChange, onClose, onSubmit, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{mode === 'add' ? 'Add Bank Type' : 'Edit Bank Type'}</h3>
        </div>
        <div className="p-4">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter bank type name"
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-2">Minimum 2 characters.</p>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
            <FiX className="inline mr-1" /> Cancel
          </button>
          <button
            disabled={loading || !value || value.trim().length < 2}
            onClick={onSubmit}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <FiLoader className="inline mr-1 animate-spin" /> : <FiSave className="inline mr-1" />}
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ⚠️ Inline alert
function ErrorPanel({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3">
      <div className="flex items-center gap-2">
        <FiAlertTriangle /> <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-100"
        >
          <FiRefreshCw className="w-4 h-4" /> Retry
        </button>
      )}
    </div>
  );
}

// 🔔 Tiny toast system (right-side pop)
function Toaster({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-3">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-[360px] rounded-lg shadow-lg px-4 py-3 text-sm
                      ${t.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {t.type === 'error' ? <FiAlertTriangle /> : <FiSave />}
            </div>
            <div className="flex-1 leading-5">{t.message}</div>
            <button
              onClick={() => onClose(t.id)}
              className="text-gray-500 hover:text-gray-700 -mr-1 -mt-1 p-1"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BankTypeManagementPage() {
  const [bankTypes, setBankTypes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // Toast state
  const [toasts, setToasts] = useState([]);
  const pushToast = (message, type = 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    // auto-dismiss in 4s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  const closeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [draftName, setDraftName] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState({ title: '', message: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => async () => { });

  // Load list (initial + after every action)
  const loadList = async () => {
    setLoadingList(true);
    setListError('');
    try {
      const data = await runApi(() => apiGetAllBankTypes(), {
        onErrorMessage: 'Failed to load bank types.',
      });
      setBankTypes(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setListError(err.message);
      pushToast(err.message, 'error'); // side toast for API error
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // Open Add
  const openAdd = () => {
    setFormMode('add');
    setDraftName('');
    setEditingItem(null);
    setFormOpen(true);
  };

  // Open Edit
  const openEdit = (item) => {
    setFormMode('edit');
    setEditingItem(item);
    setDraftName(item?.bankaccountType || '');
    setFormOpen(true);
  };

  // Confirmation wrapper
  const askConfirm = ({ title, message, action }) => {
    setConfirmMeta({ title, message });
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  // Submit Add/Edit -> ask confirm -> run API -> refresh list
  const handleFormSubmit = () => {
    if (formMode === 'add') {
      askConfirm({
        title: 'Confirm Add',
        message: `Add new bank type: "${draftName}"?`,
        action: async () => {
          setConfirmLoading(true);
          try {
            await runApi(() => apiCreateBankType(draftName.trim()), {
              onErrorMessage: 'Failed to add bank type.',
            });
            setFormOpen(false);
            await loadList(); // refresh from API
          } catch (err) {
            pushToast(err.message, 'error'); // ⬅️ replaced alert
          } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
          }
        },
      });
    } else {
      askConfirm({
        title: 'Confirm Save',
        message: `Save changes to "${editingItem?.bankaccountType}" → "${draftName}"?`,
        action: async () => {
          setConfirmLoading(true);
          try {
            await runApi(() => apiUpdateBankType(editingItem._id, draftName.trim()), {
              onErrorMessage: 'Failed to update bank type.',
            });
            setFormOpen(false);
            await loadList(); // refresh
          } catch (err) {
            pushToast(err.message, 'error'); // ⬅️ replaced alert
          } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
          }
        },
      });
    }
  };

  // Delete -> refresh
  const handleDelete = (item) => {
    askConfirm({
      title: 'Confirm Delete',
      message: `Delete bank type "${item?.bankaccountType}"? This cannot be undone.`,
      action: async () => {
        setConfirmLoading(true);
        try {
          await runApi(() => apiDeleteBankType(item._id), { onErrorMessage: 'Failed to delete bank type.' });
          await loadList(); // refresh
        } catch (err) {
          pushToast(err.message, 'error'); // ⬅️ replaced alert
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      },
    });
  };

  // Toggle status -> refresh
  const handleToggle = (item) => {
    const nextStatus = !item?.status; // flip current
    askConfirm({
      title: 'Confirm Status Change',
      message: `Change status of "${item?.bankaccountType}" to ${nextStatus ? 'Active' : 'Inactive'}?`,
      action: async () => {
        setConfirmLoading(true);
        try {
          await runApi(() => apiToggleBankTypeStatus(item._id, nextStatus), {
            onErrorMessage: 'Failed to change status.',
          });
          await loadList(); // ✅ refresh list every time
        } catch (err) {
          pushToast(err.message, 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      },
    });
  };


  const rows = useMemo(() => bankTypes, [bankTypes]);

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bank Type Management</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FiPlus /> Add Bank Type
          </button>
        </div>

        {/* Error panel + retry */}
        <ErrorPanel message={listError} onRetry={loadList} />

        {loadingList ? (
          <div className="flex justify-center py-12">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No Bank Types Found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">S.No.</th>
                <th className="px-4 py-2">Bank Type</th>
                <th className="px-4 py-2">Added</th>
                <th className="px-4 py-2">Edit</th>
                <th className="px-4 py-2">Delete</th>
                <th className="px-4 py-2">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((b, i) => (
                <tr key={b?._id || b?.id || `${b?.bankaccountType}-${i}`}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{b?.bankaccountType}</td>
                  <td>{b?.createdAt ? formatDateTime(b?.createdAt) : '-'}</td>

                  {/* Edit */}
                  <td>
                    <button
                      onClick={() => openEdit(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg 
                                 bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Delete */}
                  <td>
                    <button
                      onClick={() => handleDelete(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg 
                                 bg-red-100 text-red-700 hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Toggle Status (color-only switch) */}
                  <button
                    onClick={() => handleToggle(b)}
                    role="switch"
                    aria-checked={Boolean(b?.status)}
                    aria-label={b?.status ? 'Active' : 'Inactive'}
                    title={b?.status ? 'Active' : 'Inactive'}
                    className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300
              ${b?.status
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
                  >
                    {/* ON label */}
                    <span
                      className={`absolute inset-y-0 left-0 w-1/2 grid place-items-center text-[10px] font-semibold uppercase
                ${b?.status ? 'opacity-100 text-white' : 'opacity-0'}`}
                    >
                      ON
                    </span>
                    {/* OFF label */}
                    <span
                      className={`absolute inset-y-0 right-0 w-1/2 grid place-items-center text-[10px] font-semibold uppercase
                ${b?.status ? 'opacity-0' : 'opacity-100 text-white'}`}
                    >
                      OFF
                    </span>

                    {/* Thumb */}
                    <span
                      className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md flex items-center justify-center
                transition-all duration-300
                ${b?.status ? 'translate-x-[24px]' : 'translate-x-0'}`}
                    >
                      {b?.status ? (
                        <FiToggleRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <FiToggleLeft className="h-3 w-3 text-rose-500" />
                      )}
                    </span>
                  </button>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      <BankTypeFormModal
        open={formOpen}
        mode={formMode}
        value={draftName}
        onChange={setDraftName}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={false}
      />

      {/* Confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmMeta.title}
        message={confirmMeta.message}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        loading={confirmLoading}
      />

      {/* Right-side toasts */}
      <Toaster toasts={toasts} onClose={closeToast} />
    </div>
  );
}
