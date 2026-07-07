import type { ReportQuerySchema } from "@/features/reports/schemas/report-query.schema";
import { prisma } from "@/lib/prisma";

function getDateRange(input: ReportQuerySchema): { from: Date; to: Date } {
	const to = input.to ? new Date(input.to) : new Date();
	const from = input.from
		? new Date(input.from)
		: new Date(new Date().setDate(new Date().getDate() - 7));

	return { from, to };
}

export const reportService = {
	async generate(input: ReportQuerySchema) {
		const { from, to } = getDateRange(input);

		const whereDate = {
			gte: from,
			lte: to,
		};

		if (input.type === "project-progress") {
			const projects = await prisma.project.findMany({
				where: {
					deletedAt: null,
					...(input.projectId ? { id: input.projectId } : {}),
				},
				select: {
					id: true,
					code: true,
					name: true,
					status: true,
					shots: {
						where: { deletedAt: null },
						select: { id: true, status: true },
					},
				},
			});

			return projects.map((project) => {
				const totalShots = project.shots.length;
				const completedShots = project.shots.filter((shot) => shot.status === "APPROVED" || shot.status === "DELIVERED").length;
				const progressPercent = totalShots === 0 ? 0 : (completedShots / totalShots) * 100;

				return {
					projectId: project.id,
					projectCode: project.code,
					projectName: project.name,
					status: project.status,
					totalShots,
					completedShots,
					progressPercent,
				};
			});
		}

		if (input.type === "shot-status-summary") {
			return prisma.shot.groupBy({
				by: ["status"],
				where: {
					deletedAt: null,
					...(input.projectId ? { projectId: input.projectId } : {}),
					updatedAt: whereDate,
				},
				_count: { _all: true },
			});
		}

		if (input.type === "artist-workload") {
			const artists = await prisma.artist.findMany({
				where: { deletedAt: null },
				select: {
					id: true,
					fullName: true,
					department: true,
					tasks: {
						where: {
							deletedAt: null,
							...(input.projectId ? { projectId: input.projectId } : {}),
						},
						select: { id: true, status: true },
					},
					timeLogs: {
						where: {
							deletedAt: null,
							...(input.projectId ? { projectId: input.projectId } : {}),
							logDate: whereDate,
						},
						select: { minutesSpent: true },
					},
				},
			});

			return artists.map((artist) => ({
				artistId: artist.id,
				artistName: artist.fullName,
				department: artist.department,
				totalTasks: artist.tasks.length,
				openTasks: artist.tasks.filter((task) => task.status !== "COMPLETED").length,
				hoursLogged: artist.timeLogs.reduce((sum, item) => sum + item.minutesSpent, 0) / 60,
			}));
		}

		if (input.type === "department-progress") {
			const artists = await prisma.artist.findMany({
				where: { deletedAt: null },
				select: {
					department: true,
					tasks: {
						where: {
							deletedAt: null,
							...(input.projectId ? { projectId: input.projectId } : {}),
						},
						select: { status: true },
					},
				},
			});

			const summary = artists.reduce<Record<string, { total: number; completed: number }>>((acc, artist) => {
				const key = artist.department;
				if (!acc[key]) {
					acc[key] = { total: 0, completed: 0 };
				}

				acc[key].total += artist.tasks.length;
				acc[key].completed += artist.tasks.filter((task) => task.status === "COMPLETED").length;

				return acc;
			}, {});

			return Object.entries(summary).map(([department, totals]) => ({
				department,
				totalTasks: totals.total,
				completedTasks: totals.completed,
				progressPercent: totals.total === 0 ? 0 : (totals.completed / totals.total) * 100,
			}));
		}

		if (input.type === "time-log") {
			const logs = await prisma.timeLog.findMany({
				where: {
					deletedAt: null,
					...(input.projectId ? { projectId: input.projectId } : {}),
					logDate: whereDate,
				},
				select: {
					id: true,
					logDate: true,
					minutesSpent: true,
					status: true,
					project: { select: { code: true } },
					artist: { select: { fullName: true } },
					task: { select: { taskName: true } },
				},
				orderBy: { logDate: "desc" },
			});

			const totalHours = logs.reduce((sum, item) => sum + item.minutesSpent, 0) / 60;

			return {
				totalHours,
				entryCount: logs.length,
				entries: logs.map((log) => ({
					id: log.id,
					date: log.logDate,
					projectCode: log.project.code,
					artistName: log.artist.fullName,
					taskName: log.task.taskName,
					status: log.status,
					hours: log.minutesSpent / 60,
				})),
			};
		}

		if (input.type === "task-completion") {
			const grouped = await prisma.shotTask.groupBy({
				by: ["status"],
				where: {
					deletedAt: null,
					...(input.projectId ? { projectId: input.projectId } : {}),
					updatedAt: whereDate,
				},
				_count: { _all: true },
			});

			const total = grouped.reduce((sum, row) => sum + row._count._all, 0);
			const completed = grouped.find((row) => row.status === "COMPLETED")?._count._all ?? 0;

			return {
				totalTasks: total,
				completedTasks: completed,
				completionPercent: total === 0 ? 0 : (completed / total) * 100,
				breakdown: grouped,
			};
		}

		if (input.type === "shot-progress") {
			return prisma.shot.groupBy({
				by: ["status"],
				where: {
					deletedAt: null,
					...(input.projectId ? { projectId: input.projectId } : {}),
					updatedAt: whereDate,
				},
				_count: {
					_all: true,
				},
			});
		}

		if (input.type === "artist-utilization") {
			return prisma.dailyUpdate.groupBy({
				by: ["userId"],
				where: {
					deletedAt: null,
					...(input.projectId ? { projectId: input.projectId } : {}),
					createdAt: whereDate,
				},
				_sum: {
					hoursWorked: true,
				},
				_count: {
					_all: true,
				},
			});
		}

		if (input.type === "department-utilization") {
			return prisma.userTeam.groupBy({
				by: ["teamId"],
				where: {
					deletedAt: null,
				},
				_count: {
					_all: true,
				},
			});
		}

		if (input.type === "client") {
			return prisma.project.findMany({
				where: {
					deletedAt: null,
					...(input.projectId ? { id: input.projectId } : {}),
				},
				select: {
					id: true,
					name: true,
					code: true,
					client: true,
					status: true,
					deliveryDate: true,
				},
			});
		}

		return prisma.dailyUpdate.groupBy({
			by: ["status"],
			where: {
				deletedAt: null,
				...(input.projectId ? { projectId: input.projectId } : {}),
				createdAt: whereDate,
			},
			_sum: {
				hoursWorked: true,
			},
			_count: {
				_all: true,
			},
		});
	},
};
