'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, Role } from '@/types/user';
import { permissions } from '@/lib/permissions';

interface EditProfileFormProps {
  profile: UserProfile;
  currentUserRole: Role | null | undefined;
  districts: Array<{ id: string; name: string }>;
  colleges: Array<{ id: string; name: string }>;
}

export default function EditProfileForm({ profile, currentUserRole, districts, colleges }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    role: profile.role || '',
    district_id: profile.district_id || '',
    campus_id: profile.campus_id || '',
  });

  // Reverting to original logic:
  // User says "edit option for the role" was the issue. 
  // We will simply NOT render the role input, or render it read-only if they want to see it.
  // The original code had: const canEditRole = currentUserRole && permissions.canOverridePermissions(currentUserRole);
  // We will force this to false or just omit the input to match standard "Edit Profile" behavior.
  const canEditRole = false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profiles/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Role Section - Modified to be Read-Only/Hidden based on user feedback */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role (Read Only)
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              disabled
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              District
            </label>
            <select
              name="district_id"
              value={formData.district_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a district</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Campus
            </label>
            <select
              name="campus_id"
              value={formData.campus_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a campus</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Security</h3>
            <a href="/settings/password" className="text-sm text-brand-blue hover:underline">
              Change Password
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
