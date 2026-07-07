import ActivityTimeline from "./ActivityTimeline";

type RecentActivityProps = {
	activities: Array<{
		time: string;
		user: string;
		task: string;
	}>;
};

export default function RecentActivity({ activities }: RecentActivityProps) {
	return <ActivityTimeline activities={activities} />;
}
