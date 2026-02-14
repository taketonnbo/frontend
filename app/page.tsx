import TrashCalendar from '@/components/TrashCalendar';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-4 tracking-tight drop-shadow-sm">
            Nexus ゴミ分別マネージャー
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            スマートなゴミ管理をシンプルに。地域のゴミ収集カレンダーをアップロードして、収集日を二度と逃しません。
          </p>
        </div>

        <TrashCalendar />
      </div>
    </main>
  );
}
