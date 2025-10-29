import { useEffect, useState } from 'react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Upload, Download, X, Pencil, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const PropertiesList = () => {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Property>>({});
  const [fileUploading, setFileUploading] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    loadProperties();
    loadProfiles();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name');
    setProfiles(data || []);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
    setForm(property);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (!error) {
      setProperties(properties.filter(p => p.id !== id));
      setDeleteConfirmId(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProperty(null);
    setForm({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingProperty?.id) {
      await supabase.from('properties').update(form).eq('id', editingProperty.id);
    } else {
      await supabase.from('properties').insert([form]);
    }
    handleFormClose();
    await loadProperties();
    setLoading(false);
  };

  // Bulk import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: async (result) => {
          await bulkInsert(result.data as Partial<Property>[]);
          setFileUploading(false);
        },
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        await bulkInsert(XLSX.utils.sheet_to_json(worksheet) as Partial<Property>[]);
        setFileUploading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Invalid file type, use CSV or Excel.');
      setFileUploading(false);
    }
  };

  const bulkInsert = async (records: Partial<Property>[]) => {
    const cleanRecords = records
      .filter(r => r.unit_number && r.address)
      .map(r => ({
        unit_number: r.unit_number,
        address: r.address,
        owner_id: r.owner_id || null,
        square_footage: Number(r.square_footage) || null,
        bedrooms: Number(r.bedrooms) || null,
        bathrooms: Number(r.bathrooms) || null,
      }));
    if (cleanRecords.length > 0) {
      await supabase.from('properties').insert(cleanRecords);
      loadProperties();
    }
  };

  // Export
  const handleExport = () => {
    const csv = Papa.unparse(properties.map(p => ({
      ...p,
      owner: profiles.find(pro => pro.id === p.owner_id)?.full_name || "",
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Properties</h2>
          <p className="text-slate-600 mt-1">Manage HOA properties</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Add Property</span>
            </button>
            <label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={fileUploading}
                style={{ display: 'none' }}
                id="bulk-upload"
              />
              <button
                type="button"
                className={`flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition ${fileUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => document.getElementById('bulk-upload')?.click()}
                disabled={fileUploading}
              >
                <Upload className="h-5 w-5" />
                <span>{fileUploading ? 'Uploading...' : 'Import'}</span>
              </button>
            </label>
            <button
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
              onClick={handleExport}
            >
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Form, Payment style */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 relative w-full max-w-lg mx-auto">
            <button
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
              onClick={handleFormClose}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold mb-4">{editingProperty ? 'Edit Property' : 'Add Property'}</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Number</label>
                <input
                  className="border p-2 block w-full rounded"
                  placeholder="Unit Number"
                  value={form.unit_number || ''}
                  required
                  onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  className="border p-2 block w-full rounded"
                  placeholder="Address"
                  value={form.address || ''}
                  required
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner</label>
                <select
                  className="border p-2 block w-full rounded"
                  value={form.owner_id || ''}
                  required
                  onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}
                >
                  <option value="">Select owner</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Square Footage</label>
                <input
                  className="border p-2 block w-full rounded"
                  type="number"
                  placeholder="Square Footage"
                  value={form.square_footage || ''}
                  onChange={e => setForm(f => ({ ...f, square_footage: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bedrooms</label>
                <input
                  className="border p-2 block w-full rounded"
                  type="number"
                  placeholder="Bedrooms"
                  value={form.bedrooms || ''}
                  onChange={e => setForm(f => ({ ...f, bedrooms: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bathrooms</label>
                <input
                  className="border p-2 block w-full rounded"
                  type="number"
                  step="0.1"
                  placeholder="Bathrooms"
                  value={form.bathrooms || ''}
                  onChange={e => setForm(f => ({ ...f, bathrooms: Number(e.target.value) }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
                  {editingProperty ? 'Update' : 'Create'}
                </button>
                <button type="button" className="bg-slate-200 px-4 py-2 rounded" onClick={handleFormClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow border">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Unit Number</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Sq Ft</th>
              <th className="px-4 py-2 text-left">Bedrooms</th>
              <th className="px-4 py-2 text-left">Bathrooms</th>
              {isAdmin && <th className="px-4 py-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.unit_number}</td>
                <td className="px-4 py-2">{p.address}</td>
                <td className="px-4 py-2">{profiles.find(pro => pro.id === p.owner_id)?.full_name || p.owner_id}</td>
                <td className="px-4 py-2">{p.square_footage}</td>
                <td className="px-4 py-2">{p.bedrooms}</td>
                <td className="px-4 py-2">{p.bathrooms}</td>
                {isAdmin && (
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="text-blue-600 hover:bg-blue-50 rounded p-2"
                      title="Edit"
                      onClick={() => handleEdit(p)}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-600 hover:bg-red-50 rounded p-2"
                      title="Delete"
                      onClick={() => setDeleteConfirmId(p.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {deleteConfirmId === p.id && (
                      <span className="ml-2">
                        Confirm?{' '}
                        <button
                          className="text-red-700 underline"
                          onClick={() => handleDelete(p.id)}
                        >
                          Yes
                        </button>{' '}
                        <button className="underline" onClick={() => setDeleteConfirmId(null)}>
                          No
                        </button>
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};