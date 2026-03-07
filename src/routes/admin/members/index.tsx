import { createFileRoute } from "@tanstack/react-router";
import { getMembers } from "~/lib/server-fns.js";
import { MembersListView } from "~/components/members-list-view.js";

export const Route = createFileRoute("/admin/members/")({
  loader: () => getMembers(),
  component: MembersList,
});

function MembersList() {
  const members = Route.useLoaderData();
  return <MembersListView members={members as any} />;
}
