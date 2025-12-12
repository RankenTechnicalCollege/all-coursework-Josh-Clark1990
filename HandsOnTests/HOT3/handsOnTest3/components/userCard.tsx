"use client"

import "@/styles/user-card.css"

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt?: string
  lastUpdated?: string
}

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleBadgeClass = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "role-admin",
      developer: "role-developer",
      "quality analyst": "role-qa",
      "business analyst": "role-ba",
      "product manager": "role-pm",
      "technical manager": "role-tm"
    }
    return roleMap[role.toLowerCase()] || "role-default"
  }

  return (
    <div className="user-card">
      <div className="user-header">
        <h3>{user.name}</h3>
        <span className={`user-role ${getRoleBadgeClass(user.role)}`}>
          {user.role}
        </span>
      </div>

      <div className="user-body">
        <p className="user-email">{user.email}</p>
        <p className="user-id">ID: {user._id}</p>
        {user.createdAt && (
          <p className="user-date">Joined: {formatDate(user.createdAt)}</p>
        )}
        {user.lastUpdated && (
          <p className="user-date">Updated: {formatDate(user.lastUpdated)}</p>
        )}
      </div>

      <div className="user-actions">
        <button className="btn btn-edit" onClick={() => onEdit(user)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(user._id)}>
          Delete
        </button>
      </div>
    </div>
  )
}