import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/users')
        setUsers(response.data)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    
    fetchUsers()
  }, [])

return (
  <table className="table table-bordered primary">
    <thead>
      <tr>
        <th>Given Name</th>
        <th>Family Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={String(user._id)}>
          <td>{user.givenName}</td>
          <td>{user.familyName}</td>
          <td>
            {user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : null}
          </td>
          <td>{user.role}</td>
        </tr>
      ))}
    </tbody>
  </table>
)
}

export default App
