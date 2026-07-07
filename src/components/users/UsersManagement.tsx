"use client";

import { useActionState, useMemo } from "react";

import { USER_ROLES } from "@/constants/users";
import { createUserAction, type CreateUserState } from "@/features/users/actions/create-user";
import { deleteUserAction } from "@/features/users/actions/delete-user";
import { updateUserAction, type UpdateUserState } from "@/features/users/actions/update-user";
import { pendingLabel } from "@/components/ui/async-action-label";
import { Button } from "@/components/ui/button";
import { DataPanel, EmptyState, TableWrapper } from "@/components/ui/data-states";
import type { TeamListItem, UserListItem } from "@/types/users";

type UsersManagementProps = {
  users: UserListItem[];
  teams: TeamListItem[];
  canEdit: boolean;
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
  canEdit,
  canDelete,
}: {
  user: UserListItem;
  teams: TeamListItem[];
  canEdit: boolean;
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

  return (
    <tr className="border-b border-slate-800 align-top">
      <td className="px-4 py-4 text-slate-200">{user.name}</td>
      <td className="px-4 py-4 text-slate-300">{user.email}</td>
      <td className="px-4 py-4 text-slate-300">{user.role}</td>
      <td className="px-4 py-4 text-slate-300">{user.isActive ? "Active" : "Inactive"}</td>
      <td className="px-4 py-4 text-slate-400 text-sm">
        {user.teams.length > 0 ? user.teams.map((team) => team.name).join(", ") : "No team"}
      </td>
      <td className="px-4 py-4">
        {canEdit ? (
          <form action={updateFormAction} className="grid gap-2 rounded-lg border border-slate-800 bg-[#0B1321] p-3">
            <input name="name" defaultValue={user.name} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" required />
            <input name="email" type="email" defaultValue={user.email} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" required />
            <select name="role" defaultValue={user.role} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100">
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
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
            <input name="permissionOverrides" type="hidden" value="[]" />
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

export default function UsersManagement({ users, teams, canEdit, canDelete }: UsersManagementProps) {
  const [createState, createFormAction, createPending] = useActionState(
    createUserAction,
    initialCreateState
  );

  return (
    <section className="space-y-6">
      {canEdit ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">Create User</h2>
          <form action={createFormAction} className="grid gap-3 md:grid-cols-2">
            <input name="name" placeholder="Full name" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <input name="email" type="email" placeholder="Email" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <input name="password" type="password" placeholder="Temporary password" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" required />
            <select name="role" defaultValue="ARTIST" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
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
            <input name="permissionOverrides" type="hidden" value="[]" />
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
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
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4">
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
