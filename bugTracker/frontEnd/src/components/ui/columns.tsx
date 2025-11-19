"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export type Bug = {
  _id: string
  description?: string
  stepsToReproduce?: string
  authorOfBug?: string
  statusLabel?: string
  assignedTo?: string
  comments?: string[]
  testCases?: string[]
}

export const columns = (onEdit: (bug: Bug) => void): ColumnDef<Bug>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "bugId",
    header: "Bug ID",
    cell: ({ row }) => {
      const bugId = row.original._id
      return (
        <button
          onClick={() => onEdit(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
        >
          {bugId}
        </button>
      )
    },
  },

  {
    accessorKey: "authorOfBug",
    header: "Submitted By",
  },
  
  {
    accessorKey: "statusLabel",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <span className="capitalize">{status || "open"}</span>
    },
  },

  {
    accessorKey: "assignedTo",
    header: "Assigned To",
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