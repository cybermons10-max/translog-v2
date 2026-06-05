'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface MrrData { month: string; mrr: number }
interface TenantsData { month: string; new: number; churned: number }

interface Props {
  mrrData: MrrData[]
  tenantsData: TenantsData[]
  churnRate: number
}

export function SuperadminCharts({ mrrData, tenantsData, churnRate }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* MRR 6 mois */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">MRR — 6 derniers mois (€)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={mrrData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}€`} />
            <Tooltip
              formatter={(v) => [`${Number(v)} €`, 'MRR']}
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Line type="monotone" dataKey="mrr" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Nouveaux tenants vs churned */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Tenants par mois</h3>
          <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
            Churn {churnRate.toFixed(1)}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={tenantsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Bar dataKey="new" name="Nouveaux" fill="#60a5fa" radius={[3, 3, 0, 0]} />
            <Bar dataKey="churned" name="Churned" fill="#f87171" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
