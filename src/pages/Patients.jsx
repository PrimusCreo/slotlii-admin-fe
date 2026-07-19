import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { Users, Search, ChevronLeft, ChevronRight, Phone, Mail, Calendar } from 'lucide-react';
import * as api from '../api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    loadPatients();
  }, [page]);

  async function loadPatients() {
    setLoading(true);
    try {
      const params = { limit: 15, page };
      if (search) params.search = search;
      const res = await api.getPatients(params);
      setPatients(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadPatients();
  }

  return (
    <Layout title="Patients">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-description">All registered patients across clinics</p>
        </div>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 400 }}>
          <div className="header-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {pagination.total} patient{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loader-container"><div className="loader" /></div>
      ) : patients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users />
            <p>No patients found</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Clinic</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed30, #3b82f630)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-violet)'
                        }}>
                          {p.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td><Phone size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{p.phone}</td>
                    <td>{p.email ? <><Mail size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{p.email}</> : '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                    <td>{p.clinicId?.name || '—'}</td>
                    <td>
                      <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn${page === p ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
