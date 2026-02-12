import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { apiClient } from "../../lib/api-client";

type Member = {
  id: number;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

type Location = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
};

type MemberListResponse = { items: Member[] };
type LocationListResponse = { items: Location[] };

function SettingsPage() {
  const queryClient = useQueryClient();
  const [memberName, setMemberName] = useState("");
  const [memberAvatar, setMemberAvatar] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient.get<MemberListResponse>("/members")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiClient.get<LocationListResponse>("/locations")
  });

  const createMember = useMutation({
    mutationFn: (payload: { name: string; avatarUrl?: string | null }) =>
      apiClient.post<Member>("/members", payload),
    onSuccess: () => {
      setMemberName("");
      setMemberAvatar("");
      queryClient.invalidateQueries({ queryKey: ["members"] });
    }
  });

  const createLocation = useMutation({
    mutationFn: (payload: { name: string; description?: string | null }) =>
      apiClient.post<Location>("/locations", payload),
    onSuccess: () => {
      setLocationName("");
      setLocationDescription("");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  });

  const memberError = useMemo(() => {
    if (!createMember.error) {
      return null;
    }
    return createMember.error instanceof Error ? createMember.error.message : "Unable to add member";
  }, [createMember.error]);

  const locationError = useMemo(() => {
    if (!createLocation.error) {
      return null;
    }
    return createLocation.error instanceof Error ? createLocation.error.message : "Unable to add location";
  }, [createLocation.error]);

  return (
    <section className="space-y-8">
      <h2 className="text-lg font-bold">Settings</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold">Family Members</h3>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              createMember.mutate({
                name: memberName,
                avatarUrl: memberAvatar.trim() ? memberAvatar.trim() : null
              });
            }}
          >
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Name"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              required
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Avatar URL or emoji"
              value={memberAvatar}
              onChange={(event) => setMemberAvatar(event.target.value)}
            />
            <button
              className="rounded bg-red-600 px-3 py-2 font-semibold text-white"
              type="submit"
              disabled={createMember.isPending}
            >
              {createMember.isPending ? "Adding..." : "Add Member"}
            </button>
            {memberError ? <p className="text-sm text-red-600">{memberError}</p> : null}
          </form>
          <ul className="mt-4 space-y-2">
            {(membersQuery.data?.items ?? []).map((member) => (
              <li key={member.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
                <span className="font-semibold">{member.name}</span>
                {member.avatarUrl ? <span className="ml-2">{member.avatarUrl}</span> : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold">Locations</h3>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              createLocation.mutate({
                name: locationName,
                description: locationDescription.trim() ? locationDescription.trim() : null
              });
            }}
          >
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Location name"
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              required
            />
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Description"
              value={locationDescription}
              onChange={(event) => setLocationDescription(event.target.value)}
            />
            <button
              className="rounded bg-red-600 px-3 py-2 font-semibold text-white"
              type="submit"
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? "Adding..." : "Add Location"}
            </button>
            {locationError ? <p className="text-sm text-red-600">{locationError}</p> : null}
          </form>
          <ul className="mt-4 space-y-2">
            {(locationsQuery.data?.items ?? []).map((location) => (
              <li key={location.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
                <p className="font-semibold">{location.name}</p>
                {location.description ? <p className="text-gray-600">{location.description}</p> : null}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage
});
