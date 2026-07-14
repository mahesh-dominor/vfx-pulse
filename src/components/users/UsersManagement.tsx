"use client";

import { useActionState, useMemo, useState } from "react";

import type { UserRole } from "@prisma/client";

import {
  USER_DEPARTMENTS,
  USER_DESIGNATIONS,
  USER_ROLES,
} from "@/constants/users";
import { mergePermissionMatrix } from "@/features/auth/rbac-config";
import { createUserAction, type CreateUserState } from "@/features/users/actions/create-user";
import { deleteUserAction } from "@/features/users/actions/delete-user";
import { updateUserAction, type UpdateUserState } from "@/features/users/actions/update-user";
import { pendingLabel } from "@/components/ui/async-action-label";
import { Button } from "@/components/ui/button";
import { DataPanel, EmptyState, TableWrapper } from "@/components/ui/data-states";
import type { TeamListItem, UserListItem, UserPermissionItem } from "@/types/users";

type UsersManagementProps = {
  users: UserListItem[];
  teams: TeamListItem[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const initialCreateState: CreateUserState = {
  success: false,
};

const initialUpdateState: UpdateUserState = {
  success: false,
};

function UserRow({
  user,
  teams,
  canUpdate,
  canDelete,
}: {
  user: UserListItem;
  teams: TeamListItem[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const updateAction = updateUserAction.bind(null, user.id);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialUpdateState
  );

  const [deleteState, deleteFormAction, deletePending] = useActionState(
    async () => deleteUserAction(user.id),
    { success: false, error: undefined as string | undefined }
  );

  const selectedTeamIds = useMemo(() => user.teams.map((team) => team.id), [user.teams]);
  const [role, setRole] = useState<UserRole>(user.role);
  const [permissionOverrides, setPermissionOverrides] = useState<UserPermissionItem[]>(
    mergePermissionMatrix(user.role, user.permissions)
  );

  function updatePermission(module: UserPermissionItem["module"], key: keyof Omit<UserPermissionItem, "module">, checked: boolean) {
    setPermissionOverrides((prev) =>
      prev.map((permission) =>
        permission.module === module ? { ...permission, [key]: checked } : permission
      )
    );
  }

  function updateRole(nextRole: UserRole) {
    setRole(nextRole);
    setPermissionOverrides(mergePermissionMatrix(nextRole));
  }

  return (
    <tr className="border-b border-slate-800 align-top">
      <td className="px-4 py-4 text-slate-200">{user.name}</td>
      <td className="px-4 py-4 text-slate-300">{user.username ?? "-"}</td>
      <td className="px-4 py-4 text-slate-300">{user.email}</td>
      <td className="px-4 py-4 text-slate-300">{user.role}</td>
      <td className="px-4 py-4 text-slate-300">{user.department ?? "-"}</td>
      <td className="px-4 py-4 text-slate-300">{user.designation ?? "-"}</td>
      <td className="px-4 py-4 text-slate-300">{user.isActive ? "Active" : "Inactive"}</td>
      <td className="px-4 py-4 text-slate-400 text-sm">
        {user.teams.length > 0 ? user.teams.map((team) => team.name).join(", ") : "No team"}
      </td>
      <td className="px-4 py-4">
        {canUpdate ? (
          <form action={updateFormAction} className="grid gap-2 rounded-lg border border-slate-800 bg-[#0B1321] p-3">
            <input name="name" defaultValue={user.name} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" required />
            <input name="username" defaultValue={user.username ?? ""} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" required />
            <input name="email" type="email" defaultValue={user.email} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" required />
            <select name="role" value={role} onChange={(event) => updateRole(event.target.value as UserRole)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100">
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select name="department" defaultValue={user.department ?? "PRODUCTION"} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100">
              {USER_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select name="designation" defaultValue={user.designation ?? "JUNIOR_ARTIST"} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100">
              {USER_DESIGNATIONS.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            <select name="teamIds" multiple defaultValue={selectedTeamIds} className="h-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100">
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input name="isActive" type="checkbox" defaultChecked={user.isActive} />
              Active
            </label>
            <input name="permissionOverrides" type="hidden" value={JSON.stringify(permissionOverrides)} />
            <div className="md:col-span-2 rounded border border-slate-800 bg-slate-950/50 p-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Permissions</p>
              <div className="grid gap-2">
                {permissionOverrides.map((permission) => (
                  <div key={permission.module} className="grid grid-cols-[minmax(0,1fr)_repeat(4,auto)] items-center gap-2 text-xs text-slate-300">
                    <span>{permission.module}</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canView} onChange={(event) => updatePermission(permission.module, "canView", event.target.checked)} />View</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canCreate} onChange={(event) => updatePermission(permission.module, "canCreate", event.target.checked)} />Create</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canUpdate} onChange={(event) => updatePermission(permission.module, "canUpdate", event.target.checked)} />Update</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canDelete} onChange={(event) => updatePermission(permission.module, "canDelete", event.target.checked)} />Delete</label>
                  </div>
                ))}
              </div>
            </div>
            {updateState.error ? <p className="text-xs text-red-400">{updateState.error}</p> : null}
            <Button type="submit" disabled={updatePending} className="w-auto px-3 py-1 text-xs">
              {pendingLabel({ pending: updatePending, pendingLabel: "Saving...", idleLabel: "Update" })}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Read only</p>
        )}

        {canDelete ? (
          <form action={deleteFormAction} className="mt-2">
            {deleteState.error ? <p className="mb-1 text-xs text-red-400">{deleteState.error}</p> : null}
            <Button type="submit" disabled={deletePending} className="w-auto bg-red-600 px-3 py-1 text-xs hover:bg-red-500">
              {pendingLabel({ pending: deletePending, pendingLabel: "Removing...", idleLabel: "Soft Delete" })}
            </Button>
          </form>
        ) : null}
      </td>
    </tr>
  );
}

export default function UsersManagement({ users, teams, canCreate, canUpdate, canDelete }: UsersManagementProps) {
  const [createRole, setCreateRole] = useState<UserRole>("ARTIST");
  const [createPermissions, setCreatePermissions] = useState<UserPermissionItem[]>(
    mergePermissionMatrix("ARTIST")
  );
  const [createState, createFormAction, createPending] = useActionState(
    createUserAction,
    initialCreateState
  );

  function updateCreatePermission(module: UserPermissionItem["module"], key: keyof Omit<UserPermissionItem, "module">, checked: boolean) {
    setCreatePermissions((prev) =>
      prev.map((permission) =>
        permission.module === module ? { ...permission, [key]: checked } : permission
      )
    );
  }

  return (
    <section className="space-y-6">
      {canCreate ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">Create User</h2>
          <form action={createFormAction} className="grid gap-3 md:grid-cols-2">
            <input name="name" placeholder="Full name" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <input name="username" placeholder="Username" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <input name="email" type="email" placeholder="Email" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <input name="password" type="password" placeholder="Temporary password" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <select name="role" value={createRole} onChange={(event) => { const nextRole = event.target.value as UserRole; setCreateRole(nextRole); setCreatePermissions(mergePermissionMatrix(nextRole)); }} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select name="department" defaultValue="PRODUCTION" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              {USER_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select name="designation" defaultValue="JUNIOR_ARTIST" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              {USER_DESIGNATIONS.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            <select name="teamIds" multiple className="h-24 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100">
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input name="isActive" type="checkbox" defaultChecked />
              Active user
            </label>
            <input name="permissionOverrides" type="hidden" value={JSON.stringify(createPermissions)} />
            <div className="md:col-span-2 rounded border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Permissions</p>
              <div className="grid gap-2">
                {createPermissions.map((permission) => (
                  <div key={permission.module} className="grid grid-cols-[minmax(0,1fr)_repeat(4,auto)] items-center gap-2 text-xs text-slate-300">
                    <span>{permission.module}</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canView} onChange={(event) => updateCreatePermission(permission.module, "canView", event.target.checked)} />View</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canCreate} onChange={(event) => updateCreatePermission(permission.module, "canCreate", event.target.checked)} />Create</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canUpdate} onChange={(event) => updateCreatePermission(permission.module, "canUpdate", event.target.checked)} />Update</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={permission.canDelete} onChange={(event) => updateCreatePermission(permission.module, "canDelete", event.target.checked)} />Delete</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              {createState.error ? <p className="mb-2 text-sm text-red-400">{createState.error}</p> : null}
              <Button type="submit" disabled={createPending} className="w-auto px-4 py-2">
                {pendingLabel({ pending: createPending, pendingLabel: "Creating...", idleLabel: "Create User" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <DataPanel className="p-0">
        <TableWrapper>
          <table className="min-w-full text-left">
          <thead className="bg-[#0B1321] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Teams</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                teams={teams}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-4">
                  <EmptyState text="No users found." />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </TableWrapper>
      </DataPanel>
    </section>
  );
}
