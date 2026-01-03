import ActivityFeed from '../../../components/ActivityFeed';

export default function ActivityFeedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Activity Feed
                    </h1>
                    <p className="text-gray-600">
                        Real-time stream of all CRM activities
                    </p>
                </div>

                <ActivityFeed />
            </div>
        </div>
    );
}
