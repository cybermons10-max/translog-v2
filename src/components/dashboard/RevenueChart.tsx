'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { month: string; revenue: number; count: number }[]
}

export function RevenueChart({ data }: Props) {
  if (!data.some(d => d.revenue > 0)) {
    return <p className="text-gray-400 text-sm text-center py-8">Aucun revenu enregistré sur la période</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
          tickFormatter={v => v === 0 ? '0' : `${v}€`} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} €`, 'Revenus TTC']}
          labelStyle={{ color: '#1e3a5f', fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1e3a5f"
          strokeWidth={2}
          fill="url(#revGradient)"
          dot={{ r: 3, fill: '#1e3a5f', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#1e3a5f' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
