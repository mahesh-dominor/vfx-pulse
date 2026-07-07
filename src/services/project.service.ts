import type { ProjectSchema } from "@/features/projects/schemas/project.schema";
import { prisma } from "@/lib/prisma";

export const projectService = {
	async listProjects(options?: { activeOnly?: boolean }) {
		return prisma.project.findMany({
			where: {
				deletedAt: null,
				...(options?.activeOnly ? { status: "ACTIVE" } : {}),
			},
			include: {
				producer: {
					select: { id: true, name: true, email: true },
				},
				_count: {
					select: { sequences: true, shots: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	},

	async createProject(input: ProjectSchema) {
		return prisma.project.create({
			data: {
				name: input.name,
				code: input.code,
				description: input.description,
				client: input.client,
				status: input.status,
				producerId: input.producerId,
				startDate: input.startDate ? new Date(input.startDate) : null,
				deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
				fps: input.fps,
				resolution: input.resolution,
				colorSpace: input.colorSpace,
			},
		});
	},

	async updateProject(id: string, input: ProjectSchema) {
		return prisma.project.update({
			where: { id },
			data: {
				name: input.name,
				code: input.code,
				description: input.description,
				client: input.client,
				status: input.status,
				producerId: input.producerId,
				startDate: input.startDate ? new Date(input.startDate) : null,
				deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
				fps: input.fps,
				resolution: input.resolution,
				colorSpace: input.colorSpace,
			},
		});
	},

	async updateProjectStatus(
		id: string,
		status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED"
	) {
		return prisma.project.update({
			where: { id },
			data: { status },
		});
	},

	async softDeleteProject(id: string) {
		return prisma.project.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	},

	async hardDeleteProject(id: string) {
		return prisma.project.delete({
			where: { id },
		});
	},
};
