import bcrypt from "bcryptjs";
import crypto from "crypto";

import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from "@/constants/auth";

export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

async function findActiveUserByEmail(email: string) {
	return prisma.user.findUnique({
		where: {
			email: normalizeEmail(email),
		},
		select: {
			id: true,
			name: true,
			email: true,
			password: true,
			role: true,
			isActive: true,
			deletedAt: true,
		},
	});
}

async function validateCredentials(
	email: string,
	password: string
): Promise<AuthenticatedUser | null> {
	const user = await findActiveUserByEmail(email);

	if (!user || !user.isActive || user.deletedAt !== null) {
		return null;
	}

	const validPassword = await bcrypt.compare(password, user.password);

	if (!validPassword) {
		return null;
	}

	await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			lastLogin: new Date(),
		},
	});

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};
}

function hashResetToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

async function createPasswordResetToken(email: string): Promise<{
	token: string;
	expiresAt: Date;
} | null> {
	const user = await findActiveUserByEmail(email);

	if (!user || !user.isActive || user.deletedAt !== null) {
		return null;
	}

	const token = crypto.randomBytes(32).toString("hex");
	const tokenHash = hashResetToken(token);
	const expiresAt = new Date(
		Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
	);

	await prisma.$transaction([
		prisma.verificationToken.deleteMany({
			where: {
				identifier: user.email,
			},
		}),
		prisma.verificationToken.create({
			data: {
				identifier: user.email,
				token: tokenHash,
				expires: expiresAt,
			},
		}),
	]);

	return {
		token,
		expiresAt,
	};
}

async function resetPasswordWithToken(
	token: string,
	newPassword: string
): Promise<boolean> {
	const tokenHash = hashResetToken(token);

	const verificationToken = await prisma.verificationToken.findUnique({
		where: {
			token: tokenHash,
		},
	});

	if (!verificationToken || verificationToken.expires < new Date()) {
		return false;
	}

	const user = await prisma.user.findUnique({
		where: {
			email: verificationToken.identifier,
		},
		select: {
			id: true,
			isActive: true,
			deletedAt: true,
		},
	});

	if (!user || !user.isActive || user.deletedAt !== null) {
		return false;
	}

	const hashedPassword = await bcrypt.hash(newPassword, 12);

	await prisma.$transaction([
		prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				password: hashedPassword,
			},
		}),
		prisma.verificationToken.delete({
			where: {
				token: tokenHash,
			},
		}),
	]);

	return true;
}

export const authService = {
	validateCredentials,
	createPasswordResetToken,
	resetPasswordWithToken,
};
