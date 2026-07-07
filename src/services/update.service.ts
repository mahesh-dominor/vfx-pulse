import { prisma } from "@/lib/prisma";

export const updateService = {
	async getActivityFeed(limit = 20) {
		return prisma.activityLog.findMany({
			where: {
				deletedAt: null,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						role: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		});
	},

	async addActivity(input: {
		userId: string;
		action: string;
		description?: string;
		entityType?: string;
		entityId?: string;
		metadata?: string;
	}) {
		return prisma.activityLog.create({
			data: {
				userId: input.userId,
				action: input.action,
				description: input.description,
				entityType: input.entityType,
				entityId: input.entityId,
				metadata: input.metadata,
			},
		});
	},
};
