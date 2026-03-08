import { createFileRoute } from "@tanstack/react-router";
import { getMembers } from "~/lib/server-fns.js";
import { MembersListView } from "~/components/members-list-view.js";

type MembersSearch = {
  status?: string;
};

export const Route = createFileRoute("/admin/members/")({
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => getMembers({ data: { status: deps.status } }),
  component: MembersList,
});

function MembersList() {
  const members = Route.useLoaderData();
  const { status } = Route.useSearch();
  return <MembersListView members={members as any} statusFilter={status} />;
}
