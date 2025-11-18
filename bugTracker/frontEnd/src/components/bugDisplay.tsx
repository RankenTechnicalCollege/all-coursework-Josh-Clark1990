import { useEffect, useState } from 'react'
import { type Bug, columns } from "./ui/columns"
import { DataTable } from "./ui/dataTable"

export default function BugDisplay() { 
  const [data, setData] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:5000/api/bugs', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bugs: ${response.statusText}`)
        }
        
        const result = await response.json()
        setData(result.bugs || result || [])
      } catch (err) {
        console.error('Error fetching bugs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch bugs')
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, []) 

  if (loading) {
    return <div className="container mx-auto py-10">Loading bugs...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}