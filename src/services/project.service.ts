import type { ProjectSchema } from "@/features/projects/schemas/project.schema";
import { prisma } from "@/lib/prisma";

export const projectService = {
	async listProjects(options?: { activeOnly?: boolean }) {
		const projects = await prisma.project.findMany({
			where: {
				deletedAt: null,
				...(options?.activeOnly ? { status: "ACTIVE" } : {}),
			},
			select: {
				id: true,
				code: true,
				name: true,
				description: true,
				client: true,
				productionHouse: true,
				priority: true,
				status: true,
				producerId: true,
				startDate: true,
				deliveryDate: true,
				createdAt: true,
				updatedAt: true,
				producer: {
					select: { id: true, name: true, email: true },
				},
				shots: {
					where: { deletedAt: null },
					select: { status: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return projects.map((project) => {
			const totalShots = project.shots.length;
			const completedShots = project.shots.filter(
				(shot) => shot.status === "APPROVED" || shot.status === "DELIVERED"
			).length;
			const progressPercent = totalShots === 0 ? 0 : Math.round((completedShots / totalShots) * 100);
			const dueDate = project.deliveryDate?.toISOString() ?? null;
			const isDelayed =
				project.deliveryDate !== null &&
				project.deliveryDate.getTime() < Date.now() &&
				project.status !== "COMPLETED" &&
				project.status !== "ARCHIVED";

			return {
				id: project.id,
				code: project.code,
				name: project.name,
				description: project.description,
				client: project.client,
				productionHouse: project.productionHouse,
				priority: project.priority,
				status: project.status,
				producerId: project.producerId,
				producer: project.producer,
				startDate: project.startDate?.toISOString() ?? null,
				deliveryDate: dueDate,
				createdAt: project.createdAt.toISOString(),
				updatedAt: project.updatedAt.toISOString(),
				totalShots,
				completedShots,
				progressPercent,
				isDelayed,
			};
		});
	},

	async listProjectProducers() {
		return prisma.user.findMany({
			where: {
				deletedAt: null,
				isActive: true,
				role: "PRODUCER",
			},
			select: {
				id: true,
				name: true,
				email: true,
			},
			orderBy: { name: "asc" },
		});
	},

	async createProject(input: ProjectSchema) {
		return prisma.project.create({
			data: {
				name: input.name,
				code: input.code,
				description: input.description,
				client: input.client,
				productionHouse: input.productionHouse,
				priority: input.priority,
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
				productionHouse: input.productionHouse,
				priority: input.priority,
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
