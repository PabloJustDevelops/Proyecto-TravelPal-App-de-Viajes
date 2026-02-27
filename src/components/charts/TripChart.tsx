'use client'

import { useEffect, useState } from 'react'
import { Trip } from '@/lib/supabase'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts'

export interface TripChartProps {
  trips: Trip[]
  type?: 'status' | 'timeline' | 'destinations'
  title?: string
  height?: number
}

interface ChartData {
  name: string
  value: number
  color: string
  [key: string]: any
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: '#3B82F6',   // Blue-500
  completed: '#10B981',  // Emerald-500
  cancelled: '#EF4444',  // Red-500
  in_progress: '#F59E0B', // Amber-500
  planned: '#6366F1',    // Indigo-500
  confirmed: '#0EA5E9',  // Sky-500
}

const STATUS_NAMES: Record<string, string> = {
  upcoming: 'Próximos',
  completed: 'Completados',
  cancelled: 'Cancelados',
  in_progress: 'En curso',
  planned: 'Planificados',
  confirmed: 'Confirmados',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {data.value} {data.value === 1 ? 'viaje' : 'viajes'}
        </p>
      </div>
    );
  }
  return null;
};

export default function TripChart({ trips, type = 'status', title = 'Estado de Viajes', height = 320 }: TripChartProps) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    if (!trips || trips.length === 0) {
      setData([])
      return
    }

    if (type === 'status') {
      const statusCounts = trips.reduce((acc, trip) => {
        const status = trip.status || 'planned'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const processedData = Object.entries(statusCounts).map(([key, value]) => ({
        name: STATUS_NAMES[key] || key,
        value: value,
        color: STATUS_COLORS[key] || '#6B7280'
      }))

      setData(processedData)
    } else if (type === 'destinations') {
      const destCounts = trips.reduce((acc, trip) => {
        const dest = trip.destination || 'Desconocido'
        acc[dest] = (acc[dest] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get top 5 destinations
      const processedData = Object.entries(destCounts)
        .map(([key, value], index) => ({
          name: key,
          value: value,
          color: Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      setData(processedData)
    }
  }, [trips, type])

  if (data.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-gray-400 text-sm">No hay datos suficientes</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[320px]">
      <ResponsiveContainer width="100%" height={height}>
        {type === 'status' ? (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="middle" 
              align="right"
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-600 dark:text-gray-300 ml-2 flex items-center h-6">
                  {value}
                </span>
              )}
            />
          </PieChart>
        ) : (
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" hide domain={[0, 'dataMax + 2']} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltip />}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              barSize={20}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}