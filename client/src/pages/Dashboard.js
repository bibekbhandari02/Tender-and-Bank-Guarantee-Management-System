import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../api/tenders';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { formatCurrency, formatDate, getStatusBadgeClass, getExpiryStatus } from '../utils/formatters';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Colour palette ────────────────────────────────────────────────
const PALETTE = {
  blue:   '#3b82f6',
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
  indigo: '#6366f1',
  orange: '#f97316',
};
const CHART_COLORS = Object.values(PALETTE);

const STATUS_COLORS = {
  Active:    PALETTE.green,
  Completed: PALETTE.blue,
  Expired:   PALETTE.red,
  Cancelled: '#94a3b8',
};

// ── Shared tooltip style ─────────────────────────────────────────
const tooltipProps = {
  contentStyle: {
    background: '#1e293b',
    border: 'none',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '13px',
    padding: '10px 14px',
  },
  labelStyle: { color: '#94a3b8', marginBottom: 4, fontWeight: 600 },
  itemStyle: { color: '#f1f5f9' },
  cursor: { fill: 'rgba(148,163,184,0.08)' },
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, color, alert }) => {
  const bg = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50    text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan:   'bg-cyan-50   text-cyan-600',
    orange: 'bg-orange-50 text-orange-600',
  }[color] || 'bg-gray-50 text-gray-600';

  return (
    <div className={`card p-5 hover:shadow-md transition-shadow ${alert ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section heading ──────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{children}</h3>
);

// ── Custom Pie label ─────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!stats) return null;

  const {
    tenders, guarantees,
    tendersByType, guaranteesByType,
    contractAmountByType, monthlyTrend,
    recentTenders, topGuarantees,
  } = stats;

  // Tender status donut data
  const tenderStatusData = [
    { name: 'Active',    value: tenders.active,    color: STATUS_COLORS.Active },
    { name: 'Completed', value: tenders.completed,  color: STATUS_COLORS.Completed },
    { name: 'Expired',   value: tenders.expired,    color: STATUS_COLORS.Expired },
    { name: 'Cancelled', value: tenders.cancelled,  color: STATUS_COLORS.Cancelled },
  ].filter((d) => d.value > 0);

  // Guarantee status donut data
  const guaranteeStatusData = [
    { name: 'Active',   value: guarantees.active,   color: PALETTE.green },
    { name: 'Expiring', value: guarantees.expiring,  color: PALETTE.yellow },
    { name: 'Expired',  value: guarantees.expired,   color: PALETTE.red },
    { name: 'Released', value: guarantees.released,  color: PALETTE.blue },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenders"
          value={tenders.total}
          subtitle={`${tenders.active} active · ${tenders.completed} completed`}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(tenders.totalAmount)}
          subtitle="Total contract value"
          icon={BanknotesIcon}
          color="green"
        />
        <StatCard
          title="Bank Guarantees"
          value={guarantees.total}
          subtitle={`${guarantees.active} active`}
          icon={BuildingLibraryIcon}
          color="purple"
        />
        <StatCard
          title="Expiring Soon"
          value={guarantees.expiring}
          subtitle="Within 30 days"
          icon={ExclamationTriangleIcon}
          color={guarantees.expiring > 0 ? 'red' : 'green'}
          alert={guarantees.expiring > 0}
        />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Guarantee Value"
          value={formatCurrency(guarantees.totalAmount)}
          icon={CurrencyDollarIcon}
          color="indigo"
        />
        <StatCard
          title="Completed Tenders"
          value={tenders.completed}
          icon={CheckCircleIcon}
          color="cyan"
        />
        <StatCard
          title="Expired Guarantees"
          value={guarantees.expired}
          icon={ClockIcon}
          color={guarantees.expired > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          title="Released Guarantees"
          value={guarantees.released}
          icon={ArrowTrendingUpIcon}
          color="orange"
        />
      </div>

      {/* ── Monthly Trend + Tender Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Trend — Line + Bar combo */}
        <div className="card p-5 lg:col-span-2">
          <SectionTitle>Monthly Tender Activity (Last 6 Months)</SectionTitle>
          {monthlyTrend.some((m) => m.count > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(value, name) =>
                    name === 'Contract Value' ? formatCurrency(value) : value
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="count" name="Tenders" fill={PALETTE.blue} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="totalAmount" name="Contract Value"
                  stroke={PALETTE.green} strokeWidth={2} dot={{ r: 4, fill: PALETTE.green }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Tender Status Donut */}
        <div className="card p-5">
          <SectionTitle>Tender Status</SectionTitle>
          {tenderStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={tenderStatusData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {tenderStatusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {tenderStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── Contract Type Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tenders by Contract Type — Horizontal Bar */}
        <div className="card p-5">
          <SectionTitle>Tenders by Contract Type</SectionTitle>
          {tendersByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={tendersByType}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="count" name="Tenders" radius={[0, 4, 4, 0]}>
                  {tendersByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Contract Amount by Type — Bar */}
        <div className="card p-5">
          <SectionTitle>Contract Value by Type (NPR)</SectionTitle>
          {contractAmountByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={contractAmountByType}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v}
                />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => formatCurrency(v)}
                />
                <Bar dataKey="totalAmount" name="Value" radius={[0, 4, 4, 0]}>
                  {contractAmountByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── Guarantee Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Guarantee Status Donut */}
        <div className="card p-5">
          <SectionTitle>Guarantee Status</SectionTitle>
          {guaranteeStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={guaranteeStatusData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {guaranteeStatusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {guaranteeStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
              {guarantees.expiring > 0 && (
                <Link
                  to="/guarantees/expiring"
                  className="mt-4 flex items-center justify-between p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition-colors"
                >
                  <span>View expiring guarantees</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Guarantee by Type — Bar */}
        <div className="card p-5 lg:col-span-2">
          <SectionTitle>Guarantees by Type</SectionTitle>
          {guaranteesByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={guaranteesByType}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(value, name) =>
                    name === 'Total Amount' ? formatCurrency(value) : value
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} fill={PALETTE.purple} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── Top Active Guarantees ── */}
      {topGuarantees?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Top Active Guarantees by Value</h3>
            <Link to="/guarantees/expiring" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View expiring <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Bank</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Tender</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topGuarantees.map((g) => {
                  const expiry = getExpiryStatus(g.expiryDate);
                  return (
                    <tr key={g._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-gray-900">{g.bankName}</td>
                      <td className="table-cell">
                        <span className="badge badge-blue">{g.guaranteeType}</span>
                      </td>
                      <td className="table-cell text-gray-500 text-xs font-mono">
                        {g.tenderId?.contractNumber || '—'}
                      </td>
                      <td className="table-cell font-semibold">{formatCurrency(g.guaranteeAmount)}</td>
                      <td className="table-cell">
                        <div>
                          <p className="text-gray-700 text-sm">{formatDate(g.expiryDate)}</p>
                          <span className={`text-xs font-medium ${
                            expiry.color === 'red' ? 'text-red-600' :
                            expiry.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                          }`}>{expiry.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recent Tenders ── */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Tenders</h3>
          <Link to="/tenders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentTenders.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No tenders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Contract No.</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Company</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTenders.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <Link
                        to={`/tenders/${t._id}`}
                        className="font-mono text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {t.contractNumber}
                      </Link>
                    </td>
                    <td className="table-cell font-medium text-gray-900 max-w-xs truncate">{t.contractTitle}</td>
                    <td className="table-cell text-gray-500">{t.employeeName}</td>
                    <td className="table-cell">
                      <span className="badge badge-gray">{t.contractType}</span>
                    </td>
                    <td className="table-cell font-semibold">{formatCurrency(t.contractAmount)}</td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                    </td>
                    <td className="table-cell text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;

