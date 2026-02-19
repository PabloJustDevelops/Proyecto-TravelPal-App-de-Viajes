'use client'

import { useEffect, useState } from 'react'
import { Expense } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

export interface ExpenseChartProps {
  expenses: Expense[]
  type?: 'category' | 'timeline' | 'comparison'
  title?: string
  height?: number
  currency?: string
}

interface ChartData {
  label: string
  value: number
  color: string
  percentage: number
}

export default function ExpenseChart({ 
  expenses, 
  type = 'category', 
  title = 'Gastos por categoría', 
  height = 320,
  currency = 'USD'
}: ExpenseChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    const processData = () => {
      if (!expenses || expenses.length === 0) {
        setChartData([]);
        return;
      }

      // Agrupar gastos por categoría
      const categoryTotals = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Otros';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const categoryColors: Record<string, string> = {
        transport: '#3B82F6',
        accommodation: '#8B5CF6',
        food: '#F59E0B',
        entertainment: '#EF4444',
        shopping: '#10B981',
        health: '#F97316',
        other: '#6B7280',
      }

      const categoryNames: Record<string, string> = {
        transport: 'Transporte',
        accommodation: 'Alojamiento',
        food: 'Comida',
        entertainment: 'Entretenimiento',
        shopping: 'Compras',
        health: 'Salud',
        other: 'Otros',
      }

      // Convertir a formato para el gráfico
      const data = Object.entries(categoryTotals).map(([category, amount]) => ({
        label: categoryNames[category] || category,
        value: amount,
        color: categoryColors[category] || '#6B7280',
        percentage: Math.round((amount / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100)
      }));

      setChartData(data);
    };

    processData();
  }, [expenses]);

  // Calculate total amount and process data based on type
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  useEffect(() => {
    const processCategoryData = (total: number): ChartData[] => {
      const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      const categoryColors: Record<string, string> = {
        transport: '#3B82F6',
        accommodation: '#8B5CF6',
        food: '#F59E0B',
        entertainment: '#EF4444',
        shopping: '#10B981',
        health: '#F97316',
        other: '#6B7280',
      }

      const categoryNames: Record<string, string> = {
        transport: 'Transporte',
        accommodation: 'Alojamiento',
        food: 'Comida',
        entertainment: 'Entretenimiento',
        shopping: 'Compras',
        health: 'Salud',
        other: 'Otros',
      }

      return Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          label: categoryNames[category] || category,
          value: amount,
          color: categoryColors[category] || '#6B7280',
          percentage: (amount / total) * 100,
        }))
        .sort((a, b) => b.value - a.value)
    }

    const processTimelineData = (): ChartData[] => {
      const monthlyTotals = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short' 
        })
        acc[month] = (acc[month] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      const maxAmount = Math.max(...Object.values(monthlyTotals))

      return Object.entries(monthlyTotals)
        .map(([month, amount]) => ({
          label: month,
          value: amount,
          color: '#3B82F6',
          percentage: (amount / maxAmount) * 100,
        }))
        .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    }

    const processComparisonData = (): ChartData[] => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })

      const previousMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear
      })

      const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const maxTotal = Math.max(currentTotal, previousTotal)

      return [
        {
          label: 'Mes Actual',
          value: currentTotal,
          color: '#3B82F6',
          percentage: maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0,
        },
        {
          label: 'Mes Anterior',
          value: previousTotal,
          color: '#8B5CF6',
          percentage: maxTotal > 0 ? (previousTotal / maxTotal) * 100 : 0,
        },
      ]
    }

    let processedData: ChartData[] = []
    
    switch (type) {
      case 'category':
        processedData = processCategoryData(totalAmount)
        break
      case 'timeline':
        processedData = processTimelineData()
        break
      case 'comparison':
        processedData = processComparisonData()
        break
    }
    
    setChartData(processedData)
  }, [expenses, type, totalAmount])





  const renderBarChart = () => (
    <div className="space-y-3">
      {chartData.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-20 text-sm text-gray-600 dark:text-gray-300 truncate">
            {item.label}
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
          <div className="w-24 text-sm text-gray-900 dark:text-white text-right">
            {formatCurrency(item.value, currency)}
          </div>
          <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
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
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount, currency)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
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
              <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
              <span className="ml-auto font-medium text-gray-900 dark:text-white">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos suficientes para mostrar el gráfico
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {formatCurrency(totalAmount, currency)}
        </div>
      </div>
      
      <div style={{ height: `${height}px` }} className="overflow-hidden">
        {type === 'category' ? renderPieChart() : renderBarChart()}
      </div>
    </div>
  )
}