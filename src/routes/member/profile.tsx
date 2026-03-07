import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getMemberDashboard, updateMemberProfile } from "~/lib/server-fns.js";
import { UserCircle, Check, Pencil } from "lucide-react";
import { DatePicker } from "~/components/ui/date-picker.js";

export const Route = createFileRoute("/member/profile")({
  loader: () => getMemberDashboard(),
  component: ProfilePage,
});

function ProfilePage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <UserCircle className="h-12 w-12 text-txt3" />
        <p className="mt-4 text-sm text-txt2">Profile not found.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const form = new FormData(e.currentTarget);

    await updateMemberProfile({
      data: {
        name: form.get("name") as string,
        phone: form.get("phone") as string,
        nric: form.get("nric") as string,
        dob: form.get("dob") as string,
        address: form.get("address") as string,
        postalCode: form.get("postalCode") as string,
      },
    });

    setSuccess(true);
    setLoading(false);
    setEditing(false);
    router.invalidate();
  };

  const m = data.member;

  const formatDate = (val: string | null | undefined) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
        My Profile
      </h2>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-g1/10 px-4 py-3 text-sm font-medium text-g1">
          <Check className="h-4 w-4" />
          Profile updated successfully.
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ProfileField
            label="Full Name"
            name="name"
            defaultValue={m.name ?? ""}
          />
          <ProfileField
            label="NRIC"
            name="nric"
            defaultValue={m.nric ?? ""}
            placeholder="e.g. S1234567A"
          />
          <ProfileField
            label="Date of Birth"
            name="dob"
            type="date"
            defaultValue={m.dob ?? ""}
          />
          <ProfileField
            label="Phone Number"
            name="phone"
            type="tel"
            defaultValue={m.phone ?? ""}
          />
          <ProfileField
            label="Address"
            name="address"
            defaultValue={m.address ?? ""}
          />
          <ProfileField
            label="Postal Code"
            name="postalCode"
            defaultValue={m.postalCode ?? ""}
            inputMode="numeric"
          />

          <p className="text-xs text-txt3">
            Email: {m.email}
          </p>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110 disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gd transition-all hover:bg-gray-50 sm:w-auto sm:px-8"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <dl className="divide-y divide-gray-100">
            {([
              ["Full Name", m.name],
              ["NRIC", m.nric],
              ["Date of Birth", formatDate(m.dob)],
              ["Phone Number", m.phone],
              ["Address", m.address],
              ["Postal Code", m.postalCode],
              ["Email", m.email],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 px-5 py-3.5">
                <dt className="text-xs font-semibold text-gd/70">{label}</dt>
                <dd className="text-sm text-gd">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          <div className="px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={() => { setEditing(true); setSuccess(false); }}
              className="flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-gdeep transition-all hover:brightness-110"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "text";
}) {
  if (type === "date") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gd/70">{label}</label>
        <DatePicker
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder ?? "Pick a date"}
          className="h-auto rounded-xl border-gray-200 px-4 py-3 text-gd hover:bg-white focus-visible:border-g1 focus-visible:ring-g1/10"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-gd/70">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gd placeholder-txt3 outline-none transition-all focus:border-g1 focus:ring-2 focus:ring-g1/10"
      />
    </div>
  );
}
