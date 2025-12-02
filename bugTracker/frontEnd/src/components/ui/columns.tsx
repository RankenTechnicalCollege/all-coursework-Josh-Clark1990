"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export type Bug = {
  _id: string
  id?: string
  bugId?: string
  title?: string
  description?: string
  stepsToReproduce?: string
  authorOfBug?: string
  statusLabel?: string
  submittedBy?: string
  status?: boolean
  assignedUser?: string
  assignedUserName?: string 
  assignedTo?: string
  comments?: string[]
  testCases?: string[]
  createdAt?: string
  lastUpdated?: string
  classification?: string
}

export const columns = (
  onView: (bug: Bug) => void,   // For viewing bug details
  onEdit: (bug: Bug) => void    // For editing bug
): ColumnDef<Bug>[] => [
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
          className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
        >
          {bugId}
        </button>
      )
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