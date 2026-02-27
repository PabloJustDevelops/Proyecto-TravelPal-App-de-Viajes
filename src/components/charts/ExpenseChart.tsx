'use client'

import { useEffect, useState } from 'react'
import { Expense } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
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

export interface ExpenseChartProps {
  expenses: Expense[]
  type?: 'category' | 'timeline' | 'comparison'
  title?: string
  height?: number
  currency?: string
}

interface ChartData {
  name: string
  value: number
  color: string
  percentage?: number
  [key: string]: any
}

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#3B82F6',   // Blue-500
  accommodation: '#8B5CF6', // Violet-500
  food: '#F59E0B',        // Amber-500
  entertainment: '#EF4444', // Red-500
  shopping: '#10B981',    // Emerald-500
  health: '#F97316',      // Orange-500
  other: '#6B7280',       // Gray-500
}

const CATEGORY_NAMES: Record<string, string> = {
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  food: 'Comida',
  entertainment: 'Entretenimiento',
  shopping: 'Compras',
  health: 'Salud',
  other: 'Otros',
}

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {formatCurrency(data.value, currency)}
          {data.percentage && <span className="text-xs text-gray-400 ml-2">({data.percentage.toFixed(1)}%)</span>}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseChart({ 
  expenses, 
  type = 'category', 
  title = 'Gastos por categoría', 
  height = 320,
  currency = 'USD'
}: ExpenseChartProps) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    if (!expenses || expenses.length === 0) {
      setData([])
      return
    }

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

    if (type === 'category') {
      const categoryTotals = expenses.reduce((acc, expense) => {
        const cat = expense.category || 'other'
        acc[cat] = (acc[cat] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      const processedData = Object.entries(categoryTotals)
        .map(([key, value]) => ({
          name: CATEGORY_NAMES[key] || key,
          value: value,
          color: CATEGORY_COLORS[key] || CATEGORY_COLORS.other,
          percentage: (value / totalAmount) * 100
        }))
        .sort((a, b) => b.value - a.value)

      setData(processedData)
    } else if (type === 'timeline') {
      // Logic for timeline (monthly)
      const monthlyTotals = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date)
        const key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        acc[key] = (acc[key] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      const processedData = Object.entries(monthlyTotals).map(([name, value]) => ({
        name,
        value,
        color: '#3B82F6'
      }))
      // Sort by date could be complex with just strings, but let's assume simple sort for now or improve if needed
      setData(processedData)
    }
  }, [expenses, type])

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
        {type === 'category' ? (
          <PieChart>
            <Pie
              data={data}
              cx="40%" // Movemos el gráfico a la izquierda para dejar espacio a la leyenda
              cy="50%"
              innerRadius={50} // Reducimos radio interno
              outerRadius={70} // Reducimos radio externo
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltip currency={currency} />}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}