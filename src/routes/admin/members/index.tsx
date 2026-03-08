import { createFileRoute } from "@tanstack/react-router";
import { getMembers } from "~/lib/server-fns.js";
import { MembersListView } from "~/components/members-list-view.js";

type MembersSearch = {
  page: number;
  status?: string;
  search?: string;
};

export const Route = createFileRoute("/admin/members/")({
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    page: Number(search.page) || 1,
    status: typeof search.status === "string" ? search.status : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getMembers({ data: { status: deps.status, search: deps.search, page: deps.page } }),
  component: MembersList,
});

function MembersList() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <MembersListView
      rows={data.rows as any}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      statusFilter={search.status}
      searchText={search.search ?? ""}
    />
  );
}
