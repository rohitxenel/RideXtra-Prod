'use client';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/apiConfig';
import {
  FiPlus, FiLoader, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiX, FiSave, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { 
  GetAllVehicleData, 
  AddNewVehicle, 
  EditVehiclePrice, 
  DeleteVehicleType, 
  ChangeStatusAccountType,
  getCancellationFeeSettings,
  updateCancellationFeeSettings,
} from '@/services/admincontrol';

// ---------- Helpers ----------
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

async function GetVehicleData() {
  const res = await GetAllVehicleData();
  if (res?.statusCode === 200 && res?.status) return res?.data?.data || [];
  return [];
}

async function AddVehicleType(payload) {
  return await AddNewVehicle(payload);
}
async function EditVehiclePrices(id, payload) {
  return await EditVehiclePrice({ id, ...payload });
}
async function deleteVehicleType(id) {
  return await DeleteVehicleType(id);
}
async function apiToggleBankTypeStatus(id, status) {
  return await ChangeStatusAccountType(id, status);
}

async function runApi(fn, { onErrorMessage = 'Something went wrong.' } = {}) {
  try {
    return await fn();
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || onErrorMessage;
    const wrapped = new Error(message);
    if (err?.status != null) wrapped.status = err.status;
    if (err?.data != null) wrapped.data = err.data;
    throw wrapped;
  }
}

// ---------- UI Components ----------
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

function Toaster({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-3">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-[360px] rounded-lg shadow-lg px-4 py-3 text-sm
                      ${t.type === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
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

// ---------- Vehicle Modal ----------
function VehicleFormModal({ open, mode, value, onChange, onClose, onSubmit, loading }) {
  if (!open) return null;

  const setField = (k, v) => onChange({ ...value, [k]: v });

  const onlyLetters = (s) => s.replace(/[^a-zA-Z\s-]/g, '');
  const numSanitize = (s) => s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); 

  const isValidName = value.VehicalType?.trim().length >= 2;
  const isValidNumber = (n) => n !== '' && !Number.isNaN(Number(n));
  const formValid =
    isValidName &&
    ['baseprice', 'timeprice', 'distaceprice', 'plateformfees']
      .every(k => isValidNumber(value[k]));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl">
        <div className="p-6 border-b">
          <h3 className="font-semibold">{mode === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}</h3>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Vehicle Type', key: 'VehicalType', placeholder: 'e.g., Mini, Sedan', transform: onlyLetters },
            { label: 'Base Price', key: 'baseprice' },
            { label: 'Time Price', key: 'timeprice' },
            { label: 'Distance Price', key: 'distaceprice' },
            { label: 'Platform Fees (%)', key: 'plateformfees' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-600">{f.label}</label>
              <input
                value={value[f.key]}
                onChange={(e) =>
                  setField(f.key, f.transform ? f.transform(e.target.value) : numSanitize(e.target.value))
                }
                placeholder={f.placeholder || '0'}
                inputMode="decimal"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
            <FiX className="inline mr-1" /> Cancel
          </button>
          <button
            disabled={loading || !formValid}
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

// ---------- Main Component ----------
export default function FareManagementPage() {
  const [vehicleData, setVehicleData] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  const [toasts, setToasts] = useState([]);
  const pushToast = (message, type = 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const closeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    VehicalType: '',
    baseprice: '',
    timeprice: '',
    distaceprice: '',
    plateformfees: '',
  });
  const [editingItem, setEditingItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState({ title: '', message: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => async () => {});

  const [cancellationFees, setCancellationFees] = useState({
    acceptedFee: '',
    arrivedFee: '',
    updatedAt: '',
  });
  const [loadingCancellationFees, setLoadingCancellationFees] = useState(true);
  const [cancellationFeesError, setCancellationFeesError] = useState('');
  const [cancellationFeesApiReady, setCancellationFeesApiReady] = useState(false);
  const [savingCancellationFees, setSavingCancellationFees] = useState(false);

  const cancellationApiPath = `${API_BASE_URL}/admin/cancellation-fee-settings`;
  const CANCELLATION_API_404_MSG =
    `Backend API missing (404). Backend must expose GET and POST ${cancellationApiPath} — then restart the API. Save is disabled until then.`;

  const loadCancellationFees = async () => {
    setLoadingCancellationFees(true);
    setCancellationFeesError('');
    setCancellationFeesApiReady(false);
    try {
      const res = await runApi(() => getCancellationFeeSettings(), {
        onErrorMessage: 'Failed to load cancellation fees.',
      });
      const data = res?.data ?? res;
      setCancellationFees({
        acceptedFee: String(data?.acceptedFee ?? ''),
        arrivedFee: String(data?.arrivedFee ?? ''),
        updatedAt: data?.updatedAt || '',
      });
      setCancellationFeesApiReady(true);
    } catch (err) {
      const is404 = err?.status === 404 || /\(404\)|\b404\b/.test(String(err?.message || ''));
      if (is404) {
        setCancellationFeesError(CANCELLATION_API_404_MSG);
        setCancellationFees({ acceptedFee: '2', arrivedFee: '3', updatedAt: '' });
      } else {
        setCancellationFeesError(err.message);
      }
    } finally {
      setLoadingCancellationFees(false);
    }
  };

  const handleSaveCancellationFees = () => {
    if (!cancellationFeesApiReady) {
      pushToast(CANCELLATION_API_404_MSG, 'error');
      return;
    }
    const acceptedFee = Number(cancellationFees.acceptedFee);
    const arrivedFee = Number(cancellationFees.arrivedFee);
    if (
      cancellationFees.acceptedFee === '' ||
      cancellationFees.arrivedFee === '' ||
      Number.isNaN(acceptedFee) ||
      Number.isNaN(arrivedFee) ||
      acceptedFee < 0 ||
      arrivedFee < 0
    ) {
      pushToast('Enter valid non-negative fees for both fields.', 'error');
      return;
    }
    askConfirm({
      title: 'Save cancellation fees',
      message: `Set driver en route fee to $${acceptedFee} and at pickup fee to $${arrivedFee}?`,
      action: async () => {
        setConfirmLoading(true);
        setSavingCancellationFees(true);
        try {
          await runApi(
            () => updateCancellationFeeSettings({ acceptedFee, arrivedFee }),
            { onErrorMessage: 'Failed to save cancellation fees.' }
          );
          pushToast('Cancellation fees updated.', 'success');
          await loadCancellationFees();
        } catch (err) {
          pushToast(err.message, 'error');
        } finally {
          setConfirmLoading(false);
          setSavingCancellationFees(false);
          setConfirmOpen(false);
        }
      },
    });
  };

  const loadList = async () => {
    setLoadingList(true);
    setListError('');
    try {
      const data = await runApi(() => GetVehicleData(), { onErrorMessage: 'Failed to load vehicle types.' });
      setVehicleData(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setListError(err.message);
      pushToast(err.message, 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
    loadCancellationFees();
  }, []);

  const openAdd = () => {
    setFormMode('add');
    setFormData({
      VehicalType: '',
      baseprice: '',
      timeprice: '',
      distaceprice: '',
      plateformfees: '',
    });
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setFormMode('edit');
    setEditingItem(item);
    setFormData({
      VehicalType: item?.VehicalType || '',
      baseprice: String(item?.baseprice ?? ''),
      timeprice: String(item?.timeprice ?? ''),
      distaceprice: String(item?.distaceprice ?? ''),
      plateformfees: String(item?.plateformfees ?? ''),
    });
    setFormOpen(true);
  };

  const askConfirm = ({ title, message, action }) => {
    setConfirmMeta({ title, message });
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleFormSubmit = () => {
    if (formMode === 'add') {
      askConfirm({
        title: 'Confirm Add',
        message: `Add new vehicle "${formData.VehicalType}"?`,
        action: async () => {
          setConfirmLoading(true);
          try {
            await runApi(
              () => AddVehicleType({ ...formData, cancelprice: 0 }),
              { onErrorMessage: 'Failed to add vehicle.' }
            );
            setFormOpen(false);
            await loadList();
          } catch (err) {
            pushToast(err.message, 'error');
          } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
          }
        },
      });
    } else {
      askConfirm({
        title: 'Confirm Save',
        message: `Save changes to "${editingItem?.VehicalType}"?`,
        action: async () => {
          setConfirmLoading(true);
          try {
            await runApi(() => EditVehiclePrices(editingItem._id, formData), { onErrorMessage: 'Failed to update vehicle.' });
            setFormOpen(false);
            await loadList();
          } catch (err) {
            pushToast(err.message, 'error');
          } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
          }
        },
      });
    }
  };

  const handleDelete = (item) => {
    askConfirm({
      title: 'Confirm Delete',
      message: `Delete vehicle "${item?.VehicalType}"? This cannot be undone.`,
      action: async () => {
        setConfirmLoading(true);
        try {
          await runApi(() => deleteVehicleType(item._id), { onErrorMessage: 'Failed to delete vehicle.' });
          await loadList();
        } catch (err) {
          pushToast(err.message, 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      },
    });
  };

  const handleToggle = (item) => {
    const nextStatus = !item?.status;
    askConfirm({
      title: 'Confirm Status Change',
      message: `Change status of "${item?.VehicalType}" to ${nextStatus ? 'Active' : 'Inactive'}?`,
      action: async () => {
        setConfirmLoading(true);
        try {
          await runApi(() => apiToggleBankTypeStatus(item._id, nextStatus), { onErrorMessage: 'Failed to change status.' });
          await loadList();
        } catch (err) {
          pushToast(err.message, 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      },
    });
  };

  const rows = useMemo(() => vehicleData, [vehicleData]);

  const numSanitize = (s) => s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Cancellation fees</h2>
          {cancellationFees.updatedAt && (
            <span className="text-xs text-gray-500">
              Last updated: {formatDateTime(cancellationFees.updatedAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Flat USD fees charged when a rider cancels after a driver is assigned, based on ride
          status (Accepted / Arrived).
        </p>
        <ErrorPanel message={cancellationFeesError} onRetry={loadCancellationFees} />
        {loadingCancellationFees ? (
          <div className="flex justify-center py-8">
            <FiLoader className="animate-spin h-6 w-6 text-indigo-600" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">
                Driver en route (status: Accepted)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  value={cancellationFees.acceptedFee}
                  onChange={(e) =>
                    setCancellationFees((prev) => ({
                      ...prev,
                      acceptedFee: numSanitize(e.target.value),
                    }))
                  }
                  inputMode="decimal"
                  className="w-full border rounded-lg pl-7 pr-4 py-2"
                  placeholder="2"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">
                Driver at pickup (status: Arrived)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  value={cancellationFees.arrivedFee}
                  onChange={(e) =>
                    setCancellationFees((prev) => ({
                      ...prev,
                      arrivedFee: numSanitize(e.target.value),
                    }))
                  }
                  inputMode="decimal"
                  className="w-full border rounded-lg pl-7 pr-4 py-2"
                  placeholder="3"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveCancellationFees}
              disabled={savingCancellationFees || loadingCancellationFees || !cancellationFeesApiReady}
              title={!cancellationFeesApiReady ? 'Waiting for backend cancellation-fee-settings API' : undefined}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingCancellationFees ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiSave />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fare Management</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FiPlus /> Add New Vehicle
          </button>
        </div>

        <ErrorPanel message={listError} onRetry={loadList} />

        {loadingList ? (
          <div className="flex justify-center py-12">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No Vehicles Found</div>
        ) : (
          <table className="min-w-full border border-gray-200 text-sm text-center rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr className="text-gray-700 font-semibold">
                <th className="px-6 py-4">S.No.</th>
                <th className="px-6 py-4">Vehicle Type</th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4">Time Price</th>
                <th className="px-6 py-4">Distance Price</th>
                <th className="px-6 py-4">Platform Fees (%)</th>
                <th className="px-6 py-4">Edit</th>
                <th className="px-6 py-4">Delete</th>
                <th className="px-6 py-4">Change Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-800">
              {rows.map((b, i) => (
                <tr key={b?._id || `${b?.VehicalType}-${i}`} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">{i + 1}</td>
                  <td className="font-medium px-6 py-4">{b?.VehicalType}</td>
                  <td className="px-6 py-4">{b?.baseprice || 0}</td>
                  <td className="px-6 py-4">{b?.timeprice || 0}</td>
                  <td className="px-6 py-4">{b?.distaceprice || 0}</td>
                  <td className="px-6 py-4">{b?.plateformfees || 0} %</td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEdit(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg 
                                 bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg 
                                 bg-red-100 text-red-700 hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(b)}
                      role="switch"
                      aria-checked={Boolean(b?.status)}
                      className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300
                        ${b?.status ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                    : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-1/2 grid place-items-center text-[10px] font-semibold uppercase
                          ${b?.status ? 'opacity-100 text-white' : 'opacity-0'}`}
                      >
                        ON
                      </span>
                      <span
                        className={`absolute inset-y-0 right-0 w-1/2 grid place-items-center text-[10px] font-semibold uppercase
                          ${b?.status ? 'opacity-0' : 'opacity-100 text-white'}`}
                      >
                        OFF
                      </span>
                      <span
                        className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md flex items-center justify-center
                          transition-all duration-300 ${b?.status ? 'translate-x-[24px]' : 'translate-x-0'}`}
                      >
                        {b?.status ? (
                          <FiToggleRight className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <FiToggleLeft className="h-3 w-3 text-rose-500" />
                        )}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <VehicleFormModal
        open={formOpen}
        mode={formMode}
        value={formData}
        onChange={setFormData}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={false}
      />

      <ConfirmModal
        open={confirmOpen}
        title={confirmMeta.title}
        message={confirmMeta.message}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        loading={confirmLoading}
      />

      <Toaster toasts={toasts} onClose={closeToast} />
    </div>
  );
}
