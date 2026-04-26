export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Пользователи</h1>
      <p className="text-sm text-zinc-600">Роли: SUPER_ADMIN, STORE_MANAGER, CUSTOMER — user-service.</p>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        Здесь будет таблица
      </div>
    </div>
  );
}
