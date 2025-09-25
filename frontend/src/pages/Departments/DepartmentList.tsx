import React, { useEffect, useState } from 'react';
import { departmentsAPI } from '../../services/api';

interface Department {
  _id: string;
  name: string;
  code: string;
  contactEmail: string;
  isActive?: boolean;
  categories?: string[];
}

const DepartmentList: React.FC = () => {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', contactEmail: '', categories: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await departmentsAPI.getDepartments();
      // Expecting array or { items } depending on controller; adjust mapping if needed
      const list = Array.isArray(res) ? res : (res?.items || []);
      setData(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await departmentsAPI.createDepartment({
      name: form.name,
      code: form.code,
      contactEmail: form.contactEmail,
      categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
    });
    setForm({ name: '', code: '', contactEmail: '', categories: '' });
    await load();
  };

  const toggleActive = async (dept: Department) => {
    await departmentsAPI.updateDepartment(dept._id, { isActive: !dept.isActive });
    await load();
  };

  const remove = async (id: string) => {
    await departmentsAPI.deleteDepartment(id);
    await load();
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Departments</h2>
      <form onSubmit={create} style={{ marginBottom: 16 }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
        <input placeholder="Categories (comma-separated)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
        <button type="submit">Add</button>
      </form>

      {loading ? <p>Loading…</p> : (
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Code</th><th>Email</th><th>Categories</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.code}</td>
                <td>{d.contactEmail}</td>
                <td>{(d.categories || []).join(', ')}</td>
                <td>{d.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button onClick={() => toggleActive(d)}>{d.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => remove(d._id)} style={{ color: 'crimson', marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DepartmentList;