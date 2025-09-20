import { ROLES, PERMISSIONS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from '../lib/roles'

class RolesService {
  constructor() {
    this.roles = ROLES
    this.permissions = PERMISSIONS
    this.roleDescriptions = ROLE_DESCRIPTIONS
    this.rolePermissions = ROLE_PERMISSIONS
  }

  // Get user role information
  getUserRole(roleId) {
    if (!roleId) return null
    const roleDescription = this.roleDescriptions[roleId]
    if (!roleDescription) return null
    
    return {
      id: roleId,
      name: roleDescription.name,
      description: roleDescription.description,
      color: roleDescription.color,
      permissions: this.rolePermissions[roleId] || []
    }
  }

  // Check if user has specific permission
  hasPermission(userRole, permissionKey) {
    const role = this.getUserRole(userRole)
    if (!role) return false
    
    return role.permissions.includes(permissionKey)
  }

  // Get all permissions for a role
  getRolePermissions(roleId) {
    return this.rolePermissions[roleId] || []
  }

  // Check multiple permissions
  hasAnyPermission(userRole, permissionKeys) {
    return permissionKeys.some(permission => 
      this.hasPermission(userRole, permission)
    )
  }

  // Check if user has all specified permissions
  hasAllPermissions(userRole, permissionKeys) {
    return permissionKeys.every(permission => 
      this.hasPermission(userRole, permission)
    )
  }

  // Get all available roles
  getAllRoles() {
    return Object.keys(this.roles).map(roleId => this.getUserRole(roleId))
  }

  // Get all available permissions
  getAllPermissions() {
    return Object.values(this.permissions)
  }

  // Check if role can manage other roles
  canManageRoles(userRole) {
    return this.hasPermission(userRole, this.permissions.MANAGE_USERS)
  }

  // Check if role can access admin features
  isAdmin(userRole) {
    return userRole === this.roles.ADMIN
  }

  // Check if role can access manager features
  isManager(userRole) {
    return [this.roles.ADMIN, this.roles.SALES_MANAGER].includes(userRole)
  }

  // Get role display name
  getRoleName(roleId) {
    const roleDescription = this.roleDescriptions[roleId]
    return roleDescription ? roleDescription.name : 'Unknown Role'
  }

  // Get permission display name
  getPermissionName(permissionKey) {
    const permission = Object.entries(this.permissions)
      .find(([key, value]) => value === permissionKey)
    return permission ? permission[0] : 'Unknown Permission'
  }
}

// Export singleton instance
const rolesService = new RolesService()
export default rolesService
