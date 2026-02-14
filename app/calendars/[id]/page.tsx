import TrashCalendar from '@/components/TrashCalendar';

export default async function CalendarDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+ allows async params in server components, wait for them.
    const { id } = await params;
    const calendarId = parseInt(id);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <TrashCalendar calendarId={calendarId} />
            </div>
        </div>
    );
}
