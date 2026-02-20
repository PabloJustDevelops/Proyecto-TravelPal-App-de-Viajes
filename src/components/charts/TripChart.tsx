'use client'

import { useEffect, useState } from 'react'
import { Trip } from '@/lib/supabase'

interface TripChartProps {
  trips: Trip[]
  type?: 'status' | 'timeline' | 'destinations'
  title?: string
  height?: number
}

interface ChartData {
  label: string
  value: number
  color: string
  percentage: number
}

export default function TripChart({ trips, type = 'status', title = 'Estado de Viajes', height = 320 }: TripChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    const processData = () => {
      if (!trips || trips.length === 0) {
        setChartData([]);
        return;
      }

      // Procesar datos según el tipo de gráfico
      let data: ChartData[] = [];

      switch (type) {
        case 'status':
          data = processStatusData();
          break;
        case 'timeline':
          data = processTimelineData();
          break;
        case 'destinations':
          data = processDestinationData();
          break;
        default:
          data = processStatusData();
      }

      setChartData(data);
    };

    processData();
  }, [trips, type]);

  const processStatusData = (): ChartData[] => {
    const statusCounts = trips.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors: Record<string, string> = {
      upcoming: '#3B82F6',
      completed: '#10B981',
      cancelled: '#EF4444',
      in_progress: '#F59E0B',
      planned: '#6366F1', // Indigo for planned
      confirmed: '#3B82F6', // Blue for confirmed (same as upcoming)
    };

    const statusNames: Record<string, string> = {
      upcoming: 'Próximos',
      completed: 'Completados',
      cancelled: 'Cancelados',
      in_progress: 'En progreso',
      planned: 'Planificados',
      confirmed: 'Confirmados',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: statusNames[status] || status,
      value: count,
      color: statusColors[status] || '#6B7280',
      percentage: (count / trips.length) * 100,
    }));
  };

  const processTimelineData = (): ChartData[] => {
    const monthlyData = trips.reduce((acc, trip) => {
      const month = new Date(trip.departure_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short'
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyData).map(([month, count]) => ({
      label: month,
      value: count,
      color: '#3B82F6',
      percentage: (count / trips.length) * 100,
    }));
  };

  const processDestinationData = (): ChartData[] => {
    const destinationCounts = trips.reduce((acc, trip) => {
      acc[trip.destination] = (acc[trip.destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#F97316'];

    return Object.entries(destinationCounts)
      .map(([destination, count], index) => ({
        label: destination,
        value: count,
        color: colors[index % colors.length],
        percentage: (count / trips.length) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const totalCount = trips.length

  const renderTimelineChart = () => (
    <div className="space-y-3">
      {chartData.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-16 text-sm text-gray-600 truncate">
            {item.label}
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
          <div className="w-8 text-sm text-gray-900 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBarChart = () => (
    <div className="space-y-3">
      {chartData.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-24 text-sm text-gray-600 truncate">
            {item.label}
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
          <div className="w-12 text-sm text-gray-900 text-right">
            {item.value}
          </div>
          <div className="w-12 text-xs text-gray-500 text-right">
            {item.percentage.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  )

  const renderPieChart = () => {
    const radius = 80
    const centerX = 100
    const centerY = 100
    let currentAngle = 0

    return (
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {chartData.map((item, index) => {
              const angle = (item.percentage / 100) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              
              const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
              const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
              
              const largeArcFlag = angle > 180 ? 1 : 0
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')
              
              currentAngle += angle
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  className="hover:opacity-80 transition-opacity"
                />
              )
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {totalCount}
              </div>
              <div className="text-xs text-gray-500">Viajes</div>
            </div>
          </div>
        </div>
        
        <div className="ml-6 space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.label}</span>
              <span className="ml-auto font-medium">
                {item.value} viaje{item.value !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          No hay datos suficientes para mostrar el gráfico
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="text-sm text-gray-500">
          Total: {totalCount} viaje{totalCount !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div style={{ height: `${height}px` }} className="overflow-hidden">
        {type === 'timeline' ? renderTimelineChart() : 
         type === 'status' ? renderPieChart() : 
         renderBarChart()}
      </div>
    </div>
  )
}