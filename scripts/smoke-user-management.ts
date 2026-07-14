import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import type { CreateUserSchema } from "@/features/users/schemas/create-user.schema";
import type { UpdateUserSchema } from "@/features/users/schemas/update-user.schema";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const timestamp = Date.now();
  const baseUsername = `smoke.user.${timestamp}`;
  const baseEmail = `${baseUsername}@example.com`;
  const updatedUsername = `${baseUsername}.updated`;
  const updatedEmail = `${baseUsername}.updated@example.com`;
  const initialPassword = "SmokeUser@123";
  const resetPassword = "SmokeReset@123";

  console.log("[1/7] Creating smoke-test user");
  const createInput: CreateUserSchema = {
    name: "Smoke Test User",
    email: baseEmail,
    username: baseUsername,
    password: initialPassword,
    role: "ARTIST",
    designation: "JUNIOR_ARTIST",
    department: "PRODUCTION",
    isActive: true,
    teamIds: [],
    permissionOverrides: [
      {
        module: "projects",
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      },
    ],
  };

  const createdUser = await userService.createUser(createInput);
  assert(createdUser.email === baseEmail, "User creation did not persist email");
  assert(createdUser.username === baseUsername, "User creation did not persist username");
  assert(createdUser.role === "ARTIST", "Role assignment failed on create");
  assert(createdUser.department === "PRODUCTION", "Department assignment failed on create");
  assert(createdUser.designation === "JUNIOR_ARTIST", "Designation assignment failed on create");

  console.log("[2/7] Verifying login by email and username");
  const emailLogin = await authService.validateCredentials(baseEmail, initialPassword);
  assert(emailLogin?.id === createdUser.id, "Login by email failed after creation");
  const usernameLogin = await authService.validateCredentials(baseUsername, initialPassword);
  assert(usernameLogin?.id === createdUser.id, "Login by username failed after creation");

  console.log("[3/7] Editing user profile, role, and permissions");
  const updateInput: UpdateUserSchema = {
    name: "Smoke Test User Updated",
    email: updatedEmail,
    username: updatedUsername,
    role: "LEAD",
    designation: "LEAD",
    department: "LIGHTING",
    isActive: true,
    teamIds: [],
    permissionOverrides: [
      {
        module: "projects",
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: false,
      },
      {
        module: "reports",
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      },
    ],
  };

  const updatedUser = await userService.updateUser(createdUser.id, updateInput);
  assert(updatedUser.name === updateInput.name, "User name did not update");
  assert(updatedUser.email === updatedEmail, "User email did not update");
  assert(updatedUser.username === updatedUsername, "User username did not update");
  assert(updatedUser.role === "LEAD", "User role did not update");
  assert(updatedUser.department === "LIGHTING", "User department did not update");
  assert(updatedUser.designation === "LEAD", "User designation did not update");

  const permissionRows = await userService.listUserPermissions(createdUser.id);
  assert(permissionRows.length === 2, "Permission overrides were not updated correctly");
  assert(permissionRows.some((row) => row.module === "projects" && row.canCreate && row.canUpdate), "Project permission override missing expected flags");

  console.log("[4/7] Deactivating and reactivating user");
  await userService.updateUser(createdUser.id, {
    ...updateInput,
    isActive: false,
  });
  const blockedLogin = await authService.validateCredentials(updatedEmail, initialPassword);
  assert(blockedLogin === null, "Inactive user should not be able to log in");

  await userService.updateUser(createdUser.id, {
    ...updateInput,
    isActive: true,
  });
  const reactivatedLogin = await authService.validateCredentials(updatedUsername, initialPassword);
  assert(reactivatedLogin?.id === createdUser.id, "Reactivated user could not log in");

  console.log("[5/7] Resetting password and verifying credential rotation");
  const tokenPayload = await authService.createPasswordResetToken(updatedEmail);
  assert(tokenPayload?.token, "Password reset token was not created");
  const resetWorked = await authService.resetPasswordWithToken(tokenPayload.token, resetPassword);
  assert(resetWorked, "Password reset failed");

  const oldPasswordLogin = await authService.validateCredentials(updatedUsername, initialPassword);
  assert(oldPasswordLogin === null, "Old password should stop working after reset");
  const newPasswordLogin = await authService.validateCredentials(updatedEmail, resetPassword);
  assert(newPasswordLogin?.id === createdUser.id, "New password did not work after reset");

  console.log("[6/7] Soft deleting user and verifying access is revoked");
  await userService.softDeleteUser(createdUser.id);
  const deletedLogin = await authService.validateCredentials(updatedEmail, resetPassword);
  assert(deletedLogin === null, "Deleted user should not be able to log in");

  const deletedRecord = await prisma.user.findUnique({
    where: { id: createdUser.id },
    select: {
      deletedAt: true,
      isActive: true,
    },
  });
  assert(deletedRecord?.deletedAt, "Soft delete did not set deletedAt");
  assert(deletedRecord.isActive === false, "Soft delete did not deactivate the user");

  console.log("[7/7] Checking password-reset cleanup and reporting success");
  const leftoverTokens = await prisma.verificationToken.count({
    where: { identifier: updatedEmail },
  });
  assert(leftoverTokens === 0, "Verification token cleanup failed");

  console.log("User-management smoke test passed.");
}

main()
  .catch((error) => {
    console.error("User-management smoke test failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });