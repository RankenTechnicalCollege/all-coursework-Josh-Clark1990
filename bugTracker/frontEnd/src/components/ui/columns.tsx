"use client"

import { type ColumnDef } from "@tanstack/react-table"

// Define your data shape
export type Bug = {
  _id: string
  description: string
  stepsToReproduce: string
  authorOfBug: string
  statusLabel: string
  assignedTo: string
  comments: string[]
  testCases: string[]
}

// Define your columns
export const columns: ColumnDef<Bug>[] = [
  {
    accessorKey: "_id",
    header: "Bug ID",
  },
  
  {
    accessorKey: "description",
    header: "Description",
  },

  {
    accessorKey: "stepsToReproduce",
    header: "Steps to Reproduce"
  },

  {
    accessorKey: "authorOfBug",
    header: "Submitted By",
  },
  
  {
    accessorKey: "statusLabel",
    header: "Status",
  },

  {
    accessorKey: "assignedTo",
    header: "Assigned To",
  },

  {
    accessorKey: "comments",
    header: "Comments",
  },

  {
    accessorKey: "testCases",
    header: "Test Cases",
  },

]