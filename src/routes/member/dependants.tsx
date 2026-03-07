import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getMemberDependants,
  addDependant,
  removeDependant,
} from "~/lib/server-fns.js";
import { Plus, X, Users, Heart, UserPlus, Shield } from "lucide-react";
import { DatePicker } from "~/components/ui/date-picker.js";

export const Route = createFileRoute("/member/dependants")({
  loader: () => getMemberDependants(),
  component: DependantsPage,
});

const relationshipLabels: Record<string, string> = {
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  in_law: "Parent-in-law",
  sibling: "Sibling",
};

function DependantsPage() {
  const { dependants: deps, canAdd, memberId } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberId) return;
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await addDependant({
        data: {
          memberId,
          name: form.get("name") as string,
          dob: (form.get("dob") as string) || undefined,
          relationship: form.get("relationship") as
            | "spouse"
            | "child"
            | "parent"
            | "in_law"
            | "sibling",
        },
      });
      setShowForm(false);
      router.invalidate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add dependant",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    await removeDependant({ data: id });
    router.invalidate();
    setRemoving(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
          Family Members
        </h2>
        {canAdd && !showForm && deps.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-g1 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-g2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {/* No subscription */}
      {!memberId && (
        <EmptyState
          icon={<Shield className="h-8 w-8 text-txt3" />}
          title="No active subscription"
          desc="Contact the mosque to get started."
        />
      )}

      {/* Plan doesn't support dependants */}
      {memberId && !canAdd && deps.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8 text-txt3" />}
          title="Family coverage not included"
          desc="Upgrade to Skim Pintar Plus ($20/mo) to add family members to your coverage."
        />
      )}

      {/* Can add but no deps yet */}
      {memberId && canAdd && deps.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 py-10 cursor-pointer transition-all hover:border-g1/40"
        >
          <UserPlus className="h-8 w-8 text-txt3" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gd">
              Add your first family member
            </p>
            <p className="mt-0.5 text-xs text-txt2">
              Extend your coverage to loved ones
            </p>
          </div>
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-g1/20 bg-white p-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Siti binte Ahmad"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd placeholder-txt3 outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Date of Birth
              </label>
              <DatePicker
                name="dob"
                placeholder="Pick a date"
                className="h-auto rounded-xl border-gray-200 px-4 py-3 text-gd hover:bg-white focus-visible:border-g1 focus-visible:ring-g1/10"
                captionLayout="dropdown"
                fromYear={1930}
                toYear={new Date().getFullYear()}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gd/70">
                Relationship <span className="text-red-400">*</span>
              </label>
              <select
                name="relationship"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="in_law">Parent-in-law</option>
                <option value="sibling">Sibling</option>
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-g1 py-3 text-sm font-bold text-white transition-all hover:bg-g2 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Member"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-txt2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of dependants */}
      {deps.length > 0 && (
        <div className="flex flex-col gap-3">
          {deps.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-g1/10">
                <Heart className="h-5 w-5 text-g1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gd">{d.name}</p>
                <p className="text-xs text-txt3">
                  {relationshipLabels[d.relationship] || d.relationship}
                  {d.dob && (
                    <>
                      {" "}
                      &middot; Born{" "}
                      {new Date(d.dob).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleRemove(d.id)}
                disabled={removing === d.id}
                className="rounded-lg p-2 text-txt3 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-gd">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-txt2">{desc}</p>
    </div>
  );
}
