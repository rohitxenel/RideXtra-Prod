'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  FiPlus, FiLoader, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiX, FiSave, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { GetAllVehicleData, AddNewVehicle, EditVehiclePrice, DeleteVehicleType, ChangeStatusAccountType } from '@/services/admincontrol';

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
  console.log("add vehicle" , payload)
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
    throw new Error(message);
  }
}

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

function VehicleFormModal({ open, mode, value, onChange, onClose, onSubmit, loading }) {
  if (!open) return null;

  const setField = (k, v) => onChange({ ...value, [k]: v });

  const onlyLetters = (s) => s.replace(/[^a-zA-Z\s-]/g, '');
  const numSanitize = (s) =>
    s.replace(/[^\d.]/g, '')
     .replace(/(\..*)\./g, '$1'); // single decimal

  const isValidName = value.VehicalType?.trim().length >= 2;
  const isValidNumber = (n) => n !== '' && !Number.isNaN(Number(n));
  const formValid =
    isValidName &&
    ['baseprice', 'timeprice', 'distaceprice', 'plateformfees', 'cancelprice']
      .every(k => isValidNumber(value[k]));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{mode === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}</h3>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Vehicle Type</label>
            <input
              value={value.VehicalType}
              onChange={(e) => setField('VehicalType', onlyLetters(e.target.value))}
              placeholder="e.g., Mini, Sedan"
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-[11px] text-gray-500 mt-1">Letters, spaces, hyphen only.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Base Price</label>
            <input
              value={value.baseprice}
              onChange={(e) => setField('baseprice', numSanitize(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Time Price</label>
            <input
              value={value.timeprice}
              onChange={(e) => setField('timeprice', numSanitize(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Distance Price</label>
            <input
              value={value.distaceprice}
              onChange={(e) => setField('distaceprice', numSanitize(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Platform Fees (%)</label>
            <input
              value={value.plateformfees}
              onChange={(e) => setField('plateformfees', numSanitize(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Cancel Price</label>
            <input
              value={value.cancelprice}
              onChange={(e) => setField('cancelprice', numSanitize(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
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

export default function BankTypeManagementPage() {
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
  const emptyForm = {
    VehicalType: '',
    baseprice: '',
    timeprice: '',
    distaceprice: '',
    plateformfees: '',
    cancelprice: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState({ title: '', message: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => async () => {});

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

  useEffect(() => { loadList(); }, []);

  const openAdd = () => {
    setFormMode('add');
    setFormData(emptyForm);
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
      cancelprice: String(item?.cancelprice ?? ''),
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
            await runApi(() => AddVehicleType(formData), { onErrorMessage: 'Failed to add vehicle.' });
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

  return (
    <div className="p-4">
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
          <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">S.No.</th>
                <th className="px-4 py-2">Vehicle Type</th>
                <th className="px-4 py-2">Base Price</th>
                <th className="px-4 py-2">Time Price</th>
                <th className="px-4 py-2">Distance Price</th>
                <th className="px-4 py-2">PlateFormFees(%)</th>
                <th className="px-4 py-2">Cancel Price</th>
                <th className="px-4 py-2">Edit</th>
                <th className="px-4 py-2">Delete</th>
                <th className="px-4 py-2">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((b, i) => (
                <tr key={b?._id || b?.id || `${b?.VehicalType}-${i}`}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{b?.VehicalType}</td>
                  <td>{b?.baseprice || 0}</td>
                  <td>{b?.timeprice || 0}</td>
                  <td>{b?.distaceprice || 0}</td>
                  <td>{b?.plateformfees || 0} %</td>
                  <td>{b?.cancelprice || 0}</td>

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

                  <td>
                    <button
                      onClick={() => handleToggle(b)}
                      role="switch"
                      aria-checked={Boolean(b?.status)}
                      aria-label={b?.status ? 'Active' : 'Inactive'}
                      title={b?.status ? 'Active' : 'Inactive'}
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
