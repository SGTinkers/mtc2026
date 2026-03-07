import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getMemberDashboard, updateMemberProfile } from "~/lib/server-fns.js";
import { UserCircle, Check } from "lucide-react";

export const Route = createFileRoute("/member/profile")({
  loader: () => getMemberDashboard(),
  component: ProfilePage,
});

function ProfilePage() {
  const data = Route.useLoaderData();
  const router = useRouter();
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
    router.invalidate();
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-[family-name:var(--font-family-heading)] text-xl font-bold text-gd lg:text-2xl">
        My Profile
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-g1/10 px-4 py-3 text-sm font-medium text-g1">
            <Check className="h-4 w-4" />
            Profile updated successfully.
          </div>
        )}

        <ProfileField
          label="Full Name"
          name="name"
          defaultValue={data.member.name ?? ""}
        />
        <ProfileField
          label="NRIC"
          name="nric"
          defaultValue={data.member.nric ?? ""}
          placeholder="e.g. S1234567A"
        />
        <ProfileField
          label="Date of Birth"
          name="dob"
          type="date"
          defaultValue={data.member.dob ?? ""}
        />
        <ProfileField
          label="Phone Number"
          name="phone"
          type="tel"
          defaultValue={data.member.phone ?? ""}
        />
        <ProfileField
          label="Address"
          name="address"
          defaultValue={data.member.address ?? ""}
        />
        <ProfileField
          label="Postal Code"
          name="postalCode"
          defaultValue={data.member.postalCode ?? ""}
          inputMode="numeric"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-gdeep transition-all hover:brightness-110 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <p className="text-xs text-txt3">
          Email: {data.member.email}
        </p>
      </form>
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
