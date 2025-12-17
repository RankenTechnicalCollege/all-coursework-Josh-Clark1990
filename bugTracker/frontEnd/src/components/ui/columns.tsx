"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { LucideBadgeAlert } from "lucide-react"

export type Bug = {
  _id: string
  title: string
  description: string
  statusLabel: string
  classification: string
  authorOfBug: string
  assignedUserName: string
  stepsToReproduce: string
  priority: string
  hoursWorked: number
}

export const columns = (
  onView: (bug: Bug) => void,   // For viewing bug details
  onEdit: (bug: Bug) => void    // For editing bug
): ColumnDef<Bug>[] => [

  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as boolean
      return (
        <div className="flex items-center gap-2">
          {priority && <LucideBadgeAlert className="w-5 h-5 text-red-600" />}
          <span className="capitalize">{priority ? "High" : "Normal"}</span>
        </div>
      )
    },
  },
  
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return <span>{title || "Unassigned"}</span>
    },
  },

  {
    accessorKey: "bugId",
    header: "Bug ID",
    cell: ({ row }) => {
      const bugId = row.original._id
      return (
        <button
          onClick={() => onView(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-mono "
        >
          {bugId}
        </button>
      )
    },
  },

  {
    accessorKey: "hoursWorked",
    header: "Hours Worked",
    cell: ({ row }) => {
      const hoursWorked = row.getValue("hoursWorked") as number
      return <span>{hoursWorked || "0"}</span>
    },
  },
  
  {
    accessorKey: "statusLabel",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusLabel") as string
      return <span className="capitalize">{status || "open"}</span>
    },
  },

   {
    accessorKey: "classification",
    header: "Classification",
    cell: ({ row }) => {
      const status = row.getValue("classification") as string
      return <span className="capitalize">{status || ""}</span>
    },
  },

{
  accessorKey: "authorOfBug",
  header: "Author",
  cell: ({ row }) => {
    const author = row.getValue("authorOfBug") as string
    return <span className="capitalize">{author || "Unknown"}</span>
  },
},

{
  accessorKey: "assignedUserName",
  header: "Assigned To",
  cell: ({ row }) => {
    const assignedUserName = row.getValue("assignedUserName") as string
    return <span>{assignedUserName || "Unassigned"}</span>
  },
},

  {
    id: "edit",
    header: "Edit Bug",
    cell: ({ row }) => {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(row.original)}
        >
          Edit
        </Button>
      )
    },
  },
]